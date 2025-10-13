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

    if (!recordData) {
      return res.status(404).json({ error: 'Dados do contracheque não encontrados' });
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

    // Formatar datas para o formato DD/MM/YYYY se necessário
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      // Se já está no formato correto, retorna
      if (dateStr.includes('/')) return dateStr;
      // Se está no formato ISO, converte
      const date = new Date(dateStr);
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // Preparar dados para o PDF
    const payslipData: PayslipData = {
      driverName: driverData.fullName || `${driverData.firstName} ${driverData.lastName}`,
      driverType: driverData.type || 'affiliate',
      vehiclePlate: driverData.vehicle?.plate,
      weekStart: formatDate(recordData.weekStart),
      weekEnd: formatDate(recordData.weekEnd),
      
      uberTotal: recordData.uberTotal || 0,
      boltTotal: recordData.boltTotal || 0,
      prioTotal: recordData.prio || 0,
      viaverdeTotal: recordData.viaverde || 0,
      ganhosTotal: recordData.ganhosTotal || 0,
      
      ivaValor: recordData.ivaValor || 0,
      ganhosMenosIva: recordData.ganhosMenosIVA || recordData.ganhosMenosIva || 0,
      comissao: recordData.despesasAdm || recordData.comissao || 0,
      
      combustivel: recordData.combustivel || 0,
      viaverde: recordData.viaverde || 0,
      aluguel: recordData.aluguel || 0,
      
      financingInterestPercent: recordData.financingDetails?.interestPercent,
      financingInstallment: recordData.financingDetails?.installment,
      financingInterestAmount: recordData.financingDetails?.interestAmount,
      financingTotalCost: recordData.financingDetails?.totalCost,
      
      repasse: recordData.repasse || 0,
    };

    // Gerar PDF
    console.log('[PDF] Gerando PDF com dados:', payslipData);
    const pdfBuffer = await generatePayslipPDF(payslipData);

    // Definir headers para download
    const fileName = `Contracheque_${driverData.fullName?.replace(/\s+/g, '_')}_${payslipData.weekStart.replace(/\//g, '-')}_a_${payslipData.weekEnd.replace(/\//g, '-')}.pdf`;
    
    console.log('[PDF] PDF gerado com sucesso:', fileName);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);

  } catch (error: any) {
    console.error('[PDF] Erro ao gerar PDF:', error);
    console.error('[PDF] Stack trace:', error.stack);
    return res.status(500).json({ 
      error: 'Erro ao gerar PDF',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
