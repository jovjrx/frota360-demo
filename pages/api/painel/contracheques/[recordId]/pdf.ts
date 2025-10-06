import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';
import { generatePayslipPDF, PayslipData } from '@/lib/pdf/payslipGenerator';

/**
 * API para gerar PDF de contracheque
 * GET /api/painel/contracheques/[recordId]/pdf
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { recordId } = req.query;

    if (!recordId || typeof recordId !== 'string') {
      return res.status(400).json({ error: 'Record ID inválido' });
    }

    // Buscar registro
    const recordDoc = await adminDb
      .collection('driverWeeklyRecords')
      .doc(recordId)
      .get();

    if (!recordDoc.exists) {
      return res.status(404).json({ error: 'Contracheque não encontrado' });
    }

    const recordData = recordDoc.data();

    // Verificar se o motorista é o dono do registro (se não for admin)
    if (session.role !== 'admin' && recordData.driverId !== session.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar dados do motorista
    const driverDoc = await adminDb
      .collection('drivers')
      .doc(recordData.driverId)
      .get();

    if (!driverDoc.exists) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const driverData = driverDoc.data();

    // Preparar dados para o PDF
    const payslipData: PayslipData = {
      driverName: driverData.fullName || `${driverData.firstName} ${driverData.lastName}`,
      driverType: driverData.type || 'affiliate',
      vehiclePlate: driverData.vehicle?.plate,
      weekStart: new Date(recordData.weekStart).toLocaleDateString('pt-BR'),
      weekEnd: new Date(recordData.weekEnd).toLocaleDateString('pt-BR'),
      
      uberTotal: recordData.uberTotal || 0,
      boltTotal: recordData.boltTotal || 0,
      ganhosTotal: recordData.ganhosTotal || 0,
      
      ivaValor: recordData.ivaValor || 0,
      ganhosMenosIva: recordData.ganhosMenosIva || 0,
      comissao: recordData.comissao || 0,
      
      combustivel: recordData.combustivel || 0,
      viaverde: recordData.viaverde || 0,
      aluguel: recordData.aluguel || 0,
      
      repasse: recordData.repasse || 0,
      
      iban: driverData.banking?.iban || 'N/A',
      status: recordData.status || 'pending',
    };

    // Gerar PDF
    const pdfBuffer = await generatePayslipPDF(payslipData);

    // Definir headers para download
    const fileName = `Contracheque_${driverData.fullName?.replace(/\s+/g, '_')}_${payslipData.weekStart.replace(/\//g, '-')}_a_${payslipData.weekEnd.replace(/\//g, '-')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar PDF',
      details: error.message 
    });
  }
}
