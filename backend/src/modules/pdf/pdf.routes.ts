import { Router } from 'express';
import { pdfController } from './pdf.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';

export const pdfRoutes = Router();

pdfRoutes.use(authMiddleware, tenantMiddleware);

pdfRoutes.get('/recibo/:pagamentoId', (req, res, next) =>
  pdfController.gerarRecibo(req, res).catch(next)
);

pdfRoutes.get('/extrato/:contratoId', (req, res, next) =>
  pdfController.gerarExtrato(req, res).catch(next)
);
