import cron from 'node-cron';
import { isBillingEnabled } from '../modules/billing/billing.config';
import { billingService } from '../modules/billing/application/services/billing.service';

export function iniciarJobBilling() {
  if (!isBillingEnabled()) {
    console.log('[JOB] Billing scheduler desabilitado (BILLING_ENABLED=false).');
    return;
  }

  cron.schedule('0 3 * * *', async () => {
    console.log('[JOB] Executando manutenção billing...');
    try {
      const result = await billingService.runMaintenanceJobs();
      console.log(
        `[JOB] Billing: trials=${result.expiredTrials}, subs=${result.expiredSubs}, licenses=${result.expiredLicenses}`
      );
    } catch (err) {
      console.error('[JOB] Erro billing:', err);
    }
  });

  console.log('[JOB] Billing scheduler ativo (diário às 03:00).');
}
