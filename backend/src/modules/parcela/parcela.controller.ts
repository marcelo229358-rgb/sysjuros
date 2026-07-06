import { Request, Response } from 'express';
import { parcelaService } from './parcela.service';
import { listarParcelasQuerySchema, atualizarStatusParcelaSchema } from './parcela.dto';
import { parseBody, parseQuery } from '../../shared/utils/zod.util';
import { getRouteParam } from '../../shared/utils/request.util';

export const parcelaController = {
  async listar(req: Request, res: Response) {
    const query = parseQuery(listarParcelasQuerySchema, req.query);
    const result = await parcelaService.listar(req.empresaId!, query);
    return res.json(result);
  },

  async listarVencidas(req: Request, res: Response) {
    const parcelas = await parcelaService.listarVencidas(req.empresaId!);
    return res.json(parcelas);
  },

  async listarAVencer(req: Request, res: Response) {
    const parcelas = await parcelaService.listarAVencer(req.empresaId!);
    return res.json(parcelas);
  },

  async obterPorId(req: Request, res: Response) {
    const parcela = await parcelaService.obterPorId(getRouteParam(req, 'id'), req.empresaId!);
    return res.json(parcela);
  },

  async atualizarStatus(req: Request, res: Response) {
    const input = parseBody(atualizarStatusParcelaSchema, req.body);
    const parcela = await parcelaService.atualizarStatus(
      getRouteParam(req, 'id'),
      req.empresaId!,
      input
    );
    return res.json(parcela);
  },
};
