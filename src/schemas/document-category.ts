import { z } from 'zod';

export const DocumentCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['company', 'affiliate', 'renter']).default('company'),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DocumentCategory = z.infer<typeof DocumentCategorySchema>;
