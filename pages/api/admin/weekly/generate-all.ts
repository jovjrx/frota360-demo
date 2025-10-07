import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { getWeekId } from '@/schemas/driver-weekly-record';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// Função auxiliar para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { weekStart, weekEnd } = req.body;

  if (!weekStart || !weekEnd) {
    return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
  }

  const weekId = getWeekId(new Date(weekStart));

  try {
    // 1. Buscar todos os registros semanais de motoristas para a semana
    const driverRecordsSnapshot = await adminDb
      .collection('weeklyReports')
      .doc(weekId)
      .collection('driverRecords')
      .get();

    const records: DriverWeeklyRecord[] = driverRecordsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as DriverWeeklyRecord
    }));

    if (records.length === 0) {
      return res.status(404).json({ message: 'Nenhum registro semanal encontrado para esta semana.' });
    }

    // Configurar o arquivador ZIP
    const archive = archiver('zip', { zlib: { level: 9 } });
    const archiveName = `relatorios_semanais_${weekStart}_a_${weekEnd}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    // ============================================================================
    // GERAR EXCEL
    // ============================================================================

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Controlo Semanal');

    // Cabeçalhos
    worksheet.columns = [
      { header: 'Motorista', key: 'driverName', width: 30 },
      { header: 'Tipo', key: 'driverType', width: 12 },
      { header: 'Uber Total', key: 'uberTotal', width: 12 },
      { header: 'Bolt Total', key: 'boltTotal', width: 12 },
      { header: 'Ganhos Total', key: 'ganhosTotal', width: 14 },
      { header: 'IVA 6%', key: 'ivaValor', width: 12 },
      { header: 'Ganhos - IVA', key: 'ganhosMenosIVA', width: 14 },
      { header: 'Despesas Adm. 7%', key: 'despesasAdm', width: 16 },
      { header: 'Combustível', key: 'combustivel', width: 12 },
      { header: 'Portagens', key: 'viaverde', width: 12 },
      { header: 'Aluguel', key: 'aluguel', width: 12 },
      { header: 'Valor Líquido', key: 'repasse', width: 14 },
      { header: 'IBAN', key: 'iban', width: 30 },
      { header: 'Status', key: 'paymentStatus', width: 12 },
    ];

    // Adicionar dados
    records.forEach((record: DriverWeeklyRecord) => {
      worksheet.addRow({
        driverName: record.driverName,
        driverType: record.isLocatario ? 'Locatário' : 'Afiliado',
        uberTotal: record.uberTotal,
        boltTotal: record.boltTotal,
        ganhosTotal: record.ganhosTotal,
        ivaValor: record.ivaValor,
        ganhosMenosIVA: record.ganhosMenosIVA,
        despesasAdm: record.despesasAdm,
        combustivel: record.combustivel,
        viaverde: record.viaverde,
        aluguel: record.aluguel,
        repasse: record.repasse,
        iban: record.iban,
        paymentStatus: record.paymentStatus === 'pending' ? 'PENDENTE' : record.paymentStatus === 'paid' ? 'PAGO' : 'CANCELADO',
      });
    });

    // Adicionar linha de total
    const totals = records.reduce((acc: any, record: DriverWeeklyRecord) => ({
      uberTotal: acc.uberTotal + record.uberTotal,
      boltTotal: acc.boltTotal + record.boltTotal,
      ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
      ivaValor: acc.ivaValor + record.ivaValor,
      ganhosMenosIVA: acc.ganhosMenosIVA + record.ganhosMenosIVA,
      despesasAdm: acc.despesasAdm + record.despesasAdm,
      combustivel: acc.combustivel + record.combustivel,
      viaverde: acc.viaverde + record.viaverde,
      aluguel: acc.aluguel + record.aluguel,
      repasse: acc.repasse + record.repasse,
    }), {
      uberTotal: 0,
      boltTotal: 0,
      ganhosTotal: 0,
      ivaValor: 0,
      ganhosMenosIVA: 0,
      despesasAdm: 0,
      combustivel: 0,
      viaverde: 0,
      aluguel: 0,
      repasse: 0,
    });

    worksheet.addRow({
      driverName: 'TOTAL',
      driverType: '',
      uberTotal: totals.uberTotal,
      boltTotal: totals.boltTotal,
      ganhosTotal: totals.ganhosTotal,
      ivaValor: totals.ivaValor,
      ganhosMenosIVA: totals.ganhosMenosIVA,
      despesasAdm: totals.despesasAdm,
      combustivel: totals.combustivel,
      viaverde: totals.viaverde,
      aluguel: totals.aluguel,
      repasse: totals.repasse,
      iban: '',
      paymentStatus: '',
    });

    // Formatar células numéricas como moeda
    const currencyColumns = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']; // Colunas de C a L
    currencyColumns.forEach(col => {
      worksheet.getColumn(col).numFmt = '€#,##0.00';
    });

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Estilizar linha de total
    const lastRow = worksheet.lastRow;
    if (lastRow) {
      lastRow.font = { bold: true };
      lastRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' },
      };
    }

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Adicionar Excel ao ZIP
    archive.append(Buffer.from(excelBuffer), { 
      name: `ControloSemanal_${weekStart}_a_${weekEnd}.xlsx` 
    });

    // 2. Gerar um PDF para cada registro de motorista e adicionar ao ZIP
    for (const record of records) {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        archive.append(pdfBuffer, { name: `contracheque_${record.driverName.replace(/\s/g, '_')}_${weekStart}_a_${weekEnd}.pdf` });
      });

      doc.fontSize(16).text(`Contracheque Semanal - ${record.driverName}`, { align: 'center' });
      doc.fontSize(12).text(`Semana: ${record.weekStart} a ${record.weekEnd}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Ganhos Uber: ${formatCurrency(record.uberTotal)}`);
      doc.text(`Ganhos Bolt: ${formatCurrency(record.boltTotal)}`);
      doc.text(`Total Ganhos Brutos: ${formatCurrency(record.ganhosTotal)}`);
      doc.moveDown();

      doc.text(`IVA (6%): -${formatCurrency(record.ivaValor)}`);
      doc.text(`Ganhos Líquidos (pré-despesas): ${formatCurrency(record.ganhosMenosIVA)}`);
      doc.text(`Despesas Administrativas (7%): -${formatCurrency(record.despesasAdm)}`);
      doc.moveDown();

      doc.text(`Combustível (Myprio): -${formatCurrency(record.combustivel)}`);
      doc.text(`Portagens (ViaVerde): -${formatCurrency(record.viaverde)}`);
      doc.text(`Aluguel: -${formatCurrency(record.aluguel)}`);
      doc.moveDown();

      doc.fontSize(14).text(`Valor a Repassar: ${formatCurrency(record.repasse)}`, { bold: true });
      doc.end();

      // Esperar o PDF ser gerado antes de adicionar ao arquivo
      await new Promise<void>(resolve => doc.on('end', () => resolve()));
    }

    archive.finalize();

  } catch (error: any) {
    console.error('Erro ao gerar relatórios semanais:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message, stack: error.stack });
    }
  }
}

