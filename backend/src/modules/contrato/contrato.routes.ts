import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { contratoController } from './contrato.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { auditLogMiddleware } from '../../middlewares/auditLog.middleware';
import { senhaAtualizadaMiddleware } from '../../middlewares/senhaAtualizada.middleware';
import { getRouteParam } from '../../shared/utils/request.util';

export const contratoRoutes = Router();

contratoRoutes.use(authMiddleware, tenantMiddleware, senhaAtualizadaMiddleware);

contratoRoutes.post(
  '/',
  auditLogMiddleware({
    acao: 'CRIOU_CONTRATO',
    entidade: 'Contrato',
    getEntidadeId: (_req, res) => {
      const body = res.locals.auditBody as { id?: string } | undefined;
      return body?.id;
    },
  }),
  async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function captureBody(body: unknown) {
      res.locals.auditBody = body;
      return originalJson(body);
    };
    try {
      await contratoController.criar(req, res);
    } catch (error) {
      next(error);
    }
  }
);

contratoRoutes.get('/', (req, res, next) => contratoController.listar(req, res).catch(next));

contratoRoutes.get('/:id', (req, res, next) =>
  contratoController.obterPorId(req, res).catch(next)
);

contratoRoutes.put(
  '/:id',
  auditLogMiddleware({
    acao: 'ATUALIZOU_CONTRATO',
    entidade: 'Contrato',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
    getDetalhes: (req) => req.body as Prisma.InputJsonValue,
  }),
  (req, res, next) => contratoController.atualizar(req, res).catch(next)
);

contratoRoutes.patch(
  '/:id/status',
  auditLogMiddleware({
    acao: 'ATUALIZOU_STATUS_CONTRATO',
    entidade: 'Contrato',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
    getDetalhes: (req) => req.body as Prisma.InputJsonValue,
  }),
  (req, res, next) => contratoController.atualizarStatus(req, res).catch(next)
);
