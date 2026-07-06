import { Router } from 'express';
import { PerfilUsuario, Prisma } from '@prisma/client';
import { empresaController } from './empresa.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { permissaoMiddleware } from '../../middlewares/permissao.middleware';
import { auditLogMiddleware } from '../../middlewares/auditLog.middleware';

export const empresaRoutes = Router();

empresaRoutes.use(authMiddleware, tenantMiddleware);

empresaRoutes.get('/configuracoes', (req, res) =>
  empresaController.obterConfiguracoes(req, res)
);

empresaRoutes.put(
  '/configuracoes',
  permissaoMiddleware(PerfilUsuario.ADMIN),
  auditLogMiddleware({
    acao: 'ATUALIZOU_CONFIGURACOES',
    entidade: 'Empresa',
    getEntidadeId: (req) => req.empresaId,
    getDetalhes: (req) => req.body as Prisma.InputJsonValue,
  }),
  (req, res) => empresaController.atualizarConfiguracoes(req, res)
);
