import { Request, Response } from 'express';
import { PerfilUsuario } from '@prisma/client';
import { notificacaoService, enviarCobrancaSchema } from './notificacao.service';
import { parseBody } from '../../shared/utils/zod.util';
import { getRouteParam } from '../../shared/utils/request.util';

export const notificacaoController = {
  async enviarCobrancaWhatsapp(req: Request, res: Response) {
    const { parcelaId } = parseBody(enviarCobrancaSchema, req.body);
    const result = await notificacaoService.enviarCobrancaWhatsapp(
      parcelaId,
      req.empresaId!,
      req.usuarioId!
    );
    return res.json(result);
  },

  async listar(req: Request, res: Response) {
    const notificacoes = await notificacaoService.listar(req.empresaId!, req.usuarioId!);
    return res.json(notificacoes);
  },

  async marcarTodasComoLidas(req: Request, res: Response) {
    const result = await notificacaoService.marcarTodasComoLidas(
      req.empresaId!,
      req.usuarioId!
    );
    return res.json(result);
  },

  async marcarComoLida(req: Request, res: Response) {
    const notificacao = await notificacaoService.marcarComoLida(
      getRouteParam(req, 'id'),
      req.empresaId!,
      req.usuarioId!
    );
    return res.json(notificacao);
  },
};

export const perfisWhatsapp = [PerfilUsuario.ADMIN, PerfilUsuario.FINANCEIRO] as const;
