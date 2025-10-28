import type { NextApiRequest, NextApiResponse } from 'next';
import archiver from 'archiver';
import ExcelJS from 'exceljs';
import { adminDb } from '@/lib/firebaseAdmin';
import { getWeekId } from '@/lib/utils/date-helpers';
import { getProcessedWeeklyRecords } from '@/lib/api/weekly-data-processor';
import { buildPayslipDataFromRecord } from '@/lib/pdf/payslipData';
import { generatePayslipPDF } from '@/lib/pdf/payslipGenerator';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

interface DriverData {
  [key: string]: any;
}

type ExtendedRecord = DriverWeeklyRecord & {
  driverType?: 'affiliate' | 'renter';
  vehicle?: string;
  platformData?: unknown;
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return '';
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function sanitizeFileName(name: string, weekStart: string, weekEnd: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  return `recibo_${safeName}_${weekStart}_a_${weekEnd}.pdf`;
}

function mapPaymentStatus(status: DriverWeeklyRecord['paymentStatus']): string {
  switch (status) {
    case 'paid':
      return 'PAGO';
    case 'cancelled':
      return 'CANCELADO';
    default:
      return 'PENDENTE';
  }
}

function normalizePlate(value: unknown): string {
  if (!value) {
    return 'N/A';
  }
  const stringValue = String(value).trim();
  return stringValue.length ? stringValue.toUpperCase() : 'N/A';
}

function resolveDriverType(record: ExtendedRecord, driverData?: DriverData | null): 'affiliate' | 'renter' {
  if (driverData?.type === 'renter') {
    return 'renter';
  }
  if (record.driverType === 'renter' || record.isLocatario) {
    return 'renter';
  }
  return 'affiliate';
}

async function fetchDriverData(driverIds: string[]): Promise<Map<string, DriverData | null>> {
  const entries = await Promise.all(
    driverIds.map(async (driverId) => {
      try {
        const doc = await adminDb.collection('drivers').doc(driverId).get();
        return [driverId, doc.exists ? (doc.data() as DriverData) : null] as const;
      } catch (error) {
        console.error(`[generate-all] Falha ao buscar motorista ${driverId}:`, error);
        return [driverId, null] as const;
      }
    })
  );
  return new Map(entries);
}

async function createWorkbook(
  records: ExtendedRecord[],
  driverDataMap: Map<string, DriverData | null>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Recibos Semanais');

  worksheet.columns = [
    { header: 'Motorista', key: 'driverName', width: 30 },
    { header: 'Tipo', key: 'driverType', width: 12 },
    { header: 'Veículo', key: 'vehicle', width: 14 },
    { header: 'Uber Total', key: 'uberTotal', width: 14 },
    { header: 'Bolt Total', key: 'boltTotal', width: 14 },
    { header: 'Ganhos Total', key: 'ganhosTotal', width: 16 },
    { header: 'IVA 6%', key: 'ivaValor', width: 14 },
  { header: 'Ganhos - IVA', key: 'ganhosMenosIVA', width: 16 },
  { header: 'Commission', key: 'commissionAmount', width: 14 },
  { header: 'Taxa Adm 7%', key: 'despesasAdm', width: 16 },
    { header: 'Combustível', key: 'combustivel', width: 14 },
    { header: 'Portagens', key: 'viaverde', width: 14 },
    { header: 'Aluguel', key: 'aluguel', width: 14 },
    { header: 'Financ. Parcela', key: 'financingInstallment', width: 18 },
    { header: 'Financ. Juros', key: 'financingInterest', width: 16 },
    { header: 'Financ. Total', key: 'financingTotal', width: 16 },
    { header: 'Valor Líquido', key: 'repasse', width: 16 },
    { header: 'IBAN', key: 'iban', width: 30 },
    { header: 'Status', key: 'paymentStatus', width: 14 },
  ];

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2D3748' },
  };
  header.height = 24;

  const currencyKeys = [
    'uberTotal',
    'boltTotal',
    'ganhosTotal',
    'ivaValor',
    'ganhosMenosIVA',
  'commissionAmount',
  'despesasAdm',
    'combustivel',
    'viaverde',
    'aluguel',
    'financingInstallment',
    'financingInterest',
    'financingTotal',
    'repasse',
  ];
  currencyKeys.forEach((key) => {
    const column = worksheet.getColumn(key);
    column.numFmt = '€#,##0.00';
    column.alignment = { horizontal: 'right', vertical: 'middle' };
  });
  worksheet.getColumn('driverType').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getColumn('paymentStatus').alignment = { horizontal: 'center', vertical: 'middle' };

  const totals = {
    uberTotal: 0,
    boltTotal: 0,
    ganhosTotal: 0,
    ivaValor: 0,
    ganhosMenosIVA: 0,
  commissionAmount: 0,
  despesasAdm: 0,
    combustivel: 0,
    viaverde: 0,
    aluguel: 0,
    financingInstallment: 0,
    financingInterest: 0,
    financingTotal: 0,
    repasse: 0,
  };

  for (const record of records) {
    const driverData = record.driverId ? driverDataMap.get(record.driverId) : null;
    const resolvedType = resolveDriverType(record, driverData);
    const financing = record.financingDetails;
    const financingInstallment = financing?.installment ?? 0;
    const financingInterestAmount = financing?.interestAmount ?? 0;
    const financingTotalCost = financing?.totalCost ?? 0;

    worksheet.addRow({
      driverName: record.driverName,
      driverType: resolvedType === 'renter' ? 'Locatário' : 'Afiliado',
      vehicle: normalizePlate(driverData?.vehicle?.plate ?? (record as any).vehicle ?? ''),
      uberTotal: record.uberTotal || 0,
      boltTotal: record.boltTotal || 0,
      ganhosTotal: record.ganhosTotal || 0,
      ivaValor: record.ivaValor || 0,
      ganhosMenosIVA: (record as any).ganhosMenosIVA || (record as any).ganhosMenosIva || 0,
  commissionAmount: (record as any).commissionAmount || 0,
  despesasAdm: record.despesasAdm || 0,
      combustivel: record.combustivel || record.prio || 0,
      viaverde: record.viaverde || 0,
      aluguel: record.aluguel || 0,
      financingInstallment,
      financingInterest: financingInterestAmount,
      financingTotal: financingTotalCost,
      repasse: record.repasse || 0,
      iban: record.iban || driverData?.iban || driverData?.banking?.iban || '',
      paymentStatus: mapPaymentStatus(record.paymentStatus),
    });

    totals.uberTotal += record.uberTotal || 0;
    totals.boltTotal += record.boltTotal || 0;
    totals.ganhosTotal += record.ganhosTotal || 0;
    totals.ivaValor += record.ivaValor || 0;
    totals.ganhosMenosIVA += (record as any).ganhosMenosIVA || (record as any).ganhosMenosIva || 0;
    totals.despesasAdm += record.despesasAdm || 0;
  totals.commissionAmount += (record as any).commissionAmount || 0;
    totals.combustivel += record.combustivel || record.prio || 0;
    totals.viaverde += record.viaverde || 0;
    totals.aluguel += record.aluguel || 0;
    totals.financingInstallment += financingInstallment;
    totals.financingInterest += financingInterestAmount;
    totals.financingTotal += financingTotalCost;
    totals.repasse += record.repasse || 0;
  }

  const totalRow = worksheet.addRow({
    driverName: `TOTAL (${records.length})`,
    driverType: '',
    vehicle: '',
    uberTotal: totals.uberTotal,
    boltTotal: totals.boltTotal,
    ganhosTotal: totals.ganhosTotal,
    ivaValor: totals.ivaValor,
    ganhosMenosIVA: totals.ganhosMenosIVA,
    despesasAdm: totals.despesasAdm,
  commissionAmount: totals.commissionAmount,
    combustivel: totals.combustivel,
    viaverde: totals.viaverde,
    aluguel: totals.aluguel,
    financingInstallment: totals.financingInstallment,
    financingInterest: totals.financingInterest,
    financingTotal: totals.financingTotal,
    repasse: totals.repasse,
    iban: '',
    paymentStatus: '',
  });
  totalRow.font = { bold: true, color: { argb: 'FF1A202C' } };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { weekStart, weekEnd } = req.body as { weekStart?: string; weekEnd?: string };

  if (!weekStart || !weekEnd) {
    return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
  }

  try {
    const weekId = getWeekId(new Date(weekStart));
    // ✅ Usar função ÚNICA: sem driverId → retorna TODOS
    const records = (await getProcessedWeeklyRecords(weekId, undefined, true)) as ExtendedRecord[];

    if (!records.length) {
      return res.status(404).json({ error: 'Nenhum registro encontrado para a semana selecionada.' });
    }

    const driverIds = Array.from(new Set(records.map((record) => record.driverId).filter(Boolean))) as string[];
    const driverDataMap = await fetchDriverData(driverIds);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const archiveName = `recibos_semanais_${weekStart}_a_${weekEnd}.zip`;

    archive.on('error', (error) => {
      console.error('Erro ao gerar pacote de recibos:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro interno ao gerar os recibos.' });
      } else {
        res.end();
      }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);

    archive.pipe(res);

    const excelBuffer = await createWorkbook(records, driverDataMap);
    archive.append(excelBuffer, {
      name: `RecibosSemanais_${weekStart}_a_${weekEnd}.xlsx`,
    });

    for (const record of records) {
      const driverData = record.driverId ? driverDataMap.get(record.driverId) : null;
      const resolvedType = resolveDriverType(record, driverData);
      const vehiclePlate = normalizePlate(driverData?.vehicle?.plate ?? (record as any).vehicle ?? '');

      const payslipData = buildPayslipDataFromRecord(record as any, {
        driverName: record.driverName,
        driverType: resolvedType,
        vehiclePlate,
        weekStart: formatDate(record.weekStart),
        weekEnd: formatDate(record.weekEnd),
      });

      const pdfBuffer = await generatePayslipPDF(payslipData);
      const fileName = sanitizeFileName(record.driverName, record.weekStart, record.weekEnd);
      archive.append(pdfBuffer, { name: fileName });
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('Erro ao processar geração semanal:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro interno ao gerar os recibos.', details: error?.message });
    } else {
      res.end();
    }
  }
}


