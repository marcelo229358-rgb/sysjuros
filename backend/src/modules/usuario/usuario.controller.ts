import { Request, Response } from 'express';
import { usuarioService } from './usuario.service';
import {
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  listarUsuariosQuerySchema,
  redefinirSenhaUsuarioSchema,
} from './usuario.dto';
import { parseBody, parseQuery } from '../../shared/utils/zod.util';
import { getRouteParam } from '../../shared/utils/request.util';

export const usuarioController = {
  async criar(req: Request, res: Response) {
    const input = parseBody(criarUsuarioSchema, req.body);
    const usuario = await usuarioService.criar(req.empresaId!, input);
    return res.status(201).json(usuario);
  },

  async listar(req: Request, res: Response) {
    const query = parseQuery(listarUsuariosQuerySchema, req.query);
    const result = await usuarioService.listar(req.empresaId!, query);
    return res.json(result);
  },

  async obterPorId(req: Request, res: Response) {
    const usuario = await usuarioService.obterPorId(getRouteParam(req, 'id'), req.empresaId!);
    return res.json(usuario);
  },

  async atualizar(req: Request, res: Response) {
    const input = parseBody(atualizarUsuarioSchema, req.body);
    const usuario = await usuarioService.atualizar(
      getRouteParam(req, 'id'),
      req.empresaId!,
      req.usuarioId!,
      input
    );
    return res.json(usuario);
  },

  async redefinirSenha(req: Request, res: Response) {
    const input = parseBody(redefinirSenhaUsuarioSchema, req.body);
    const usuario = await usuarioService.redefinirSenha(
      getRouteParam(req, 'id'),
      req.empresaId!,
      req.usuarioId!,
      input
    );
    return res.json(usuario);
  },

  async excluir(req: Request, res: Response) {
    const usuario = await usuarioService.excluir(
      getRouteParam(req, 'id'),
      req.empresaId!,
      req.usuarioId!
    );
    return res.json(usuario);
  },
};
