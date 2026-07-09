import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { proximosVencimentosQuerySchema, inadimplenciaQuerySchema } from './dashboard.dto';
import { parseQuery } from '../../shared/utils/zod.util';

export const dashboardController = {
  async resumo(req: Request, res: Response) {
    const dados = await dashboardService.gerarResumo(req.empresaId!);
    return res.json(dados);
  },

  async recebimentosMensais(req: Request, res: Response) {
    const dados = await dashboardService.recebimentosMensais(req.empresaId!);
    return res.json(dados);
  },

  async contratosPorStatus(req: Request, res: Response) {
    const dados = await dashboardService.contratosPorStatus(req.empresaId!);
    return res.json(dados);
  },

  async proximosVencimentos(req: Request, res: Response) {
    const query = parseQuery(proximosVencimentosQuerySchema, req.query);
    const dados = await dashboardService.proximosVencimentos(req.empresaId!, query.dias);
    return res.json(dados);
  },

  async inadimplencia(req: Request, res: Response) {
    const query = parseQuery(inadimplenciaQuerySchema, req.query);
    const dados = await dashboardService.inadimplencia(req.empresaId!, query.limite);
    return res.json(dados);
  },

  async saudePagadores(req: Request, res: Response) {
    const dados = await dashboardService.saudePagadores(req.empresaId!);
    return res.json(dados);
  },
};
