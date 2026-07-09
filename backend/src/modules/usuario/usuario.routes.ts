import { Router } from 'express';
import { PerfilUsuario, Prisma } from '@prisma/client';
import { usuarioController } from './usuario.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { permissaoMiddleware } from '../../middlewares/permissao.middleware';
import { senhaAtualizadaMiddleware } from '../../middlewares/senhaAtualizada.middleware';
import { auditLogMiddleware } from '../../middlewares/auditLog.middleware';
import { getRouteParam } from '../../shared/utils/request.util';

export const usuarioRoutes = Router();

usuarioRoutes.use(
  authMiddleware,
  tenantMiddleware,
  senhaAtualizadaMiddleware,
  permissaoMiddleware(PerfilUsuario.ADMIN)
);

usuarioRoutes.post('/', (req, res, next) => usuarioController.criar(req, res).catch(next));

usuarioRoutes.get('/', (req, res, next) => usuarioController.listar(req, res).catch(next));

usuarioRoutes.get('/:id', (req, res, next) =>
  usuarioController.obterPorId(req, res).catch(next)
);

usuarioRoutes.put(
  '/:id',
  auditLogMiddleware({
    acao: 'ATUALIZOU_USUARIO',
    entidade: 'Usuario',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
    getDetalhes: (req) => req.body as Prisma.InputJsonValue,
  }),
  (req, res, next) => usuarioController.atualizar(req, res).catch(next)
);

usuarioRoutes.put(
  '/:id/redefinir-senha',
  auditLogMiddleware({
    acao: 'REDEFINIU_SENHA_USUARIO',
    entidade: 'Usuario',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
  }),
  (req, res, next) => usuarioController.redefinirSenha(req, res).catch(next)
);

usuarioRoutes.delete(
  '/:id',
  auditLogMiddleware({
    acao: 'INATIVOU_USUARIO',
    entidade: 'Usuario',
    getEntidadeId: (req) => getRouteParam(req, 'id'),
  }),
  (req, res, next) => usuarioController.excluir(req, res).catch(next)
);
