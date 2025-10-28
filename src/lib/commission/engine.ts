import { store } from '@/lib/store';
import { TripRevenue, CreatePayout, Payout } from '@/schemas/payout';

export interface CommissionRule {
  driverId?: string;
  percent: number;
  minAmount?: number;
  maxAmount?: number;
  conditions?: Record<string, any>;
}

export interface PayoutCalculation {
  driverId: string;
  grossCents: number;
  commissionCents: number;
  feesCents: number;
  netCents: number;
  tripCount: number;
  period: {
    start: number;
    end: number;
  };
}

export class CommissionEngine {
  private defaultCommissionPercent: number = 10; // 10% default commission

  async calculateDriverCommission(
    driverId: string,
    grossCents: number,
    customCommissionPercent?: number
  ): Promise<number> {
    const commissionPercent = customCommissionPercent || this.defaultCommissionPercent;
    return Math.round(grossCents * (commissionPercent / 100));
  }

  async calculatePayouts(
    periodStart: number,
    periodEnd: number,
    driverIds?: string[],
    defaultCommissionPercent: number = 10
  ): Promise<PayoutCalculation[]> {
    this.defaultCommissionPercent = defaultCommissionPercent;

    // Get all drivers or specific drivers
    const allDrivers = await store.drivers.findAll();
    const drivers = driverIds 
      ? allDrivers.filter(driver => driverIds.includes(driver.id))
      : allDrivers.filter(driver => driver.status === 'approved');

    const calculations: PayoutCalculation[] = [];

    for (const driver of drivers) {
      const calculation = await this.calculateDriverPayout(
        driver.id,
        periodStart,
        periodEnd,
        driver.commission?.percent
      );
      
      if (calculation.grossCents > 0) {
        calculations.push(calculation);
      }
    }

    return calculations;
  }

  private async calculateDriverPayout(
    driverId: string,
    periodStart: number,
    periodEnd: number,
    customCommissionPercent?: number
  ): Promise<PayoutCalculation> {
    // Get trip revenues for the period
    const tripRevenues = await store.tripRevenues.findByDriverId(driverId);
    const periodTrips = tripRevenues.filter(trip => 
      trip.date >= periodStart && trip.date <= periodEnd
    );

    // Calculate totals
    const grossCents = periodTrips.reduce((sum, trip) => sum + trip.grossCents, 0);
    const commissionCents = await this.calculateDriverCommission(
      driverId,
      grossCents,
      customCommissionPercent
    );
    
    // Calculate fees (fixed fee per trip + percentage)
    const fixedFeePerTrip = 50; // 0.50 EUR per trip
    const feePercentage = 0.02; // 2% fee
    const fixedFees = periodTrips.length * fixedFeePerTrip;
    const percentageFees = Math.round(grossCents * feePercentage);
    const feesCents = fixedFees + percentageFees;

    const netCents = grossCents - commissionCents - feesCents;

    return {
      driverId,
      grossCents,
      commissionCents,
      feesCents,
      netCents: Math.max(0, netCents), // Ensure net is not negative
      tripCount: periodTrips.length,
      period: {
        start: periodStart,
        end: periodEnd,
      },
    };
  }

  async createPayoutsFromCalculations(
    calculations: PayoutCalculation[],
    createdBy: string
  ): Promise<Payout[]> {
    const payouts: Payout[] = [];

    for (const calculation of calculations) {
      if (calculation.netCents > 0) {
        const payoutData = {
          driverId: calculation.driverId,
          periodStart: calculation.period.start,
          periodEnd: calculation.period.end,
          grossCents: calculation.grossCents,
          commissionCents: calculation.commissionCents,
          feesCents: calculation.feesCents,
          netCents: calculation.netCents,
          status: 'pending' as const,
        };

        const payoutId = await store.payouts.create(payoutData);
        const payout = await store.payouts.findById(payoutId);
        
        if (payout) {
          payouts.push(payout);
        }
      }
    }

    return payouts;
  }

  async getCommissionSummary(
    driverId: string,
    periodStart: number,
    periodEnd: number
  ): Promise<{
    totalTrips: number;
    grossRevenue: number;
    commissionPaid: number;
    feesDeducted: number;
    netEarnings: number;
    averageCommissionPercent: number;
  }> {
    const calculation = await this.calculateDriverPayout(
      driverId,
      periodStart,
      periodEnd
    );

    const averageCommissionPercent = calculation.grossCents > 0 
      ? (calculation.commissionCents / calculation.grossCents) * 100 
      : 0;

    return {
      totalTrips: calculation.tripCount,
      grossRevenue: calculation.grossCents / 100, // Convert to EUR
      commissionPaid: calculation.commissionCents / 100,
      feesDeducted: calculation.feesCents / 100,
      netEarnings: calculation.netCents / 100,
      averageCommissionPercent,
    };
  }

  async exportPayoutsCSV(
    periodStart: number,
    periodEnd: number,
    driverIds?: string[]
  ): Promise<string> {
    const calculations = await this.calculatePayouts(
      periodStart,
      periodEnd,
      driverIds
    );

    const headers = [
      'Driver ID',
      'Driver Name',
      'Driver Email',
      'Period Start',
      'Period End',
      'Trip Count',
      'Gross Revenue (EUR)',
      'Commission (EUR)',
      'Fees (EUR)',
      'Net Earnings (EUR)',
    ];

    const rows = await Promise.all(
      calculations.map(async (calc) => {
        const driver = await store.drivers.findById(calc.driverId);
        return [
          calc.driverId,
          driver?.name || 'Unknown',
          driver?.email || 'Unknown',
          new Date(calc.period.start).toISOString().split('T')[0],
          new Date(calc.period.end).toISOString().split('T')[0],
          calc.tripCount.toString(),
          (calc.grossCents / 100).toFixed(2),
          (calc.commissionCents / 100).toFixed(2),
          (calc.feesCents / 100).toFixed(2),
          (calc.netCents / 100).toFixed(2),
        ];
      })
    );

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const commissionEngine = new CommissionEngine();

