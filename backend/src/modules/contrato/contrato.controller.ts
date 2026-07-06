import { Request, Response } from 'express';
import { contratoService } from './contrato.service';
import {
  criarContratoSchema,
  atualizarContratoSchema,
  atualizarStatusContratoSchema,
  listarContratosQuerySchema,
} from './contrato.dto';
import { parseBody, parseQuery } from '../../shared/utils/zod.util';
import { getRouteParam } from '../../shared/utils/request.util';

export const contratoController = {
  async criar(req: Request, res: Response) {
    const input = parseBody(criarContratoSchema, req.body);
    const contrato = await contratoService.criar(req.empresaId!, input);
    return res.status(201).json(contrato);
  },

  async listar(req: Request, res: Response) {
    const query = parseQuery(listarContratosQuerySchema, req.query);
    const result = await contratoService.listar(req.empresaId!, query);
    return res.json(result);
  },

  async obterPorId(req: Request, res: Response) {
    const contrato = await contratoService.obterPorId(getRouteParam(req, 'id'), req.empresaId!);
    return res.json(contrato);
  },

  async atualizar(req: Request, res: Response) {
    const input = parseBody(atualizarContratoSchema, req.body);
    const contrato = await contratoService.atualizar(getRouteParam(req, 'id'), req.empresaId!, input);
    return res.json(contrato);
  },

  async atualizarStatus(req: Request, res: Response) {
    const input = parseBody(atualizarStatusContratoSchema, req.body);
    const contrato = await contratoService.atualizarStatus(
      getRouteParam(req, 'id'),
      req.empresaId!,
      input
    );
    return res.json(contrato);
  },
};
