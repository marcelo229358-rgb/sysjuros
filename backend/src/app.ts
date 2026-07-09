import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { corsOrigins } from './config/cors';
import { authRoutes } from './modules/auth/auth.routes';
import { empresaRoutes } from './modules/empresa/empresa.routes';
import { clienteRoutes } from './modules/cliente/cliente.routes';
import { contratoRoutes } from './modules/contrato/contrato.routes';
import { parcelaRoutes } from './modules/parcela/parcela.routes';
import { pagamentoRoutes } from './modules/pagamento/pagamento.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { notificacaoRoutes } from './modules/notificacao/notificacao.routes';
import { pdfRoutes } from './modules/pdf/pdf.routes';
import { masterRoutes } from './modules/master/master.routes';
import { usuarioRoutes } from './modules/usuario/usuario.routes';
import { billingRoutes } from './modules/billing/presentation/routes/billing.routes';
import { errorHandlerMiddleware } from './middlewares/errorHandler.middleware';
import {
  apiRateLimiter,
  authRateLimiter,
  webhookRateLimiter,
} from './middlewares/rateLimit.middleware';
import { AppError } from './shared/errors/AppError';

export const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());

// Corpo bruto para validação HMAC dos webhooks (antes do express.json)
app.use('/billing/webhooks', express.raw({ type: 'application/json', limit: '256kb' }));
app.use('/billing/webhooks', webhookRateLimiter);

app.use(cors({ origin: corsOrigins() }));
app.use(express.json({ limit: '1mb' }));
app.use(apiRateLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRateLimiter, authRoutes);
app.use('/empresa', empresaRoutes);
app.use('/clientes', clienteRoutes);
app.use('/contratos', contratoRoutes);
app.use('/parcelas', parcelaRoutes);
app.use('/pagamentos', pagamentoRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/pdf', pdfRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/master', authRateLimiter, masterRoutes);
app.use('/billing', billingRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

app.use(errorHandlerMiddleware);
