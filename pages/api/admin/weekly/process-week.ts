import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { getWeekId } from '@/schemas/driver-weekly-record';

/**
 * GET /api/admin/weekly/process-week (ou POST para compatibilidade)
 * Busca registros semanais já processados para uma dada semana.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let weekStart: string;
  let weekEnd: string;

  if (req.method === 'GET') {
    weekStart = req.query.weekStart as string;
    weekEnd = req.query.weekEnd as string;
  } else { // POST
    weekStart = req.body.weekStart;
    weekEnd = req.body.weekEnd;
  }

  if (!weekStart || !weekEnd) {
    return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
  }

  const weekId = getWeekId(new Date(weekStart));

  try {
    // Buscar os registros semanais já processados na subcoleção driverRecords
    const driverRecordsSnapshot = await db
      .collection('weeklyReports')
      .doc(weekId)
      .collection('driverRecords')
      .get();

    const records: DriverWeeklyRecord[] = driverRecordsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as DriverWeeklyRecord
    }));

    // Para compatibilidade com a interface, adicionar campos calculados se necessário
    // A interface DriverRecord no frontend espera alguns campos calculados que já estão no DriverWeeklyRecord
    const formattedRecords = records.map(record => ({
      ...record,
      ganhosTotal: record.uberTotal + record.boltTotal, // Exemplo de cálculo, se não estiver já no record
      iva: record.ivaValor, // Mapear para o nome esperado no frontend
      ganhosMenosIva: record.ganhosMenosIVA,
      despesasAdm: record.despesasAdm,
      combustivel: record.combustivel,
      portagens: record.viaverde, // ViaVerde é portagens
      aluguel: record.aluguel,
      valorLiquido: record.repasse,
      driverType: record.isLocatario ? 'renter' : 'affiliate', // Mapear tipo de motorista
      vehicle: 'N/A', // Este campo não está no DriverWeeklyRecord, pode ser buscado do driver original se necessário
      status: record.paymentStatus, // Mapear status de pagamento
    }));

    return res.status(200).json({
      success: true,
      records: formattedRecords,
      weekStart,
      weekEnd,
    });
  } catch (error: any) {
    console.error('Erro ao buscar registros semanais:', error);
    return res.status(500).json({ error: error.message });
  }
}

