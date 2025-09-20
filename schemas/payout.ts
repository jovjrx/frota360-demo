import { z } from 'zod';

export const PayoutStatusSchema = z.enum(['pending', 'paid', 'failed']);

export const PayoutSchema = z.object({
  id: z.string().optional(),
  driverId: z.string().min(1),
  periodStart: z.number(),
  periodEnd: z.number(),
  grossCents: z.number().int().min(0),
  commissionCents: z.number().int().min(0),
  feesCents: z.number().int().min(0).default(0),
  netCents: z.number().int().min(0),
  status: PayoutStatusSchema.default('pending'),
  proofUrl: z.string().optional(),
  paidAt: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreatePayoutSchema = PayoutSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdatePayoutSchema = PayoutSchema.partial().omit({
  id: true,
  driverId: true,
  periodStart: true,
  periodEnd: true,
  grossCents: true,
  commissionCents: true,
  feesCents: true,
  netCents: true,
  createdAt: true,
});

export const TripRevenueSchema = z.object({
  id: z.string().optional(),
  driverId: z.string().min(1),
  tripId: z.string().optional(),
  source: z.enum(['uber', 'manual']),
  grossCents: z.number().int().min(0),
  currency: z.string().default('EUR'),
  date: z.number(),
  meta: z.record(z.string(), z.any()).optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreateTripRevenueSchema = TripRevenueSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const PayoutCalculationSchema = z.object({
  periodStart: z.number(),
  periodEnd: z.number(),
  driverIds: z.array(z.string()).optional(),
  defaultCommissionPercent: z.number().min(0).max(100).default(10),
});

export type Payout = z.infer<typeof PayoutSchema>;
export type CreatePayout = z.infer<typeof CreatePayoutSchema>;
export type UpdatePayout = z.infer<typeof UpdatePayoutSchema>;
export type PayoutStatus = z.infer<typeof PayoutStatusSchema>;
export type TripRevenue = z.infer<typeof TripRevenueSchema>;
export type CreateTripRevenue = z.infer<typeof CreateTripRevenueSchema>;
export type PayoutCalculation = z.infer<typeof PayoutCalculationSchema>;
