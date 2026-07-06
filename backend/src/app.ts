import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { empresaRoutes } from './modules/empresa/empresa.routes';
import { clienteRoutes } from './modules/cliente/cliente.routes';
import { contratoRoutes } from './modules/contrato/contrato.routes';
import { parcelaRoutes } from './modules/parcela/parcela.routes';
import { pagamentoRoutes } from './modules/pagamento/pagamento.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { notificacaoRoutes } from './modules/notificacao/notificacao.routes';
import { pdfRoutes } from './modules/pdf/pdf.routes';
import { errorHandlerMiddleware } from './middlewares/errorHandler.middleware';
import { AppError } from './shared/errors/AppError';

function corsOrigins(): boolean | string[] {
  if (env.FRONTEND_URL) {
    return env.FRONTEND_URL.split(',').map((origin) => origin.trim());
  }
  if (env.NODE_ENV === 'development') {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  return true;
}

export const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: corsOrigins() }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/empresa', empresaRoutes);
app.use('/clientes', clienteRoutes);
app.use('/contratos', contratoRoutes);
app.use('/parcelas', parcelaRoutes);
app.use('/pagamentos', pagamentoRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/pdf', pdfRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Rota não encontrada', 404));
});

app.use(errorHandlerMiddleware);
