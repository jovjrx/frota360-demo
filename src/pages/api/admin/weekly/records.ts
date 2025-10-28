import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import type { WeeklyNormalizedData } from '@/schemas/data-weekly';
import type { Weekly } from '@/schemas/weekly';

interface WeekOption { weekId: string; label: string; status?: string }
interface Stats { total: number; pending: number; paid: number; bonusCount: number; totalAmount: number; totalBonus: number }
interface WeeklyRecordsResponse { weeks: WeekOption[]; records: DriverWeeklyRecord[]; weeklyData?: WeeklyNormalizedData[]; weeklyMaestro?: Weekly; stats: Stats }
type ApiResponse = WeeklyRecordsResponse | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const weekId = req.query.weekId as string | undefined;
  try {
    // 1. Buscar semanas disponíveis (maestro "weekly")
    const weeksSnapshot = await adminDb.collection('weekly').limit(50).get();
    const weeks = weeksSnapshot.docs
      .map((doc) => {
        const data = doc.data() as any;
        return { weekId: data.weekId, label: `Semana ${(data.weekId).split('-')[1] || data.weekId}`, status: data.status };
      })
      .sort((a, b) => b.weekId.localeCompare(a.weekId))
      .slice(0, 12);
    
    if (!weekId) return res.status(200).json({ weeks, records: [], weeklyData: [], stats: { total: 0, pending: 0, paid: 0, bonusCount: 0, totalAmount: 0, totalBonus: 0 } });
    
    // 2. Buscar maestro "weekly" para a semana selecionada
    const weeklyMaestroDoc = await adminDb.collection('weekly').doc(weekId).get();
    const weeklyMaestro = weeklyMaestroDoc.exists ? (weeklyMaestroDoc.data() as Weekly) : undefined;
    
    // ✅ SIMPLIFICADO: APENAS busca driverPayments (não faz processamento)
    // Se não tiver em driverPayments, não exibe
    // Só exibe o que foi processado e salvo
    const paymentsSnap = await adminDb
      .collection('driverPayments')
      .where('weekId', '==', weekId)
      .orderBy('driverName')
      .get();
    
    // ✅ CONVERTER: Retorna como DriverWeeklyRecord (pega do top-level + snapshot minimalista)
    const records = paymentsSnap.docs.map(doc => {
      const payment = doc.data() as any;
      const snapshot = payment.recordSnapshot || {};
      
      return {
        id: payment.id || `${weekId}_${payment.driverId}`,
        driverId: payment.driverId || snapshot.driverId,
        driverName: payment.driverName || snapshot.driverName,
        weekId: payment.weekId || snapshot.weekId,
        weekStart: payment.weekStart,
        weekEnd: payment.weekEnd,
        type: payment.type || snapshot.type || 'affiliate',
        driverType: (payment.isLocatario || snapshot.isLocatario || payment.type === 'renter' || snapshot.type === 'renter') ? 'renter' : 'affiliate',
        ganhosTotal: payment.ganhosTotal || snapshot.ganhosTotal || 0,
        uberTotal: payment.uberTotal || 0,
        boltTotal: payment.boltTotal || 0,
        prio: payment.prio || 0,
        ivaValor: payment.ivaValor || snapshot.ivaValor || 0,
        ganhosMenosIVA: payment.ganhosMenosIVA || 0,
  despesasAdm: payment.despesasAdm ?? payment.adminFeeValue ?? 0,
        commissionAmount: payment.commissionAmount || 0,
        combustivel: payment.combustivel !== undefined ? payment.combustivel : snapshot.combustivel || 0,
        viaverde: payment.portagens !== undefined ? payment.portagens : snapshot.viaverde || 0,
        portagens: payment.portagens !== undefined ? payment.portagens : (snapshot.portagens ?? snapshot.viaverde ?? 0),
        aluguel: payment.aluguel !== undefined ? payment.aluguel : snapshot.aluguel || 0,
        financingDetails: payment.financingDetails || snapshot.financingDetails,
        totalDespesas: payment.totalDespesas || 0,
        repasse: payment.repasse || 0,
        bonusMetaPending: payment.bonusMetaPending || [],
        referralBonusPending: payment.referralBonusPending || [],
        commissionPending: payment.commissionPending,
        totalBonusAmount: payment.totalBonusAmount || 0,
        bonusMetaPaid: payment.bonusMetaPaid || [],
        referralBonusPaid: payment.referralBonusPaid || [],
        platformData: payment.platformData || [],
        paymentStatus: payment.paymentStatus || 'pending',
        createdAt: payment.createdAt || new Date().toISOString(),
        updatedAt: payment.updatedAt || new Date().toISOString(),
        dataSource: payment.dataSource || 'payment',
        isLocatario: payment.isLocatario || snapshot.isLocatario || false,
      } as DriverWeeklyRecord;
    });
    
    // 4. Buscar dados brutos (dataWeekly)
    const dataWeeklySnap = await adminDb.collection('dataWeekly').where('weekId', '==', weekId).orderBy('driverName').get();
    const weeklyData = dataWeeklySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as WeeklyNormalizedData[];
    
    // 5. Calcular estatísticas
    const pending = records.filter((r) => r.paymentStatus === 'pending').length;
    const paid = records.filter((r) => r.paymentStatus === 'paid').length;
    const bonusCount = records.filter((r) => (r.totalBonusAmount || 0) > 0).length;
    const totalAmount = records.reduce((sum, r) => sum + (r.repasse || 0), 0);
    const totalBonus = records.reduce((sum, r) => sum + (r.totalBonusAmount || 0), 0);
    
    return res.status(200).json({ weeks, records, weeklyData, weeklyMaestro, stats: { total: records.length, pending, paid, bonusCount, totalAmount, totalBonus } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[GET /api/admin/weekly/records]', error);
    return res.status(500).json({ error: message });
  }
}
