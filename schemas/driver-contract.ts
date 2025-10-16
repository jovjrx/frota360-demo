import { z } from 'zod';

export const DriverContractSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverEmail: z.string().optional(),
  contractType: z.enum(['affiliate', 'renter']),
  templateVersion: z.string(),
  signedDocumentUrl: z.string().nullable(),
  signedDocumentFileName: z.string().nullable(),
  submittedAt: z.string().nullable(),
  status: z.enum(['pending_signature', 'submitted', 'approved', 'rejected']).default('pending_signature'),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  emailSentAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DriverContract = z.infer<typeof DriverContractSchema>;
