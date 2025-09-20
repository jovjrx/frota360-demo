import { z } from 'zod';

export const UberTripStatusSchema = z.enum(['completed', 'cancelled', 'in_progress']);

export const UberTripSchema = z.object({
  id: z.string(),
  driverId: z.string().optional(),
  tripId: z.string(),
  status: UberTripStatusSchema,
  startTime: z.number(),
  endTime: z.number().optional(),
  pickupLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  dropoffLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  fare: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
  distance: z.number().optional(),
  duration: z.number().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export const UberWebhookEventSchema = z.object({
  event_type: z.string(),
  resource_href: z.string(),
  event_time: z.number(),
  meta: z.record(z.string(), z.any()).optional(),
});

export const UberOAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export const UberUserProfileSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  picture: z.string().optional(),
  promo_code: z.string().optional(),
});

export const UberReceiptSchema = z.object({
  receipt_id: z.string(),
  trip_id: z.string(),
  subtotal: z.string(),
  total_charged: z.string(),
  currency_code: z.string(),
  charge_adjustments: z.array(z.any()).optional(),
  total_fare: z.string().optional(),
  total_owed: z.string().optional(),
  total_paid: z.string().optional(),
  payment_method: z.string().optional(),
  date: z.number(),
});

export type UberTrip = z.infer<typeof UberTripSchema>;
export type UberWebhookEvent = z.infer<typeof UberWebhookEventSchema>;
export type UberOAuthResponse = z.infer<typeof UberOAuthResponseSchema>;
export type UberUserProfile = z.infer<typeof UberUserProfileSchema>;
export type UberReceipt = z.infer<typeof UberReceiptSchema>;
