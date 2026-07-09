import { Router } from 'express';
import { billingController } from '../controllers/billing.controller';
import { masterAuthMiddleware } from '../../../../middlewares/masterAuth.middleware';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import { isBillingEnabled } from '../../billing.config';

export const billingRoutes = Router();

billingRoutes.post('/webhooks/kiwify', (req, res, next) =>
  billingController.webhookKiwify(req, res).catch(next)
);
billingRoutes.post('/webhooks/hotmart', (req, res, next) =>
  billingController.webhookHotmart(req, res).catch(next)
);

if (isBillingEnabled()) {
  const master = masterAuthMiddleware;
  const tenant = authMiddleware;

  billingRoutes.get('/master/dashboard', master, (req, res, next) =>
    billingController.dashboard(req, res).catch(next)
  );
  billingRoutes.get('/master/products', master, (req, res, next) =>
    billingController.listProducts(req, res).catch(next)
  );
  billingRoutes.get('/master/plans', master, (req, res, next) =>
    billingController.listPlans(req, res).catch(next)
  );
  billingRoutes.get('/master/features', master, (req, res, next) =>
    billingController.listFeatures(req, res).catch(next)
  );
  billingRoutes.get('/master/subscriptions', master, (req, res, next) =>
    billingController.listSubscriptions(req, res).catch(next)
  );
  billingRoutes.post('/master/subscriptions', master, (req, res, next) =>
    billingController.createManualSubscription(req, res).catch(next)
  );
  billingRoutes.patch('/master/subscriptions/:id/plan', master, (req, res, next) =>
    billingController.changePlan(req, res).catch(next)
  );
  billingRoutes.post('/master/subscriptions/:id/cancel', master, (req, res, next) =>
    billingController.cancelSubscription(req, res).catch(next)
  );
  billingRoutes.get('/master/payments', master, (req, res, next) =>
    billingController.listPayments(req, res).catch(next)
  );
  billingRoutes.get('/master/licenses', master, (req, res, next) =>
    billingController.listLicenses(req, res).catch(next)
  );
  billingRoutes.get('/master/trials', master, (req, res, next) =>
    billingController.listTrials(req, res).catch(next)
  );
  billingRoutes.get('/master/coupons', master, (req, res, next) =>
    billingController.listCoupons(req, res).catch(next)
  );
  billingRoutes.get('/master/webhooks', master, (req, res, next) =>
    billingController.listWebhookLogs(req, res).catch(next)
  );
  billingRoutes.get('/master/audit-logs', master, (req, res, next) =>
    billingController.listAuditLogs(req, res).catch(next)
  );
  billingRoutes.get('/master/events', master, (req, res, next) =>
    billingController.listEvents(req, res).catch(next)
  );

  billingRoutes.get('/tenant/subscription', tenant, (req, res, next) =>
    billingController.tenantSubscription(req, res).catch(next)
  );
  billingRoutes.get('/tenant/plans', tenant, (req, res, next) =>
    billingController.tenantPlans(req, res).catch(next)
  );
  billingRoutes.post('/tenant/checkout', tenant, (req, res, next) =>
    billingController.tenantCheckout(req, res).catch(next)
  );
  billingRoutes.post('/tenant/cancel', tenant, (req, res, next) =>
    billingController.tenantCancel(req, res).catch(next)
  );
}
