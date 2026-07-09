import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';

export async function logBillingAudit(
  action: string,
  module: string,
  details?: Prisma.InputJsonValue,
  opts?: { tenantId?: string; actorId?: string; ip?: string }
) {
  try {
    await prisma.billingAuditLog.create({
      data: {
        action,
        module,
        details: details ?? undefined,
        tenantId: opts?.tenantId ?? null,
        actorId: opts?.actorId ?? null,
        ip: opts?.ip ?? null,
      },
    });
  } catch (error) {
    console.error('[Billing] Audit log error:', error);
  }
}
