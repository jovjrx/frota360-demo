import { PayslipData } from '@/lib/pdf/payslipGenerator';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import type { WeeklyNormalizedData } from '@/schemas/data-weekly';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const pickNumber = (...values: Array<unknown>): number | undefined => {
  for (const value of values) {
    if (isFiniteNumber(value)) {
      return value;
    }
  }
  return undefined;
};

const sumPlatform = (
  data: WeeklyNormalizedData[] | null | undefined,
  platform: WeeklyNormalizedData['platform']
): number => {
  if (!Array.isArray(data) || data.length === 0) {
    return 0;
  }

  return data.reduce((total, entry) => {
    if (entry?.platform !== platform) {
      return total;
    }
    const value = isFiniteNumber(entry?.totalValue)
      ? entry.totalValue
      : isFiniteNumber((entry as any)?.amount)
        ? (entry as any).amount
        : 0;
    return total + value;
  }, 0);
};

export interface BuildPayslipOverrides {
  driverName?: string;
  driverType?: 'affiliate' | 'renter';
  vehiclePlate?: string;
  weekStart?: string;
  weekEnd?: string;
}

type RecordInput = Partial<DriverWeeklyRecord> &
  Record<string, unknown> & { platformData?: WeeklyNormalizedData[] | null };

export function buildPayslipDataFromRecord(
  record: RecordInput,
  overrides: BuildPayslipOverrides = {}
): PayslipData {
  const platformData = Array.isArray(record.platformData)
    ? (record.platformData as WeeklyNormalizedData[])
    : undefined;

  const uberTotal = pickNumber(record.uberTotal, sumPlatform(platformData, 'uber')) ?? 0;
  const boltTotal = pickNumber(record.boltTotal, sumPlatform(platformData, 'bolt')) ?? 0;
  const combustivelValue = pickNumber(record.combustivel, record.prio, sumPlatform(platformData, 'myprio')) ?? 0;
  const viaverdeValue = pickNumber(record.viaverde, sumPlatform(platformData, 'viaverde')) ?? 0;

  const ganhosTotal = pickNumber(record.ganhosTotal, uberTotal + boltTotal) ?? uberTotal + boltTotal;
  const ivaValor = pickNumber(record.ivaValor, ganhosTotal * 0.06) ?? ganhosTotal * 0.06;
  const ganhosMenosIVA = pickNumber(
    (record as any).ganhosMenosIVA,
    (record as any).ganhosMenosIva,
    ganhosTotal - ivaValor
  ) ?? ganhosTotal - ivaValor;
  const despesasAdm = pickNumber(record.despesasAdm, ganhosMenosIVA * 0.07) ?? ganhosMenosIVA * 0.07;

  const aluguel = pickNumber(record.aluguel) ?? 0;

  const financingDetails = (record as any).financingDetails || {};
  const financingInstallment = pickNumber(
    financingDetails.installment,
    (record as any).financingInstallment
  ) ?? 0;
  const financingInterestAmount = pickNumber(
    financingDetails.interestAmount,
    (record as any).financingInterestAmount
  ) ?? 0;
  const financingInterestPercent = pickNumber(
    financingDetails.interestPercent,
    (record as any).financingInterestPercent
  ) ?? 0;
  const financingTotalCost = pickNumber(
    financingDetails.totalCost,
    (record as any).financingTotalCost,
    financingInstallment + financingInterestAmount
  ) ?? financingInstallment + financingInterestAmount;

  const repasse = pickNumber(
    record.repasse,
    ganhosMenosIVA - despesasAdm - combustivelValue - viaverdeValue - aluguel - financingTotalCost
  ) ?? ganhosMenosIVA - despesasAdm - combustivelValue - viaverdeValue - aluguel - financingTotalCost;

  const resolvedDriverType = overrides.driverType
    || ((record as any).driverType === 'renter' || (record as any).isLocatario ? 'renter' : 'affiliate');

  return {
    driverName: overrides.driverName || (record.driverName as string) || 'Motorista',
    driverType: resolvedDriverType,
    vehiclePlate:
      overrides.vehiclePlate
      || (record as any).vehiclePlate
      || (record as any).vehicle
      || 'N/A',
    weekStart: overrides.weekStart || (record.weekStart as string) || '',
    weekEnd: overrides.weekEnd || (record.weekEnd as string) || '',
    uberTotal,
    boltTotal,
    prioTotal: combustivelValue,
    viaverdeTotal: viaverdeValue,
    ganhosTotal,
    ivaValor,
    ganhosMenosIva: ganhosMenosIVA,
    comissao: despesasAdm,
    combustivel: combustivelValue,
    viaverde: viaverdeValue,
    aluguel,
    financingInterestPercent,
    financingInstallment,
    financingInterestAmount,
    financingTotalCost,
    repasse,
  };
}
