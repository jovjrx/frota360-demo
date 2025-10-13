import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord, createDriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { Financing } from '@/schemas/financing';
import { getWeekId } from '@/lib/utils/date-helpers';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';
import { Driver } from '@/schemas/driver';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PayslipData, generatePayslipPDF } from '@/lib/pdf/payslipGenerator';

type Platform = 'uber' | 'bolt' | 'myprio' | 'viaverde';

interface DriverIndex {
  byId: Map<string, Driver>;
  byUber: Map<string, Driver>;
  byBolt: Map<string, Driver>;
  byMyPrio: Map<string, Driver>;
  byPlate: Map<string, Driver>;
  byViaVerde: Map<string, Driver>;
}

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

    // 1a. Buscar todos os financiamentos ativos para calcular juros semanais
    const financingSnapshot = await adminDb
      .collection('financing')
      .where('status', '==', 'active')
      .get();
    const financingByDriver: Record<string, Financing[]> = {};
    financingSnapshot.docs.forEach(doc => {
      const data = doc.data() as Financing;
      const driverId = data.driverId;
      if (!driverId) return;
      if (!financingByDriver[driverId]) {
        financingByDriver[driverId] = [];
      }
      financingByDriver[driverId].push({ ...data, id: doc.id });
    });

    // 2. Buscar dados normalizados da semana
    const normalizedSnapshot = await adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId)
      .get();
    const normalizedEntries: WeeklyNormalizedData[] = normalizedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as WeeklyNormalizedData }));

    const driverIndex = buildDriverIndex(drivers);

    const platformDataByDriver: Record<string, { uber: number; bolt: number }> = {};
    const expensesByDriver: Record<string, { combustivel: number; viaverde: number }> = {};

    normalizedEntries.forEach(entry => {
      const driver = resolveDriverForExport(entry, driverIndex);
      if (!driver?.id) {
        return;
      }

      if (!platformDataByDriver[driver.id]) {
        platformDataByDriver[driver.id] = { uber: 0, bolt: 0 };
      }
      if (!expensesByDriver[driver.id]) {
        expensesByDriver[driver.id] = { combustivel: 0, viaverde: 0 };
      }

      switch (entry.platform) {
        case 'uber':
          platformDataByDriver[driver.id].uber += entry.totalValue || 0;
          break;
        case 'bolt':
          platformDataByDriver[driver.id].bolt += entry.totalValue || 0;
          break;
        case 'myprio':
          expensesByDriver[driver.id].combustivel += entry.totalValue || 0;
          break;
        case 'viaverde':
          expensesByDriver[driver.id].viaverde += entry.totalValue || 0;
          break;
        default:
          break;
      }
    });

    const records: DriverWeeklyRecord[] = [];

    for (const driver of drivers) {
      if (!driver.id) {
        continue;
      }

      const incomeTotals = platformDataByDriver[driver.id] || { uber: 0, bolt: 0 };
      const expenseTotals = expensesByDriver[driver.id] || { combustivel: 0, viaverde: 0 };

      const record: DriverWeeklyRecord = createDriverWeeklyRecord({
        driverId: driver.id,
        driverName: driver.fullName,
        driverEmail: driver.email,
        weekId,
        weekStart,
        weekEnd,
        combustivel: expenseTotals.combustivel,
        viaverde: expenseTotals.viaverde,
        isLocatario: driver.type === 'renter',
        aluguel: driver.type === 'renter' ? (driver.rentalFee || 0) : 0,
        iban: driver.banking?.iban || null,
      }, incomeTotals, { type: driver.type, rentalFee: driver.rentalFee });
      
      // Ajustar record para incluir descontos de financiamentos ativos
      const activeFinancings = financingByDriver[driver.id] || [];
      let totalFinancingInterestPercent = 0; // Percentual adicional de juros
      let totalWeeklyInstallment = 0;
      
      for (const fin of activeFinancings) {
        // 1. Acumular percentual de juros (será somado à taxa administrativa)
        const interestPercent = fin.weeklyInterest || 0;
        if (interestPercent > 0) {
          totalFinancingInterestPercent += interestPercent;
        }
        
        // 2. Calcular parcela semanal (para empréstimos com prazo)
        if (fin.type === 'loan' && fin.weeks && fin.weeks > 0) {
          const weeklyInstallment = fin.amount / fin.weeks;
          totalWeeklyInstallment += weeklyInstallment;
        }
        
        // 3. Para descontos sem prazo, descontar o valor total a cada semana
        if (fin.type === 'discount') {
          totalWeeklyInstallment += fin.amount;
        }
        
        // 4. Se houver contagem de semanas, decrementa e finaliza quando chegar a zero
        if (typeof fin.remainingWeeks === 'number') {
          const newRemaining = fin.remainingWeeks - 1;
          const updates: any = { updatedAt: new Date().toISOString(), remainingWeeks: newRemaining };
          if (newRemaining <= 0) {
            updates.status = 'completed';
            updates.endDate = new Date().toISOString();
          }
          await adminDb.collection('financing').doc(fin.id as string).update(updates);
        }
      }
      
      // Aplicar taxa de juros adicional sobre (ganhos - IVA)
      // Taxa base: 7% + juros de financiamento
      if (totalFinancingInterestPercent > 0) {
        const additionalInterest = record.ganhosMenosIVA * (totalFinancingInterestPercent / 100);
        record.despesasAdm += additionalInterest;
        record.repasse -= additionalInterest;
      }
      
      // Aplicar parcela do financiamento
      if (totalWeeklyInstallment > 0) {
        record.despesasAdm += totalWeeklyInstallment;
        record.repasse -= totalWeeklyInstallment;
      }
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
      const driverPlatformData = platformDataByDriver[record.driverId] || { uber: 0, bolt: 0 };
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
      const driverPlatformData = platformDataByDriver[record.driverId] || { uber: 0, bolt: 0 };
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

    const driverPlatformData = platformDataByDriver[record.driverId] || { uber: 0, bolt: 0 };

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
        prioTotal: record.combustivel, // PRIO é o mesmo que combustivel para o contracheque
        viaverde: record.viaverde,
        viaverdeTotal: record.viaverde, // ViaVerde é o mesmo que viaverde para o contracheque
        aluguel: record.aluguel,
        
        // Financing com todos os campos necessários
        financingInterestPercent: (record as any).financingDetails?.interestPercent,
        financingInstallment: (record as any).financingDetails?.installment,
        financingInterestAmount: (record as any).financingDetails?.interestAmount,
        financingTotalCost: (record as any).financingDetails?.totalCost,
        
        repasse: record.repasse,
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

function buildDriverIndex(drivers: Driver[]): DriverIndex {
  const byId = new Map<string, Driver>();
  const byUber = new Map<string, Driver>();
  const byBolt = new Map<string, Driver>();
  const byMyPrio = new Map<string, Driver>();
  const byPlate = new Map<string, Driver>();
  const byViaVerde = new Map<string, Driver>();

  drivers.forEach((driver) => {
    if (!driver.id) {
      return;
    }

    byId.set(driver.id, driver);

    const uberKey = driver.integrations?.uber?.key;
    if (uberKey) {
      byUber.set(normalizeKey(uberKey), driver);
    }

    const boltKey = driver.integrations?.bolt?.key;
    if (boltKey) {
      byBolt.set(normalizeKey(boltKey), driver);
    }

    const myprioKey = driver.integrations?.myprio?.key;
    if (myprioKey) {
      byMyPrio.set(normalizeKey(myprioKey), driver);
    }

    const plate = driver.vehicle?.plate || driver.integrations?.viaverde?.key;
    if (plate) {
      byPlate.set(normalizePlate(plate), driver);
    }

    const viaverdeKey = driver.integrations?.viaverde?.key;
    if (viaverdeKey) {
      byViaVerde.set(normalizeKey(viaverdeKey), driver);
    }
  });

  return { byId, byUber, byBolt, byMyPrio, byPlate, byViaVerde };
}

function resolveDriverForExport(entry: WeeklyNormalizedData, index: DriverIndex): Driver | undefined {
  if (entry.driverId) {
    const driver = index.byId.get(entry.driverId);
    if (driver) {
      return driver;
    }
  }

  switch (entry.platform as Platform) {
    case 'uber':
      return index.byUber.get(normalizeKey(entry.referenceId));
    case 'bolt':
      return index.byBolt.get(normalizeKey(entry.referenceId));
    case 'myprio': {
      const cardMatch = index.byMyPrio.get(normalizeKey(entry.referenceId));
      if (cardMatch) return cardMatch;
      return index.byPlate.get(normalizePlate(entry.referenceLabel || entry.referenceId));
    }
    case 'viaverde': {
      const plateMatch = index.byPlate.get(normalizePlate(entry.referenceLabel || entry.referenceId));
      if (plateMatch) return plateMatch;
      return index.byViaVerde.get(normalizeKey(entry.referenceId));
    }
    default:
      return undefined;
  }
}

function normalizeKey(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function normalizePlate(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

