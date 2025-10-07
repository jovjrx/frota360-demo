import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord, createDriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { getWeekId } from '@/lib/utils/date-helpers';
import { WeeklyDriverPlatformData } from '@/schemas/weekly-driver-platform-data';
import { Driver } from '@/schemas/driver';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PayslipData, generatePayslipPDF } from '@/lib/pdf/payslipGenerator';

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
    // 1. Buscar todos os motoristas ativos
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('status', '==', 'active')
      .get();
    const drivers: Driver[] = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Driver }));

    // 2. Buscar todos os WeeklyDriverPlatformData para a semana
    const platformDataSnapshot = await adminDb
      .collection("weeklyDriverPlatformData")
      .where("weekId", "==", weekId)
      .get();
    const allPlatformData: WeeklyDriverPlatformData[] = platformDataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as WeeklyDriverPlatformData }));

    const records: DriverWeeklyRecord[] = [];

    // Mapear platformData por driverId para fácil acesso
    const platformDataByDriver: { [driverId: string]: { [platform: string]: number } } = {};
    allPlatformData.forEach(data => {
      if (!platformDataByDriver[data.driverId]) {
        platformDataByDriver[data.driverId] = {};
      }
      platformDataByDriver[data.driverId][data.platform] = data.totalValue;
    });

    // 3. Gerar DriverWeeklyRecord para cada motorista
    for (const driver of drivers) {
      if (!driver.id) continue;

      const driverPlatformData = platformDataByDriver[driver.id] || {};

      const record: DriverWeeklyRecord = createDriverWeeklyRecord({
        driverId: driver.id,
        driverName: driver.fullName,
        driverEmail: driver.email,
        weekId,
        weekStart,
        weekEnd,
        isLocatario: driver.type === 'renter',
        aluguel: driver.type === 'renter' ? (driver.rentalFee || 0) : 0,
        iban: driver.banking?.iban || null,      }, driverPlatformData, { type: driver.type, rentalFee: driver.rentalFee });

      records.push(record);
    }

    if (records.length === 0) {
      return res.status(404).json({ message: 'Nenhum registro semanal encontrado para esta semana após amarração.' });
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
      const driverPlatformData = platformDataByDriver[record.driverId] || {};
      worksheet.addRow({
        driverName: record.driverName,
        driverType: record.isLocatario ? 'Locatário' : 'Afiliado',
        uberTotal: driverPlatformData.uber || 0,
        boltTotal: driverPlatformData.bolt || 0,
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
    const totals = records.reduce((acc: any, record: DriverWeeklyRecord) => {
      const driverPlatformData = platformDataByDriver[record.driverId] || {};
      return {
        uberTotal: acc.uberTotal + (driverPlatformData.uber || 0),
        boltTotal: acc.boltTotal + (driverPlatformData.bolt || 0),
        ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
        ivaValor: acc.ivaValor + record.ivaValor,
        ganhosMenosIVA: acc.ganhosMenosIVA + record.ganhosMenosIVA,
        despesasAdm: acc.despesasAdm + record.despesasAdm,
        combustivel: acc.combustivel + record.combustivel,
        viaverde: acc.viaverde + record.viaverde,
        aluguel: acc.aluguel + record.aluguel,
        repasse: acc.repasse + record.repasse,
      };
    }, {
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
      // Buscar dados do motorista para vehiclePlate e driverType
      const driverDoc = await adminDb.collection("drivers").doc(record.driverId).get();
      const driverData = driverDoc.data();

      const driverPlatformData = platformDataByDriver[record.driverId] || {};

      // Preparar dados para o PDF
      const payslipData: PayslipData = {
        driverName: record.driverName,
        driverType: driverData?.type || (record.isLocatario ? "renter" : "affiliate"),
        vehiclePlate: driverData?.vehicle?.plate || "N/A",
        weekStart: formatDate(record.weekStart),
        weekEnd: formatDate(record.weekEnd),
        uberTotal: driverPlatformData.uber || 0,
        boltTotal: driverPlatformData.bolt || 0,
        ganhosTotal: record.ganhosTotal,
        ivaValor: record.ivaValor,
        ganhosMenosIva: record.ganhosMenosIVA,
        comissao: record.despesasAdm,
        combustivel: record.combustivel,
        viaverde: record.viaverde,
        aluguel: record.aluguel,
        repasse: record.repasse,
        iban: record.iban || "N/A",
        status: record.paymentStatus,
      };

      // Gerar PDF
      const pdfBuffer = await generatePayslipPDF(payslipData);

      // Nome do arquivo (sanitizar nome do motorista)
      const sanitizedName = record.driverName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      const fileName = `contracheque_${sanitizedName}_${weekStart}_a_${weekEnd}.pdf`;

      // Adicionar ao ZIP
      archive.append(pdfBuffer, { name: fileName });
    }

    archive.finalize();

  } catch (error: any) {
    console.error('Erro ao gerar relatórios semanais:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message, stack: error.stack });
    }
  }
}

