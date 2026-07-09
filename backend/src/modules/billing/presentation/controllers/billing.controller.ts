import { Request, Response } from 'express';
import { BillingPaymentProvider, BillingSubscriptionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { billingService } from '../../application/services/billing.service';
import { AppError } from '../../../../shared/errors/AppError';
import { isBillingEnabled } from '../../billing.config';
import { getRouteParam } from '../../../../shared/utils/request.util';
import {
  getWebhookRawBody,
  normalizeHeaders,
  parseWebhookJson,
} from '../utils/webhook.util';

function isPrismaMissingTable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2021' || error.code === 'P2022')
  );
}

async function handleWebhook(
  req: Request,
  res: Response,
  provider: BillingPaymentProvider
) {
  try {
    const rawBody = getWebhookRawBody(req);
    const body = parseWebhookJson(rawBody);
    const headers = normalizeHeaders(req.headers);

    const result = await billingService.processWebhook(provider, headers, body, rawBody);
    res.json({ ok: true, ...result });
  } catch (error) {
    if (isPrismaMissingTable(error)) {
      throw new AppError('Módulo billing não migrado no banco de dados', 503);
    }
    throw error;
  }
}
function ensureBilling() {
  if (!isBillingEnabled()) throw new AppError('Módulo billing desabilitado', 503);
}

export const billingController = {
  async dashboard(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.dashboard());
  },

  async listProducts(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listProducts());
  },

  async listPlans(req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listPlans(req.query.productId as string | undefined));
  },

  async listFeatures(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listFeatures());
  },

  async listSubscriptions(req: Request, res: Response) {
    ensureBilling();
    res.json(
      await billingService.listSubscriptions({
        tenantId: req.query.tenantId as string | undefined,
        status: req.query.status as BillingSubscriptionStatus | undefined,
        search: req.query.search as string | undefined,
      })
    );
  },

  async createManualSubscription(req: Request, res: Response) {
    ensureBilling();
    const { tenantId, planSlug } = req.body as { tenantId?: string; planSlug?: string };
    if (!tenantId || !planSlug) throw new AppError('tenantId e planSlug obrigatórios', 400);
    res.status(201).json(await billingService.createManualSubscription(tenantId, planSlug));
  },

  async listPayments(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listPayments());
  },

  async listLicenses(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listLicenses());
  },

  async listTrials(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listTrials());
  },

  async listCoupons(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listCoupons());
  },

  async listWebhookLogs(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listWebhookLogs());
  },

  async listAuditLogs(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listAuditLogs());
  },

  async listEvents(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listEvents());
  },

  async changePlan(req: Request, res: Response) {
    ensureBilling();
    const { planId } = req.body as { planId?: string };
    if (!planId) throw new AppError('planId obrigatório', 400);
    res.json(await billingService.changePlan(getRouteParam(req, 'id'), planId, 'master'));
  },

  async cancelSubscription(req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.cancelSubscription(getRouteParam(req, 'id')));
  },

  async tenantSubscription(req: Request, res: Response) {
    ensureBilling();
    const tenantId = req.empresaId!;
    res.json(await billingService.getTenantSubscription(tenantId));
  },

  async tenantPlans(_req: Request, res: Response) {
    ensureBilling();
    res.json(await billingService.listPlans());
  },

  async tenantCheckout(req: Request, res: Response) {
    ensureBilling();
    const { planSlug, provider } = req.body as { planSlug?: string; provider?: BillingPaymentProvider };
    if (!planSlug) throw new AppError('planSlug obrigatório', 400);
    const prov = provider ?? BillingPaymentProvider.KIWIFY;
    res.json(await billingService.createCheckout(req.empresaId!, planSlug, prov));
  },

  async tenantCancel(req: Request, res: Response) {
    ensureBilling();
    const sub = await billingService.getTenantSubscription(req.empresaId!);
    if (!sub) throw new AppError('Assinatura não encontrada', 404);
    res.json(await billingService.cancelSubscription(sub.id));
  },

  async webhookKiwify(req: Request, res: Response) {
    await handleWebhook(req, res, BillingPaymentProvider.KIWIFY);
  },

  async webhookHotmart(req: Request, res: Response) {
    await handleWebhook(req, res, BillingPaymentProvider.HOTMART);
  },
};