import { Request, Response } from 'express';
import { empresaService } from './empresa.service';
import { atualizarConfiguracoesSchema } from './empresa.service';
import { AppError } from '../../shared/errors/AppError';

export const empresaController = {
  async obterConfiguracoes(req: Request, res: Response) {
    const empresa = await empresaService.obterConfiguracoes(req.empresaId!);
    return res.json(empresa);
  },

  async atualizarConfiguracoes(req: Request, res: Response) {
    const parsed = atualizarConfiguracoesSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const empresa = await empresaService.atualizarTaxas(req.empresaId!, parsed.data);
    return res.json({
      ...empresa,
      taxaJurosMes: Number(empresa.taxaJurosMes),
      taxaMulta: Number(empresa.taxaMulta),
    });
  },
};
