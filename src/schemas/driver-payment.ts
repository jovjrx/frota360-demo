import { z } from 'zod';
import { DriverWeeklyRecordSchema } from './driver-weekly-record';
import { WeeklyNormalizedDataSchema } from './data-weekly';

const DriverPaymentRecordSnapshotSchema = DriverWeeklyRecordSchema.pick({
  id: true,
  driverId: true,
  driverName: true,
  driverEmail: true,
  // ✅ ADICIONADO: type do driver
  type: true,
  weekId: true,
  weekStart: true,
  weekEnd: true,
  isLocatario: true,
  combustivel: true,
  viaverde: true,
  aluguel: true,
  ganhosTotal: true,
  ivaValor: true,
  ganhosMenosIVA: true,
  despesasAdm: true,
  // ✅ ADICIONADO: Campos que faltavam
  financingDetails: true,
  commissionAmount: true,
  totalBonusAmount: true,
  totalDespesas: true,
  repasse: true,
  iban: true,
  paymentStatus: true,
  paymentDate: true,
  dataSource: true,
  createdAt: true,
  updatedAt: true,
  notes: true,
}).extend({
  platformData: z.array(WeeklyNormalizedDataSchema).optional(),
  bonusMetaAmount: z.number().default(0).optional(),
  bonusReferralAmount: z.number().default(0).optional(),
});

export const DriverPaymentSchema = z.object({
  id: z.string(),
  recordId: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  weekId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  currency: z.string().default('EUR'),
  baseAmount: z.number(),
  baseAmountCents: z.number().int(),
  bonusAmount: z.number().default(0),
  bonusCents: z.number().int().default(0),
  bonusMetaAmount: z.number().default(0).optional(),
  bonusReferralAmount: z.number().default(0).optional(),
  commissionAmount: z.number().default(0).optional(),
  discountAmount: z.number().default(0),
  discountCents: z.number().int().default(0),
  totalAmount: z.number(),
  totalAmountCents: z.number().int(),
  // Admin fee (frozen at payment time)
  adminFeePercentage: z.number().default(7),
  adminFeeValue: z.number().default(0),
  adminFeeCents: z.number().int().default(0),
  iban: z.string().optional(),
  paymentDate: z.string(),
  notes: z.string().optional(),
  proofUrl: z.string().url().optional(),
  proofStoragePath: z.string().optional(),
  proofFileName: z.string().optional(),
  proofFileSize: z.number().int().nonnegative().optional(),
  proofContentType: z.string().optional(),
  proofUploadedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // ✅ ADICIONADO: Plataformas e despesas para referência rápida
  uberTotal: z.number().default(0).optional(),
  boltTotal: z.number().default(0).optional(),
  combustivel: z.number().default(0).optional(),
  portagens: z.number().default(0).optional(),
  aluguel: z.number().default(0).optional(),
  // Totalizadores
  ganhosTotal: z.number().default(0).optional(),
  ivaValor: z.number().default(0).optional(),
  ganhosMenosIVA: z.number().default(0).optional(),
  despesasAdm: z.number().default(0).optional(),
  financingDetails: z.any().optional(),
  createdBy: z
    .object({
      uid: z.string().optional(),
      email: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  recordSnapshot: DriverPaymentRecordSnapshotSchema.optional(),
});

export const CreateDriverPaymentSchema = DriverPaymentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DriverPayment = z.infer<typeof DriverPaymentSchema>;
export type CreateDriverPayment = z.infer<typeof CreateDriverPaymentSchema>;
export type DriverPaymentRecordSnapshot = z.infer<typeof DriverPaymentRecordSnapshotSchema>;

