import { Request, Response } from 'express';
import { pagamentoService } from './pagamento.service';
import { registrarPagamentoSchema, listarPagamentosQuerySchema } from './pagamento.dto';
import { parseBody, parseQuery } from '../../shared/utils/zod.util';
import { getRouteParam } from '../../shared/utils/request.util';

export const pagamentoController = {
  async registrar(req: Request, res: Response) {
    const input = parseBody(registrarPagamentoSchema, req.body);
    const pagamento = await pagamentoService.registrar(req.empresaId!, input);
    return res.status(201).json(pagamento);
  },

  async listar(req: Request, res: Response) {
    const query = parseQuery(listarPagamentosQuerySchema, req.query);
    const result = await pagamentoService.listar(req.empresaId!, query);
    return res.json(result);
  },

  async obterPorId(req: Request, res: Response) {
    const pagamento = await pagamentoService.obterPorId(getRouteParam(req, 'id'), req.empresaId!);
    return res.json(pagamento);
  },
};
