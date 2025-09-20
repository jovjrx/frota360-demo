import { z } from 'zod';

export const PlanIntervalSchema = z.enum(['month', 'year']);

export const PlanFeaturesSchema = z.array(z.string()).default([]);

export const PlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().default('EUR'),
  interval: PlanIntervalSchema,
  trialDays: z.number().int().min(0).optional(),
  active: z.boolean().default(true),
  features: PlanFeaturesSchema,
  maxDrivers: z.number().int().min(1).optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreatePlanSchema = PlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdatePlanSchema = PlanSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type Plan = z.infer<typeof PlanSchema>;
export type CreatePlan = z.infer<typeof CreatePlanSchema>;
export type UpdatePlan = z.infer<typeof UpdatePlanSchema>;
export type PlanInterval = z.infer<typeof PlanIntervalSchema>;
