import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware, tenantMiddleware);

dashboardRoutes.get('/resumo', (req, res, next) =>
  dashboardController.resumo(req, res).catch(next)
);

dashboardRoutes.get('/recebimentos-mensais', (req, res, next) =>
  dashboardController.recebimentosMensais(req, res).catch(next)
);

dashboardRoutes.get('/contratos-por-status', (req, res, next) =>
  dashboardController.contratosPorStatus(req, res).catch(next)
);

dashboardRoutes.get('/proximos-vencimentos', (req, res, next) =>
  dashboardController.proximosVencimentos(req, res).catch(next)
);

dashboardRoutes.get('/inadimplencia', (req, res, next) =>
  dashboardController.inadimplencia(req, res).catch(next)
);
