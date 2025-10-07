import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { generatePayslipPDF, PayslipData } from '@/lib/pdf/payslipGenerator';
import ExcelJS from 'exceljs';
import archiver from 'archiver';

// Inicializar Firebase Admin
if (!getApps().length) {
  const serviceAccount = require('@/firebase-service-account.json');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

interface DriverRecord {
  id: string;
  driverName: string;
  driverType: string;
  vehicle: string;
  weekStart: string;
  weekEnd: string;
  uberTotal: number;
  boltTotal: number;
  ganhosTotal: number;
  iva: number;
  ganhosMinusIva: number;
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
    const { weekStart, weekEnd } = req.body;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
    }

    const db = getFirestore();

    // Buscar registros da semana
    const recordsSnapshot = await db
      .collection('weeklyRecords')
      .where('weekStart', '==', weekStart)
      .where('weekEnd', '==', weekEnd)
      .get();

    if (recordsSnapshot.empty) {
      return res.status(404).json({ error: 'Nenhum registro encontrado para esta semana' });
    }

    const records: DriverRecord[] = [];

    // Processar cada registro
    for (const doc of recordsSnapshot.docs) {
      const data = doc.data();
      
      // Buscar dados do motorista
      const driverDoc = await db.collection('drivers').doc(data.driverId).get();
      const driverData = driverDoc.data();

      if (!driverData) {
        console.warn(`Motorista ${data.driverId} não encontrado`);
        continue;
      }

      const uberTotal = data.uber?.total || 0;
      const boltTotal = data.bolt?.total || 0;
      const ganhosTotal = uberTotal + boltTotal;
      const iva = ganhosTotal * 0.06;
      const ganhosMinusIva = ganhosTotal - iva;
      const despesasAdm = ganhosMinusIva * 0.07;
      const combustivel = data.fuel?.total || 0;
      const portagens = data.viaverde?.total || 0;
      const aluguel = driverData.type === 'renter' ? (data.rent || 290) : 0;
      const valorLiquido = ganhosMinusIva - despesasAdm - combustivel - portagens - aluguel;

      records.push({
        id: doc.id,
        driverName: data.driverName || driverData.name || 'N/A',
        driverType: driverData.type === 'renter' ? 'Locatário' : 'Afiliado',
        vehicle: driverData.vehicle?.plate || 'N/A',
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        uberTotal,
        boltTotal,
        ganhosTotal,
        iva,
        ganhosMinusIva,
        despesasAdm,
        combustivel,
        portagens,
        aluguel,
        valorLiquido,
        iban: driverData.banking?.iban || 'N/A',
        status: data.payment?.status || 'pending',
      });
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
    records.forEach(record => {
      worksheet.addRow({
        motorista: record.driverName,
        tipo: record.driverType,
        veiculo: record.vehicle,
        periodo: `${formatDate(record.weekStart)} - ${formatDate(record.weekEnd)}`,
        uberTotal: record.uberTotal,
        boltTotal: record.boltTotal,
        ganhosTotal: record.ganhosTotal,
        iva: record.iva,
        ganhosMinusIva: record.ganhosMinusIva,
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
    const totals = records.reduce((acc, record) => ({
      uberTotal: acc.uberTotal + record.uberTotal,
      boltTotal: acc.boltTotal + record.boltTotal,
      ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
      iva: acc.iva + record.iva,
      ganhosMinusIva: acc.ganhosMinusIva + record.ganhosMinusIva,
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
    archive.append(excelBuffer, { 
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
        ganhosMenosIva: record.ganhosMinusIva,
        comissao: record.despesasAdm,
        combustivel: record.combustivel,
        viaverde: record.portagens,
        aluguel: record.aluguel,
        repasse: record.valorLiquido,
        iban: record.iban,
        status: record.status === 'PENDENTE' ? 'pending' : 'paid',
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
