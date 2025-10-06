import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { week } = req.query;

    const db = getFirestore();
    let query = db.collection('weeklyRecords').orderBy('weekStart', 'desc');

    if (week && week !== 'all' && typeof week === 'string') {
      query = query.where('weekStart', '==', week) as any;
    }

    const snapshot = await query.get();
    const records: DriverWeeklyRecord[] = [];

    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as DriverWeeklyRecord);
    });

    // Gerar CSV
    const headers = [
      'Semana Início',
      'Semana Fim',
      'Motorista',
      'IBAN',
      'Uber Viagens (€)',
      'Uber Gorjetas (€)',
      'Uber Portagens (€)',
      'Bolt Viagens (€)',
      'Bolt Gorjetas (€)',
      'Total Bruto (€)',
      'Combustível (€)',
      'Base Comissão (€)',
      'Comissão 7% (€)',
      'Valor Líquido (€)',
      'Status',
      'Data Pagamento',
    ];

    const rows = records.map(record => [
      record.weekStart,
      record.weekEnd,
      record.driverName,
      record.iban || '',
      record.uberTrips.toFixed(2),
      record.uberTips.toFixed(2),
      record.uberTolls.toFixed(2),
      record.boltTrips.toFixed(2),
      record.boltTips.toFixed(2),
      record.grossTotal.toFixed(2),
      record.fuel.toFixed(2),
      record.commissionBase.toFixed(2),
      record.commissionAmount.toFixed(2),
      record.netPayout.toFixed(2),
      record.paymentStatus === 'paid' ? 'PAGO' : record.paymentStatus === 'cancelled' ? 'CANCELADO' : 'PENDENTE',
      record.paymentDate || '',
    ]);

    // Criar CSV com BOM para Excel reconhecer UTF-8
    const csv = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="controle-semanal-${week || 'todas'}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting weekly records:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
