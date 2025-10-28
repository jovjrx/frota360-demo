import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { computeDriverGoals } from '@/lib/goals/service';
import { adminDb } from '@/lib/firebaseAdmin';

async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;
  if (!user || user.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Usar a função centralizada getDriverWeekData para ter dados consistentes
    const { getDriverWeekData } = await import('@/lib/api/driver-week-data');
    const { getWeekId } = await import('@/lib/utils/date-helpers');
    
    const db = adminDb;
    const driverDoc = await db.collection('drivers').doc(user.id).get();
    if (!driverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    const driverData = driverDoc.data() as any;
    
    // Buscar semana atual usando função padrão do sistema
    const weekId = req.query.weekId as string || getWeekId(new Date());
    
    // Buscar dados da semana usando a função centralizada (já calcula goals internamente)
    const weekData = await getDriverWeekData(user.id, weekId, false);
    
    if (!weekData) {
      // Sem dados ainda, retornar metas sem valores
      const dataSemana = new Date().getTime();
      const goals = await computeDriverGoals(user.id, driverData.fullName || user.name || '', 0, 0, dataSemana);
      return res.status(200).json({
        success: true,
        driver: {
          id: user.id,
          name: user.name || '',
          type: 'driver',
        },
        goals,
      });
    }
    
    // Retornar goals já calculados pela função centralizada
    return res.status(200).json({
      success: true,
      driver: {
        id: user.id,
        name: user.name || '',
        type: 'driver',
      },
      goals: weekData.goals || [],
    });
  } catch (e: any) {
    console.error('[api/driver/goals] error', e);
    return res.status(500).json({ success: false, error: 'Failed to load goals' });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);

