import { z } from 'zod';

/**
 * Schema de financiamento utilizado para controlar empréstimos e descontos.
 *
 * type: 'loan' para um financiamento tradicional com prazo determinado;
 *        'discount' para um desconto vitalício (sem prazo definido).
 * amount: valor total do financiamento ou do desconto semanal.
 * weeks: quantidade de semanas para amortização do financiamento (null em discounts).
 * weeklyInterest: valor fixo de juros adicionado a despesas administrativas a cada semana.
 * startDate: data de início do financiamento (ISO string).
 * endDate: data prevista de término (pode ser null em discounts ou enquanto ativo).
 * status: 'active' enquanto em vigor, 'completed' quando finalizado/reembolsado.
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