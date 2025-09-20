import { store } from '@/lib/store';
import { hash } from '@/lib/crypto/secretBox';
import { CreateAuditSchema } from '@/schemas/audit';
import { AuditActorRole, AuditSubjectType } from '@/schemas/audit';

export interface AuditContext {
  actorId: string;
  actorRole: AuditActorRole;
}

export interface AuditAction {
  action: string;
  subjectType: AuditSubjectType;
  subjectId: string;
  details?: Record<string, any>;
}

export class AuditLogger {
  async log(context: AuditContext, action: AuditAction): Promise<string> {
    const auditData = CreateAuditSchema.parse({
      ...context,
      ...action,
      payloadHash: hash(JSON.stringify(action.details || {})),
    });
    
    return await store.audit.create(auditData);
  }

  async logDriverCreation(actorId: string, actorRole: AuditActorRole, driverId: string, driverEmail: string): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: 'create',
        subjectType: 'driver',
        subjectId: driverId,
        details: { driverEmail },
      }
    );
  }

  async logDriverUpdate(actorId: string, actorRole: AuditActorRole, driverId: string, changes: Record<string, any>): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: 'update',
        subjectType: 'driver',
        subjectId: driverId,
        details: { changes },
      }
    );
  }

  async logDriverVerification(actorId: string, actorRole: AuditActorRole, driverId: string, status: string, reason?: string): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: 'verify',
        subjectType: 'driver',
        subjectId: driverId,
        details: { status, reason },
      }
    );
  }

  async logSubscriptionCreation(actorId: string, actorRole: AuditActorRole, subscriptionId: string, driverId: string, planId: string): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: 'create',
        subjectType: 'subscription',
        subjectId: subscriptionId,
        details: { driverId, planId },
      }
    );
  }

  async logSubscriptionUpdate(actorId: string, actorRole: AuditActorRole, subscriptionId: string, changes: Record<string, any>): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: 'update',
        subjectType: 'subscription',
        subjectId: subscriptionId,
        details: { changes },
      }
    );
  }

  async logPayoutCreation(actorId: string, actorRole: AuditActorRole, payoutId: string, driverId: string, amountCents: number): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: 'create',
        subjectType: 'payout',
        subjectId: payoutId,
        details: { driverId, amountCents },
      }
    );
  }

  async logPayoutMarkPaid(actorId: string, actorRole: AuditActorRole, payoutId: string, proofUrl?: string): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: 'mark_paid',
        subjectType: 'payout',
        subjectId: payoutId,
        details: { proofUrl },
      }
    );
  }

  async logUberIntegration(actorId: string, actorRole: AuditActorRole, action: string, details: Record<string, any>): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action,
        subjectType: 'system',
        subjectId: 'uber',
        details,
      }
    );
  }

  async logBillingEvent(actorId: string, actorRole: AuditActorRole, eventType: string, invoiceId: string, details: Record<string, any>): Promise<string> {
    return this.log(
      { actorId, actorRole },
      {
        action: eventType,
        subjectType: 'invoice',
        subjectId: invoiceId,
        details,
      }
    );
  }

  async getAuditLogs(filter?: {
    actorId?: string;
    actorRole?: AuditActorRole;
    subjectType?: AuditSubjectType;
    subjectId?: string;
    action?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const logs = await store.audit.findAll();
    
    let filtered = logs;
    
    if (filter) {
      if (filter.actorId) {
        filtered = filtered.filter(log => log.actorId === filter.actorId);
      }
      if (filter.actorRole) {
        filtered = filtered.filter(log => log.actorRole === filter.actorRole);
      }
      if (filter.subjectType) {
        filtered = filtered.filter(log => log.subjectType === filter.subjectType);
      }
      if (filter.subjectId) {
        filtered = filtered.filter(log => log.subjectId === filter.subjectId);
      }
      if (filter.action) {
        filtered = filtered.filter(log => log.action === filter.action);
      }
      if (filter.startDate) {
        filtered = filtered.filter(log => log.at >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(log => log.at <= filter.endDate!);
      }
      
      const offset = filter.offset || 0;
      const limit = filter.limit || 100;
      filtered = filtered.slice(offset, offset + limit);
    }
    
    return filtered;
  }
}

export const auditLogger = new AuditLogger();
