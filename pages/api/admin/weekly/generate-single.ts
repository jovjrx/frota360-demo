import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { generatePayslipPDF, type PayslipData } from '@/lib/pdf/payslipGenerator';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import type { WeeklyNormalizedData } from '@/schemas/data-weekly';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function sumPlatform(platformData: WeeklyNormalizedData[] = [], platform: WeeklyNormalizedData['platform']): number {
  return platformData
    .filter((entry) => entry.platform === platform)
    .reduce((acc, entry) => acc + (entry.totalValue || 0), 0);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { record } = req.body as { record?: DriverWeeklyRecord & { driverType?: string; vehicle?: string; platformData?: WeeklyNormalizedData[] } };

  if (!record) {
    return res.status(400).json({ message: 'Record payload is required' });
  }

  try {
    const platformData = record.platformData ?? [];

    const [uberTotal, boltTotal, prioTotal, viaverdeTotal] = [
      sumPlatform(platformData, 'uber'),
      sumPlatform(platformData, 'bolt'),
      sumPlatform(platformData, 'myprio'),
      sumPlatform(platformData, 'viaverde'),
    ];

    const driverDoc = record.driverId ? await adminDb.collection('drivers').doc(record.driverId).get() : null;
    const driverData = driverDoc?.data() as (Record<string, any> | undefined);

    const payslipData: PayslipData = {
      driverName: record.driverName,
      driverType: driverData?.type || record.driverType || 'affiliate',
      vehiclePlate: driverData?.vehicle?.plate || record.vehicle || 'N/A',
      weekStart: formatDate(record.weekStart),
      weekEnd: formatDate(record.weekEnd),
      uberTotal,
      boltTotal,
      prioTotal,
      viaverdeTotal,
      ganhosTotal: record.ganhosTotal,
      ivaValor: record.ivaValor,
      ganhosMenosIva: record.ganhosMenosIVA,
      comissao: record.despesasAdm,
      combustivel: record.combustivel,
      viaverde: record.viaverde,
      aluguel: record.aluguel,
      
      // Financing com todos os campos necessários
      financingInterestPercent: (record as any).financingDetails?.interestPercent,
      financingInstallment: (record as any).financingDetails?.installment,
      financingInterestAmount: (record as any).financingDetails?.interestAmount,
      financingTotalCost: (record as any).financingDetails?.totalCost,
      
      repasse: record.repasse,
    };

    const pdfBuffer = await generatePayslipPDF(payslipData);

    const sanitizedName = record.driverName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const fileName = `contracheque_${sanitizedName}_${record.weekStart}_a_${record.weekEnd}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Failed to generate payslip:', error);
    res.status(500).json({ message: 'Failed to generate payslip', error: error.message });
  }
}
