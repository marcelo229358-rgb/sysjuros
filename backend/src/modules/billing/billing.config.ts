import { env } from '../../config/env';

export const BILLING_PRODUCT_SLUG = env.BILLING_PRODUCT_ID.toLowerCase();

export function isBillingEnabled(): boolean {
  return env.BILLING_ENABLED;
}

export function isBillingEnforceAccess(): boolean {
  return env.BILLING_ENABLED && env.BILLING_ENFORCE_ACCESS;
}

export const LEGACY_PLANO_MAP: Record<string, string> = {
  BASICO: 'basico',
  PRO: 'pro',
  PREMIUM: 'premium',
};

export const LEGACY_PLANO_REVERSE: Record<string, 'BASICO' | 'PRO' | 'PREMIUM'> = {
  basico: 'BASICO',
  pro: 'PRO',
  premium: 'PREMIUM',
};
