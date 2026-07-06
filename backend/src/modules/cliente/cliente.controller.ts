import { Request, Response } from 'express';
import { clienteService } from './cliente.service';
import {
  criarClienteSchema,
  atualizarClienteSchema,
  listarClientesQuerySchema,
} from './cliente.dto';
import { parseBody, parseQuery } from '../../shared/utils/zod.util';
import { getRouteParam } from '../../shared/utils/request.util';

export const clienteController = {
  async criar(req: Request, res: Response) {
    const input = parseBody(criarClienteSchema, req.body);
    const cliente = await clienteService.criar(req.empresaId!, input);
    return res.status(201).json(cliente);
  },

  async listar(req: Request, res: Response) {
    const query = parseQuery(listarClientesQuerySchema, req.query);
    const result = await clienteService.listar(req.empresaId!, query);
    return res.json(result);
  },

  async obterPorId(req: Request, res: Response) {
    const cliente = await clienteService.obterPorId(getRouteParam(req, 'id'), req.empresaId!);
    return res.json(cliente);
  },

  async atualizar(req: Request, res: Response) {
    const input = parseBody(atualizarClienteSchema, req.body);
    const cliente = await clienteService.atualizar(getRouteParam(req, 'id'), req.empresaId!, input);
    return res.json(cliente);
  },

  async excluir(req: Request, res: Response) {
    const cliente = await clienteService.excluir(getRouteParam(req, 'id'), req.empresaId!);
    return res.json(cliente);
  },
};
