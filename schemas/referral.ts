import { z } from 'zod';

/**
 * SCHEMA: Referral
 * Rastreia convites de recrutamento e árvore de afiliação
 */

export const ReferralInviteSchema = z.object({
  id: z.string().optional(),
  
  // Referenciador (quem está convidando)
  referrerId: z.string(),
  referrerName: z.string(),
  
  // Código único de convite
  inviteCode: z.string(),
  
  // Informações do convidado
  email: z.string().email().optional(),
  phone: z.string().optional(),
  
  // Status do convite
  status: z.enum(['pending', 'accepted', 'expired']).default('pending'),
  
  // Datas
  createdAt: z.string(),
  acceptedAt: z.string().nullable().optional(),
  expiresAt: z.string(),
  
  // Referência ao motorista que aceitou (se aceito)
  acceptedByDriverId: z.string().nullable().optional(),
  acceptedByDriverName: z.string().nullable().optional(),
});

export const AffiliateNetworkSchema = z.object({
  id: z.string().optional(),
  
  // Motorista
  driverId: z.string(),
  driverName: z.string(),
  driverEmail: z.string().optional(),
  
  // Recrutador (se foi recrutado)
  recruitedBy: z.string().nullable().optional(),
  recruitedByName: z.string().nullable().optional(),
  recruitedAt: z.string().nullable().optional(),
  
  // Motoristas recrutados por este
  recruitedDrivers: z.array(z.object({
    driverId: z.string(),
    driverName: z.string(),
    driverEmail: z.string().optional(),
    recruitedDate: z.string(),
    status: z.enum(['active', 'inactive', 'suspended']),
    currentLevel: z.number().int().min(1).max(3).default(1),
  })).default([]),
  
  // Estatísticas
  totalRecruitments: z.number().default(0),
  activeRecruitments: z.number().default(0),
  
  // Nível do afiliado
  affiliateLevel: z.number().int().min(1).max(3).default(1),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AffiliateHierarchySchema = z.object({
  id: z.string().optional(),
  
  // Motorista
  driverId: z.string(),
  driverName: z.string(),
  
  // Nível na hierarquia (0 = root/founder, 1 = diretos, 2 = indiretos, etc)
  hierarchyLevel: z.number().int().default(0),
  
  // Caminho na árvore (IDs dos ancestrais)
  ancestorIds: z.array(z.string()).default([]),
  ancestorNames: z.array(z.string()).default([]),
  
  // Descendentes diretos
  directRecruits: z.array(z.string()).default([]),
  
  // Todos os descendentes (para cálculo de comissões indiretas)
  allDescendants: z.array(z.string()).default([]),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types
export type ReferralInvite = z.infer<typeof ReferralInviteSchema>;
export type AffiliateNetwork = z.infer<typeof AffiliateNetworkSchema>;
export type AffiliateHierarchy = z.infer<typeof AffiliateHierarchySchema>;

/**
 * Gerar código de convite único
 */
export function generateInviteCode(referrerId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  const driverId = referrerId.substring(0, 4);
  return `CONDUZ-${driverId}-${timestamp}-${random}`.toUpperCase();
}

/**
 * Validar código de convite
 */
export function isValidInviteCode(code: string): boolean {
  return /^CONDUZ-[A-Z0-9]{4}-[A-Z0-9]+-[A-Z0-9]+$/.test(code);
}

