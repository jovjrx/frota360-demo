import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { syncService } from '@/lib/sync/sync-service';
import { db } from '@/lib/firebaseAdmin';
import { calculateDriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  
  if (!session?.user || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { weekStart, weekEnd, driverId } = req.body;
    
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ 
        error: 'weekStart and weekEnd are required' 
      });
    }

    // Sincronizar dados de todas as plataformas
    const syncResults = await syncService.syncAll({
      startDate: weekStart,
      endDate: weekEnd,
      driverId,
    });

    // Buscar registros de fleet do período
    let query = db.collection('fleet_records')
      .where('periodStart', '>=', weekStart)
      .where('periodEnd', '<=', weekEnd);
    
    if (driverId) {
      query = query.where('driverId', '==', driverId) as any;
    }

    const fleetSnapshot = await query.get();
    
    // Agrupar por motorista e semana
    const weeklyData: Record<string, any> = {};
    
    fleetSnapshot.forEach(doc => {
      const record = doc.data();
      const key = `${record.driverId}-${weekStart}-${weekEnd}`;
      
      if (!weeklyData[key]) {
        weeklyData[key] = {
          driverId: record.driverId,
          driverName: record.driverName,
          weekStart,
          weekEnd,
          uberTrips: 0,
          uberTips: 0,
          uberTolls: 0,
          boltTrips: 0,
          boltTips: 0,
          fuel: 0,
          otherCosts: 0,
          iban: record.iban,
        };
      }
      
      // Acumular valores
      weeklyData[key].uberTrips += record.earningsUber || 0;
      weeklyData[key].uberTips += record.tipsUber || 0;
      weeklyData[key].uberTolls += record.tollsUber || 0;
      weeklyData[key].boltTrips += record.earningsBolt || 0;
      weeklyData[key].boltTips += record.tipsBolt || 0;
      weeklyData[key].fuel += record.fuel || 0;
      weeklyData[key].otherCosts += record.otherExpenses || 0;
    });

    // Criar/atualizar registros semanais
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const [key, data] of Object.entries(weeklyData)) {
      try {
        // Calcular valores
        const calculated = calculateDriverWeeklyRecord(data);
        
        // Verificar se já existe
        const existingQuery = await db.collection('driver_weekly_records')
          .where('driverId', '==', data.driverId)
          .where('weekStart', '==', weekStart)
          .where('weekEnd', '==', weekEnd)
          .limit(1)
          .get();

        if (existingQuery.empty) {
          // Criar novo
          await db.collection('driver_weekly_records').add({
            ...calculated,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          created++;
        } else {
          // Atualizar existente
          const doc = existingQuery.docs[0];
          await doc.ref.update({
            ...calculated,
            updatedAt: new Date().toISOString(),
          });
          updated++;
        }
      } catch (error: any) {
        errors.push(`Erro ao processar ${key}: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Sincronização semanal concluída',
      syncResults,
      weeklyRecords: {
        created,
        updated,
        errors,
      },
    });
  } catch (error: any) {
    console.error('Error syncing weekly driver data:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
