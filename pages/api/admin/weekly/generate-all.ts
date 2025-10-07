import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePayslipPDF, PayslipData } from '@/lib/pdf/payslipGenerator';
import ExcelJS from 'exceljs';
import archiver from 'archiver';

interface DriverRecord {
  driverId: string;
  driverName: string;
  driverType: string;
  vehicle: string;
  weekStart: string;
  weekEnd: string;
  uberTotal: number;
  boltTotal: number;
  ganhosTotal: number;
  iva: number;
  ganhosMenosIva: number;
  despesasAdm: number;
  combustivel: number;
  portagens: number;
  aluguel: number;
  valorLiquido: number;
  iban: string;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weekStart, weekEnd, records } = req.body;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'Nenhum registro para processar' });
    }

    // ============================================================================
    // GERAR EXCEL
    // ============================================================================

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Controlo Semanal');

    // Cabeçalhos
    worksheet.columns = [
      { header: 'Motorista', key: 'motorista', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Veículo', key: 'veiculo', width: 12 },
      { header: 'Período', key: 'periodo', width: 25 },
      { header: 'Uber Total', key: 'uberTotal', width: 12 },
      { header: 'Bolt Total', key: 'boltTotal', width: 12 },
      { header: 'Ganhos Total', key: 'ganhosTotal', width: 14 },
      { header: 'IVA 6%', key: 'iva', width: 12 },
      { header: 'Ganhos - IVA', key: 'ganhosMinusIva', width: 14 },
      { header: 'Despesas Adm. 7%', key: 'despesasAdm', width: 16 },
      { header: 'Combustível', key: 'combustivel', width: 12 },
      { header: 'Portagens', key: 'portagens', width: 12 },
      { header: 'Aluguel', key: 'aluguel', width: 12 },
      { header: 'Valor Líquido', key: 'valorLiquido', width: 14 },
      { header: 'IBAN', key: 'iban', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Adicionar dados
    records.forEach((record: DriverRecord) => {
      worksheet.addRow({
        motorista: record.driverName,
        tipo: record.driverType,
        veiculo: record.vehicle,
        periodo: `${formatDate(record.weekStart)} - ${formatDate(record.weekEnd)}`,
        uberTotal: record.uberTotal,
        boltTotal: record.boltTotal,
        ganhosTotal: record.ganhosTotal,
        iva: record.iva,
        ganhosMinusIva: record.ganhosMenosIva,
        despesasAdm: record.despesasAdm,
        combustivel: record.combustivel,
        portagens: record.portagens,
        aluguel: record.aluguel,
        valorLiquido: record.valorLiquido,
        iban: record.iban,
        status: record.status === 'pending' ? 'PENDENTE' : record.status === 'paid' ? 'PAGO' : 'CANCELADO',
      });
    });

    // Adicionar linha de total
    const totals = records.reduce((acc: any, record: DriverRecord) => ({
      uberTotal: acc.uberTotal + record.uberTotal,
      boltTotal: acc.boltTotal + record.boltTotal,
      ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
      iva: acc.iva + record.iva,
      ganhosMinusIva: acc.ganhosMinusIva + record.ganhosMenosIva,
      despesasAdm: acc.despesasAdm + record.despesasAdm,
      combustivel: acc.combustivel + record.combustivel,
      portagens: acc.portagens + record.portagens,
      aluguel: acc.aluguel + record.aluguel,
      valorLiquido: acc.valorLiquido + record.valorLiquido,
    }), {
      uberTotal: 0,
      boltTotal: 0,
      ganhosTotal: 0,
      iva: 0,
      ganhosMinusIva: 0,
      despesasAdm: 0,
      combustivel: 0,
      portagens: 0,
      aluguel: 0,
      valorLiquido: 0,
    });

    worksheet.addRow({
      motorista: 'TOTAL',
      tipo: '',
      veiculo: '',
      periodo: '',
      uberTotal: totals.uberTotal,
      boltTotal: totals.boltTotal,
      ganhosTotal: totals.ganhosTotal,
      iva: totals.iva,
      ganhosMinusIva: totals.ganhosMinusIva,
      despesasAdm: totals.despesasAdm,
      combustivel: totals.combustivel,
      portagens: totals.portagens,
      aluguel: totals.aluguel,
      valorLiquido: totals.valorLiquido,
      iban: '',
      status: '',
    });

    // Formatar células numéricas como moeda
    const currencyColumns = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
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

    // ============================================================================
    // CRIAR ZIP COM EXCEL + PDFs
    // ============================================================================

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=Resumos_${weekStart}_a_${weekEnd}.zip`);

    archive.pipe(res);

    // Adicionar Excel ao ZIP
    archive.append(Buffer.from(excelBuffer), { 
      name: `ControloSemanal_${weekStart}_a_${weekEnd}.xlsx` 
    });

    // Gerar e adicionar PDFs
    for (const record of records) {
      const payslipData: PayslipData = {
        driverName: record.driverName,
        driverType: record.driverType === 'Locatário' ? 'renter' : 'affiliate',
        vehiclePlate: record.vehicle,
        weekStart: formatDate(record.weekStart),
        weekEnd: formatDate(record.weekEnd),
        uberTotal: record.uberTotal,
        boltTotal: record.boltTotal,
        ganhosTotal: record.ganhosTotal,
        ivaValor: record.iva,
        ganhosMenosIva: record.ganhosMenosIva,
        comissao: record.despesasAdm,
        combustivel: record.combustivel,
        viaverde: record.portagens,
        aluguel: record.aluguel,
        repasse: record.valorLiquido,
        iban: record.iban,
        status: record.status === 'PENDENTE' || record.status === 'pending' ? 'pending' : 'paid',
      };

      const pdfBuffer = await generatePayslipPDF(payslipData);

      // Nome do arquivo (sanitizar nome do motorista)
      const sanitizedName = record.driverName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const fileName = `Resumo_${sanitizedName}_${weekStart}_a_${weekEnd}.pdf`;

      archive.append(pdfBuffer, { name: fileName });
    }

    // Finalizar ZIP
    await archive.finalize();

  } catch (error) {
    console.error('Erro ao gerar resumos:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar resumos' });
    }
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
