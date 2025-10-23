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
    // Buscar dados do motorista e semana atual
    const db = adminDb;
    const driverDoc = await db.collection('drivers').doc(user.id).get();
    if (!driverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    const driverData = driverDoc.data() as any;
    // Buscar semana atual (ou permitir query param futuramente)
    const now = new Date();
    const weekId = `${now.getFullYear()}-W${String(Math.ceil((now.getDate() + 6 - now.getDay()) / 7)).padStart(2, '0')}`;
    // Buscar ganhos e viagens da semana (ajuste conforme seu modelo real)
    // Aqui exemplo: assume campos ganhosBrutos e viagens na collection weeklyReports
    const weeklyDoc = await db.collection('weeklyReports').doc(`${user.id}_${weekId}`).get();
    let ganhosBrutos = 0, viagens = 0;
    if (weeklyDoc.exists) {
      const w = weeklyDoc.data() as any;
      ganhosBrutos = w.ganhosBrutos || w.ganhos || 0;
      viagens = w.viagens || w.totalViagens || 0;
    }
    const dataSemana = now.getTime();
    const goals = await computeDriverGoals(user.id, driverData.fullName || user.name || '', ganhosBrutos, viagens, dataSemana);
    return res.status(200).json({
      success: true,
      driver: {
        id: user.id,
        name: user.name || '',
        type: 'driver',
      },
      goals,
    });
  } catch (e: any) {
    console.error('[api/driver/goals] error', e);
    return res.status(500).json({ success: false, error: 'Failed to load goals' });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);
