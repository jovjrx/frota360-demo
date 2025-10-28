import { z } from 'zod';

export const InvoiceStatusSchema = z.enum(['paid', 'open', 'void', 'uncollectible']);

export const BillingProviderSchema = z.object({
  invoiceId: z.string().optional(),
  url: z.string().optional(),
  paymentIntentId: z.string().optional(),
});

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  driverId: z.string().min(1),
  subscriptionId: z.string().optional(),
  amountCents: z.number().int().min(0),
  currency: z.string().default('EUR'),
  status: InvoiceStatusSchema.default('open'),
  dueDate: z.number(),
  paidAt: z.number().optional(),
  description: z.string().optional(),
  provider: BillingProviderSchema.optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateInvoiceSchema = InvoiceSchema.partial().omit({
  id: true,
  driverId: true,
  createdAt: true,
});

export const PaymentMethodSchema = z.object({
  id: z.string(),
  type: z.enum(['card', 'bank_account']),
  last4: z.string().optional(),
  brand: z.string().optional(),
  expiryMonth: z.number().optional(),
  expiryYear: z.number().optional(),
});

export const CustomerSchema = z.object({
  id: z.string().optional(),
  driverId: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  provider: z.object({
    customerId: z.string(),
  }),
  paymentMethods: z.array(PaymentMethodSchema).default([]),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Invoice = z.infer<typeof InvoiceSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;

