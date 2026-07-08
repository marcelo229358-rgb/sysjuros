import { Request, Response } from 'express';
import { masterService } from './master.service';
import {
  masterLoginSchema,
  criarEmpresaMasterSchema,
  atualizarEmpresaMasterSchema,
} from './master.dto';
import { AppError } from '../../shared/errors/AppError';

export const masterController = {
  async login(req: Request, res: Response) {
    const parsed = masterLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const result = await masterService.login(parsed.data);
    return res.json(result);
  },

  async me(req: Request, res: Response) {
    const user = await masterService.me(req.masterUsuarioId!);
    return res.json(user);
  },

  async listarEmpresas(_req: Request, res: Response) {
    const data = await masterService.listarEmpresas();
    return res.json({ data });
  },

  async criarEmpresa(req: Request, res: Response) {
    const parsed = criarEmpresaMasterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const result = await masterService.criarEmpresa(parsed.data);
    return res.status(201).json(result);
  },

  async atualizarEmpresa(req: Request, res: Response) {
    const parsed = atualizarEmpresaMasterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const result = await masterService.atualizarEmpresa(String(req.params.id), parsed.data);
    return res.json(result);
  },

  async monitoramento(_req: Request, res: Response) {
    const data = await masterService.monitoramento();
    return res.json(data);
  },
};
