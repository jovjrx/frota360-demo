import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { syncService } from '@/lib/sync/sync-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  
  if (!session?.user || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { startDate, endDate, driverId, vehicleId, platforms } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate are required' 
      });
    }

    // Validar datas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }
    
    if (start > end) {
      return res.status(400).json({ 
        error: 'startDate must be before endDate' 
      });
    }

    // Executar sincronização
    const results = await syncService.syncAll({
      startDate,
      endDate,
      driverId,
      vehicleId,
      platforms,
    });

    // Calcular estatísticas
    const stats = {
      totalPlatforms: results.length,
      successfulPlatforms: results.filter(r => r.success).length,
      failedPlatforms: results.filter(r => !r.success).length,
      totalRecordsCreated: results.reduce((sum, r) => sum + r.recordsCreated, 0),
      totalRecordsUpdated: results.reduce((sum, r) => sum + r.recordsUpdated, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    };

    return res.status(200).json({
      success: true,
      message: 'Sincronização concluída',
      results,
      stats,
    });
  } catch (error: any) {
    console.error('Error syncing fleet data:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
