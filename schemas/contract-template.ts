import { z } from 'zod';

export const ContractTemplateSchema = z.object({
  id: z.string(),
  type: z.enum(['affiliate', 'renter']),
  version: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  storagePath: z.string().optional(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  isActive: z.boolean().default(true),
});

export type ContractTemplate = z.infer<typeof ContractTemplateSchema>;
