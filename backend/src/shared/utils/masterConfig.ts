import { env } from '../../config/env';

export function getMasterEmail(): string {
  return (env.MASTER_EMAIL ?? '').trim().toLowerCase();
}

export function isMasterConfigured(): boolean {
  return !!(getMasterEmail() && env.MASTER_PASSWORD && env.MASTER_PASSWORD.length >= 8);
}
