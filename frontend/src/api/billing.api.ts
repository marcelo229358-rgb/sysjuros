import axios from 'axios';

const billingApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

billingApi.interceptors.request.use((config) => {
  const isMaster = config.url?.startsWith('/billing/master');
  const token = isMaster
    ? localStorage.getItem('master_token')
    : localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type BillingSecao =
  | 'dashboard'
  | 'products'
  | 'plans'
  | 'subscriptions'
  | 'payments'
  | 'licenses'
  | 'trials'
  | 'coupons'
  | 'webhooks'
  | 'logs';

export const billingMasterApi = {
  dashboard: () => billingApi.get('/billing/master/dashboard').then((r) => r.data),
  products: () => billingApi.get('/billing/master/products').then((r) => r.data),
  plans: (productId?: string) =>
    billingApi.get('/billing/master/plans', { params: { productId } }).then((r) => r.data),
  subscriptions: () => billingApi.get('/billing/master/subscriptions').then((r) => r.data),
  payments: () => billingApi.get('/billing/master/payments').then((r) => r.data),
  licenses: () => billingApi.get('/billing/master/licenses').then((r) => r.data),
  trials: () => billingApi.get('/billing/master/trials').then((r) => r.data),
  coupons: () => billingApi.get('/billing/master/coupons').then((r) => r.data),
  webhooks: () => billingApi.get('/billing/master/webhooks').then((r) => r.data),
  auditLogs: () => billingApi.get('/billing/master/audit-logs').then((r) => r.data),
  changePlan: (id: string, planId: string) =>
    billingApi.patch(`/billing/master/subscriptions/${id}/plan`, { planId }).then((r) => r.data),
  cancelSubscription: (id: string) =>
    billingApi.post(`/billing/master/subscriptions/${id}/cancel`).then((r) => r.data),
};

export const billingTenantApi = {
  subscription: () => billingApi.get('/billing/tenant/subscription').then((r) => r.data),
  plans: () => billingApi.get('/billing/tenant/plans').then((r) => r.data),
  checkout: (planSlug: string, provider = 'KIWIFY') =>
    billingApi.post('/billing/tenant/checkout', { planSlug, provider }).then((r) => r.data),
  cancel: () => billingApi.post('/billing/tenant/cancel').then((r) => r.data),
};

export const billingMasterApiExtended = {
  createSubscription: (tenantId: string, planSlug: string) =>
    billingApi.post('/billing/master/subscriptions', { tenantId, planSlug }).then((r) => r.data),
};
