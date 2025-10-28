import { store } from '@/lib/store';
import { commissionEngine, PayoutCalculation } from '@/lib/payout/base-calculator';
import { CreatePayout, Payout, PayoutStatus } from '@/schemas/payout';
import { auditLogger } from '@/lib/audit/logger';

export interface PayoutPeriod {
  start: number;
  end: number;
  label: string;
}

export interface PayoutSummary {
  totalPayouts: number;
  totalAmount: number;
  paidPayouts: number;
  paidAmount: number;
  pendingPayouts: number;
  pendingAmount: number;
  averagePayout: number;
}

export class PayoutEngine {
  getStandardPayoutPeriods(): PayoutPeriod[] {
    const now = new Date();
    const periods: PayoutPeriod[] = [];

    // Last 4 weeks
    for (let i = 1; i <= 4; i++) {
      const end = new Date(now);
      end.setDate(end.getDate() - (i - 1) * 7);
      end.setHours(23, 59, 59, 999);
      
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      periods.push({
        start: start.getTime(),
        end: end.getTime(),
        label: `Semana ${i} (${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')})`,
      });
    }

    // Last 3 months
    for (let i = 1; i <= 3; i++) {
      const end = new Date(now.getFullYear(), now.getMonth() - (i - 1), 0);
      end.setHours(23, 59, 59, 999);
      
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);

      periods.push({
        start: start.getTime(),
        end: end.getTime(),
        label: `${start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      });
    }

    return periods;
  }

  async calculatePayouts(
    periodStart: number,
    periodEnd: number,
    driverIds?: string[],
    defaultCommissionPercent: number = 10
  ): Promise<PayoutCalculation[]> {
    return await commissionEngine.calculatePayouts(
      periodStart,
      periodEnd,
      driverIds,
      defaultCommissionPercent
    );
  }

  async createPayouts(
    periodStart: number,
    periodEnd: number,
    createdBy: string,
    driverIds?: string[],
    defaultCommissionPercent: number = 10
  ): Promise<Payout[]> {
    // Calculate payouts
    const calculations = await this.calculatePayouts(
      periodStart,
      periodEnd,
      driverIds,
      defaultCommissionPercent
    );

    // Create payout records
    const payouts = await commissionEngine.createPayoutsFromCalculations(
      calculations,
      createdBy
    );

    // Log audit trail for each payout
    for (const payout of payouts) {
      await auditLogger.logPayoutCreation(
        createdBy,
        'admin',
        payout.id,
        payout.driverId,
        payout.netCents
      );
    }

    return payouts;
  }

  async getPayoutSummary(periodStart?: number, periodEnd?: number): Promise<PayoutSummary> {
    let payouts = await store.payouts.findAll();

    // Filter by period if provided
    if (periodStart && periodEnd) {
      payouts = payouts.filter(payout => 
        payout.periodStart >= periodStart && payout.periodEnd <= periodEnd
      );
    }

    const totalPayouts = payouts.length;
    const totalAmount = payouts.reduce((sum, payout) => sum + payout.netCents, 0);
    
    const paidPayouts = payouts.filter(payout => payout.status === 'paid').length;
    const paidAmount = payouts
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.netCents, 0);
    
    const pendingPayouts = payouts.filter(payout => payout.status === 'pending').length;
    const pendingAmount = payouts
      .filter(payout => payout.status === 'pending')
      .reduce((sum, payout) => sum + payout.netCents, 0);

    const averagePayout = totalPayouts > 0 ? totalAmount / totalPayouts : 0;

    return {
      totalPayouts,
      totalAmount: totalAmount / 100, // Convert to EUR
      paidPayouts,
      paidAmount: paidAmount / 100,
      pendingPayouts,
      pendingAmount: pendingAmount / 100,
      averagePayout: averagePayout / 100,
    };
  }

  async markPayoutAsPaid(
    payoutId: string,
    proofUrl?: string,
    markedBy?: string
  ): Promise<Payout | null> {
    const payout = await store.payouts.findById(payoutId);
    
    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status === 'paid') {
      throw new Error('Payout already marked as paid');
    }

    // Update payout status
    await store.payouts.update(payoutId, {
      status: 'paid',
      proofUrl,
      paidAt: Date.now(),
    });

    // Log audit trail
    if (markedBy) {
      await auditLogger.logPayoutMarkPaid(
        markedBy,
        'admin',
        payoutId,
        proofUrl
      );
    }

    return await store.payouts.findById(payoutId);
  }

  async markMultiplePayoutsAsPaid(
    payoutIds: string[],
    proofUrl?: string,
    markedBy?: string
  ): Promise<Payout[]> {
    const updatedPayouts: Payout[] = [];

    for (const payoutId of payoutIds) {
      try {
        const payout = await this.markPayoutAsPaid(payoutId, proofUrl, markedBy);
        if (payout) {
          updatedPayouts.push(payout);
        }
      } catch (error) {
        console.error(`Failed to mark payout ${payoutId} as paid:`, error);
      }
    }

    return updatedPayouts;
  }

  async getDriverPayoutHistory(
    driverId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    payouts: Payout[];
    total: number;
    summary: {
      totalPayouts: number;
      totalAmount: number;
      averagePayout: number;
    };
  }> {
    const allPayouts = await store.payouts.findByDriverId(driverId);
    
    // Sort by creation date (newest first)
    allPayouts.sort((a, b) => b.createdAt - a.createdAt);
    
    const total = allPayouts.length;
    const payouts = allPayouts.slice(offset, offset + limit);
    
    const totalAmount = allPayouts.reduce((sum, payout) => sum + payout.netCents, 0);
    const averagePayout = total > 0 ? totalAmount / total : 0;

    return {
      payouts,
      total,
      summary: {
        totalPayouts: total,
        totalAmount: totalAmount / 100, // Convert to EUR
        averagePayout: averagePayout / 100,
      },
    };
  }

  async exportPayoutsCSV(
    periodStart: number,
    periodEnd: number,
    driverIds?: string[],
    includeDetails: boolean = true
  ): Promise<string> {
    const calculations = await this.calculatePayouts(periodStart, periodEnd, driverIds);
    
    if (includeDetails) {
      return await commissionEngine.exportPayoutsCSV(periodStart, periodEnd, driverIds);
    }

    // Simplified CSV with just payout amounts
    const headers = [
      'Driver ID',
      'Period Start',
      'Period End',
      'Net Amount (EUR)',
      'Status',
    ];

    const payouts = await store.payouts.findAll();
    const periodPayouts = payouts.filter(payout => 
      payout.periodStart >= periodStart && 
      payout.periodEnd <= periodEnd &&
      (!driverIds || driverIds.includes(payout.driverId))
    );

    const rows = periodPayouts.map(payout => [
      payout.driverId,
      new Date(payout.periodStart).toISOString().split('T')[0],
      new Date(payout.periodEnd).toISOString().split('T')[0],
      (payout.netCents / 100).toFixed(2),
      payout.status,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  async getPayoutAnalytics(
    periodStart?: number,
    periodEnd?: number
  ): Promise<{
    byStatus: Record<PayoutStatus, number>;
    byDriver: Array<{
      driverId: string;
      driverName: string;
      totalAmount: number;
      payoutCount: number;
    }>;
    trends: Array<{
      period: string;
      amount: number;
      count: number;
    }>;
  }> {
    let payouts = await store.payouts.findAll();

    // Filter by period if provided
    if (periodStart && periodEnd) {
      payouts = payouts.filter(payout => 
        payout.periodStart >= periodStart && payout.periodEnd <= periodEnd
      );
    }

    // Group by status
    const byStatus = payouts.reduce((acc, payout) => {
      acc[payout.status] = (acc[payout.status] || 0) + 1;
      return acc;
    }, {} as Record<PayoutStatus, number>);

    // Group by driver
    const driverMap = new Map<string, { totalAmount: number; count: number }>();
    
    for (const payout of payouts) {
      const existing = driverMap.get(payout.driverId) || { totalAmount: 0, count: 0 };
      driverMap.set(payout.driverId, {
        totalAmount: existing.totalAmount + payout.netCents,
        count: existing.count + 1,
      });
    }

    const byDriver = await Promise.all(
      Array.from(driverMap.entries()).map(async ([driverId, data]) => {
        const driver = await store.drivers.findById(driverId);
        return {
          driverId,
          driverName: driver?.name || 'Unknown',
          totalAmount: data.totalAmount / 100,
          payoutCount: data.count,
        };
      })
    );

    // Calculate trends (monthly)
    const trends = new Map<string, { amount: number; count: number }>();
    
    for (const payout of payouts) {
      const month = new Date(payout.periodStart).toISOString().substring(0, 7); // YYYY-MM
      const existing = trends.get(month) || { amount: 0, count: 0 };
      trends.set(month, {
        amount: existing.amount + payout.netCents,
        count: existing.count + 1,
      });
    }

    const trendsArray = Array.from(trends.entries())
      .map(([period, data]) => ({
        period,
        amount: data.amount / 100,
        count: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      byStatus,
      byDriver: byDriver.sort((a, b) => b.totalAmount - a.totalAmount),
      trends: trendsArray,
    };
  }
}

export const payoutEngine = new PayoutEngine();

