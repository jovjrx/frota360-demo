import { z } from 'zod';

export const SubscriptionStatusSchema = z.enum(['active', 'past_due', 'canceled', 'incomplete', 'trialing']);

export const SubscriptionProviderSchema = z.object({
  customerId: z.string().optional(),
  subId: z.string().optional(),
  paymentMethodId: z.string().optional(),
});

export const SubscriptionSchema = z.object({
  id: z.string().optional(),
  driverId: z.string().min(1),
  planId: z.string().min(1),
  status: SubscriptionStatusSchema.default('incomplete'),
  currentPeriodStart: z.number(),
  currentPeriodEnd: z.number(),
  cancelAt: z.number().optional(),
  canceledAt: z.number().optional(),
  trialStart: z.number().optional(),
  trialEnd: z.number().optional(),
  provider: SubscriptionProviderSchema.optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreateSubscriptionSchema = SubscriptionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateSubscriptionSchema = SubscriptionSchema.partial().omit({
  id: true,
  driverId: true,
  planId: true,
  createdAt: true,
});

export const SwitchSubscriptionSchema = z.object({
  newPlanId: z.string().min(1),
  prorate: z.boolean().default(true),
});

export const CancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
  reason: z.string().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof UpdateSubscriptionSchema>;
export type SwitchSubscription = z.infer<typeof SwitchSubscriptionSchema>;
export type CancelSubscription = z.infer<typeof CancelSubscriptionSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

