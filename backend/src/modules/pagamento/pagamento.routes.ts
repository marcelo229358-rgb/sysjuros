import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { pagamentoController } from './pagamento.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { auditLogMiddleware } from '../../middlewares/auditLog.middleware';
import { senhaAtualizadaMiddleware } from '../../middlewares/senhaAtualizada.middleware';

export const pagamentoRoutes = Router();

pagamentoRoutes.use(authMiddleware, tenantMiddleware, senhaAtualizadaMiddleware);

pagamentoRoutes.post(
  '/',
  auditLogMiddleware({
    acao: 'REGISTROU_PAGAMENTO',
    entidade: 'Pagamento',
    getEntidadeId: (_req, res) => {
      const body = res.locals.auditBody as { id?: string } | undefined;
      return body?.id;
    },
    getDetalhes: (req) => req.body as Prisma.InputJsonValue,
  }),
  async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function captureBody(body: unknown) {
      res.locals.auditBody = body;
      return originalJson(body);
    };
    try {
      await pagamentoController.registrar(req, res);
    } catch (error) {
      next(error);
    }
  }
);

pagamentoRoutes.get('/', (req, res, next) => pagamentoController.listar(req, res).catch(next));

pagamentoRoutes.get('/:id', (req, res, next) =>
  pagamentoController.obterPorId(req, res).catch(next)
);
