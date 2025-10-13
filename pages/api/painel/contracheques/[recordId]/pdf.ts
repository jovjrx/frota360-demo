import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { getDriverWeekData } from '@/lib/api/driver-week-data';
import { generatePayslipPDF, PayslipData } from '@/lib/pdf/payslipGenerator';

/**
 * API para gerar PDF de contracheque
 * GET /api/painel/contracheques/[recordId]/pdf
 * 
 * ATUALIZADO: Usa função centralizada getDriverWeekData para sempre ter dados frescos
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

    // recordId formato: driverId_weekId (ex: abc123_2024-W40)
    const [driverId, weekId] = recordId.split('_');

    if (!driverId || !weekId) {
      return res.status(400).json({ error: 'Record ID formato inválido. Esperado: driverId_weekId' });
    }

    console.log(`[PDF] Gerando contracheque para ${driverId} semana ${weekId}`);

    // Buscar dados usando função centralizada (sempre atualizado!)
    const recordData = await getDriverWeekData(driverId, weekId);

    if (!recordData) {
      return res.status(404).json({ error: 'Contracheque não encontrado' });
    }

    // Formatar datas para o formato DD/MM/YYYY
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      if (dateStr.includes('/')) return dateStr;
      const date = new Date(dateStr);
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // Preparar dados para o PDF
    const payslipData: PayslipData = {
      driverName: recordData.driverName,
      driverType: recordData.isLocatario ? 'renter' : 'affiliate',
      vehiclePlate: (recordData as any).vehicle || undefined,
      weekStart: formatDate(recordData.weekStart),
      weekEnd: formatDate(recordData.weekEnd),
      
      uberTotal: recordData.uberTotal || 0,
      boltTotal: recordData.boltTotal || 0,
      prioTotal: recordData.prio || 0,
      viaverdeTotal: recordData.viaverde || 0,
      ganhosTotal: recordData.ganhosTotal || 0,
      
      ivaValor: recordData.ivaValor || 0,
      ganhosMenosIva: recordData.ganhosMenosIVA || 0,
      comissao: recordData.despesasAdm || 0,
      
      combustivel: recordData.combustivel || 0,
      viaverde: recordData.viaverde || 0,
      aluguel: recordData.aluguel || 0,
      
      financingInterestPercent: recordData.financingDetails?.interestPercent,
      financingInstallment: recordData.financingDetails?.installment,
      financingInterestAmount: recordData.financingDetails?.interestAmount !== undefined
        ? recordData.financingDetails.interestAmount
        : (recordData.financingDetails?.installment && recordData.financingDetails?.interestPercent 
            ? recordData.financingDetails.installment * (recordData.financingDetails.interestPercent / 100)
            : 0),
      financingTotalCost: recordData.financingDetails?.totalCost !== undefined
        ? recordData.financingDetails.totalCost
        : (recordData.financingDetails?.installment 
            ? recordData.financingDetails.installment + 
              (recordData.financingDetails?.interestPercent 
                ? recordData.financingDetails.installment * (recordData.financingDetails.interestPercent / 100)
                : 0)
            : 0),
      
      repasse: recordData.repasse || 0,
    };

    // Gerar PDF
    console.log('[PDF] Gerando PDF com dados:', payslipData);
    console.log('[PDF] Financing details from DB:', recordData.financingDetails);
    const pdfBuffer = await generatePayslipPDF(payslipData);

    // Definir headers para download
    const fileName = `Contracheque_${recordData.driverName.replace(/\s+/g, '_')}_${payslipData.weekStart.replace(/\//g, '-')}_a_${payslipData.weekEnd.replace(/\//g, '-')}.pdf`;
    
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
