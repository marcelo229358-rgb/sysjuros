import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { parcelaController } from './parcela.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { auditLogMiddleware } from '../../middlewares/auditLog.middleware';
import { senhaAtualizadaMiddleware } from '../../middlewares/senhaAtualizada.middleware';
import { getRouteParam } from '../../shared/utils/request.util';

export const parcelaRoutes = Router();

parcelaRoutes.use(authMiddleware, tenantMiddleware, senhaAtualizadaMiddleware);

parcelaRoutes.get('/vencidas', (req, res, next) =>
  parcelaController.listarVencidas(req, res).catch(next)
);

parcelaRoutes.get('/a-vencer', (req, res, next) =>
  parcelaController.listarAVencer(req, res).catch(next)
);

parcelaRoutes.get('/', (req, res, next) => parcelaController.listar(req, res).catch(next));

parcelaRoutes.get('/:id', (req, res, next) =>
  parcelaController.obterPorId(req, res).catch(next)
);

parcelaRoutes.patch(
  '/:id/status',
  auditLogMiddleware({
    acao: 'ATUALIZOU_STATUS_PARCELA',
    entidade: 'Parcela',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
    getDetalhes: (req) => req.body as Prisma.InputJsonValue,
  }),
  (req, res, next) => parcelaController.atualizarStatus(req, res).catch(next)
);
