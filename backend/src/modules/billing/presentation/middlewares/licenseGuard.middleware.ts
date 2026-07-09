import { Request, Response, NextFunction } from 'express';
import { BillingLicenseStatus } from '@prisma/client';
import { prisma } from '../../../../config/database';
import { AppError } from '../../../../shared/errors/AppError';
import { isBillingEnforceAccess } from '../../billing.config';
import { billingService } from '../../application/services/billing.service';

export async function licenseGuardMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!isBillingEnforceAccess()) return next();

  const tenantId = req.empresaId;
  if (!tenantId) return next();

  const license = await billingService.getActiveLicense(tenantId);
  if (!license) {
    throw new AppError('Licença SaaS inativa. Regularize sua assinatura.', 402);
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    await prisma.billingLicense.update({
      where: { id: license.id },
      data: { status: BillingLicenseStatus.EXPIRED },
    });
    throw new AppError('Licença SaaS expirada. Renove sua assinatura.', 402);
  }

  req.billingLicense = {
    features: (license.features as string[]) ?? [],
    limits: (license.limits as Record<string, number>) ?? {},
    planSlug: license.subscription?.plan?.slug,
  };

  next();
}
