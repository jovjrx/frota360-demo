import { z } from 'zod';

export const AuditActorRoleSchema = z.enum(['admin', 'ops', 'driver', 'system']);

export const AuditSubjectTypeSchema = z.enum([
  'driver',
  'plan',
  'subscription',
  'invoice',
  'payout',
  'trip_revenue',
  'user',
  'system'
]);

export const AuditSchema = z.object({
  id: z.string().optional(),
  actorId: z.string(),
  actorRole: AuditActorRoleSchema,
  action: z.string(),
  subjectType: AuditSubjectTypeSchema,
  subjectId: z.string(),
  payloadHash: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  at: z.number(),
});

export const CreateAuditSchema = AuditSchema.omit({
  id: true,
  at: true,
});

export const AuditFilterSchema = z.object({
  actorId: z.string().optional(),
  actorRole: AuditActorRoleSchema.optional(),
  subjectType: AuditSubjectTypeSchema.optional(),
  subjectId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export type Audit = z.infer<typeof AuditSchema>;
export type CreateAudit = z.infer<typeof CreateAuditSchema>;
export type AuditFilter = z.infer<typeof AuditFilterSchema>;
export type AuditActorRole = z.infer<typeof AuditActorRoleSchema>;
export type AuditSubjectType = z.infer<typeof AuditSubjectTypeSchema>;
