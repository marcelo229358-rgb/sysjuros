import { Router } from 'express';
import { PerfilUsuario } from '@prisma/client';
import { notificacaoController, perfisWhatsapp } from './notificacao.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { permissaoMiddleware } from '../../middlewares/permissao.middleware';
import { auditLogMiddleware } from '../../middlewares/auditLog.middleware';
import { senhaAtualizadaMiddleware } from '../../middlewares/senhaAtualizada.middleware';

export const notificacaoRoutes = Router();

notificacaoRoutes.use(authMiddleware, tenantMiddleware, senhaAtualizadaMiddleware);

notificacaoRoutes.get('/', (req, res, next) =>
  notificacaoController.listar(req, res).catch(next)
);

notificacaoRoutes.patch('/ler', (req, res, next) =>
  notificacaoController.marcarTodasComoLidas(req, res).catch(next)
);

notificacaoRoutes.patch('/:id/ler', (req, res, next) =>
  notificacaoController.marcarComoLida(req, res).catch(next)
);

notificacaoRoutes.get(
  '/whatsapp/status',
  permissaoMiddleware(...perfisWhatsapp),
  (req, res, next) => notificacaoController.statusWhatsapp(req, res).catch(next)
);

notificacaoRoutes.post(
  '/lembretes/executar',
  permissaoMiddleware(PerfilUsuario.ADMIN),
  (req, res, next) => notificacaoController.executarLembretes(req, res).catch(next)
);

notificacaoRoutes.post(
  '/whatsapp/cobranca',
  permissaoMiddleware(...perfisWhatsapp),
  auditLogMiddleware({
    acao: 'ENVIOU_COBRANCA_WHATSAPP',
    entidade: 'Parcela',
    getEntidadeId: (req) => (req.body as { parcelaId?: string })?.parcelaId,
  }),
  (req, res, next) => notificacaoController.enviarCobrancaWhatsapp(req, res).catch(next)
);
