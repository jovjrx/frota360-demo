import { z } from 'zod';

/**
 * Schema de financiamento utilizado para controlar empréstimos e descontos.
 *
 * type: 'loan' para um financiamento tradicional com prazo determinado;
 *        'discount' para um desconto vitalício (sem prazo definido).
 * amount: valor total do financiamento ou do desconto semanal.
 * weeks: quantidade de semanas para amortização do financiamento (null em discounts).
 * weeklyInterest: PERCENTUAL adicional de juros (%) somado à taxa administrativa (7%). Ex: 4% = taxa total de 11%.
 * startDate: data de início do financiamento (ISO string).
 * endDate: data calculada automaticamente ao finalizar (quando remainingWeeks chega a 0).
 * status: 'active' enquanto em vigor, 'completed' quando finalizado/reembolsado.
 * remainingWeeks: contador regressivo de semanas restantes, decrementado automaticamente.
 */
export const FinancingSchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  type: z.enum(['loan', 'discount']),
  amount: z.number(),
  weeks: z.number().nullable().optional(),
  weeklyInterest: z.number().default(0),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  status: z.enum(['active', 'completed']).default('active'),
  remainingWeeks: z.number().nullable().optional(),
  // Campos de comprovante de pagamento
  proofUrl: z.string().nullable().optional(),
  proofFileName: z.string().nullable().optional(),
  proofUploadedAt: z.string().nullable().optional(),
  // Campos de auditoria
  notes: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Financing = z.infer<typeof FinancingSchema>;

/**
 * Schema para solicitação de financiamento enviada pelo motorista.
 * O admin aprova e cria um Financing com base nessa solicitação.
 */
export const FinancingRequestSchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  amount: z.number(),
  weeks: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

export type FinancingRequest = z.infer<typeof FinancingRequestSchema>;