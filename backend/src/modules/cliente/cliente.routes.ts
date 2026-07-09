import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { clienteController } from './cliente.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { auditLogMiddleware } from '../../middlewares/auditLog.middleware';
import { senhaAtualizadaMiddleware } from '../../middlewares/senhaAtualizada.middleware';
import { getRouteParam } from '../../shared/utils/request.util';

export const clienteRoutes = Router();

clienteRoutes.use(authMiddleware, tenantMiddleware, senhaAtualizadaMiddleware);

clienteRoutes.post('/', (req, res, next) => clienteController.criar(req, res).catch(next));

clienteRoutes.get('/', (req, res, next) => clienteController.listar(req, res).catch(next));

clienteRoutes.get('/:id', (req, res, next) =>
  clienteController.obterPorId(req, res).catch(next)
);

clienteRoutes.put(
  '/:id',
  auditLogMiddleware({
    acao: 'ATUALIZOU_CLIENTE',
    entidade: 'Cliente',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
    getDetalhes: (req) => req.body as Prisma.InputJsonValue,
  }),
  (req, res, next) => clienteController.atualizar(req, res).catch(next)
);

clienteRoutes.delete(
  '/:id',
  auditLogMiddleware({
    acao: 'EXCLUIU_CLIENTE',
    entidade: 'Cliente',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
  }),
  (req, res, next) => clienteController.excluir(req, res).catch(next)
);
