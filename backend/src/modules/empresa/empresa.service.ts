import { z } from 'zod';
import { empresaRepository } from './empresa.repository';
import { AppError } from '../../shared/errors/AppError';

const taxaSchema = z
  .number()
  .min(0, 'Taxa deve ser no mínimo 0')
  .max(100, 'Taxa deve ser no máximo 100')
  .refine((val) => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, 'Taxa deve ter no máximo 2 casas decimais');

export const atualizarConfiguracoesSchema = z.object({
  taxaJurosMes: taxaSchema,
  taxaMulta: taxaSchema,
});

export type AtualizarConfiguracoesInput = z.infer<typeof atualizarConfiguracoesSchema>;

export const empresaService = {
  async atualizarTaxas(empresaId: string, input: AtualizarConfiguracoesInput) {
    const empresa = await empresaRepository.findById(empresaId);

    if (!empresa) {
      throw new AppError('Empresa não encontrada', 404);
    }

    return empresaRepository.updateTaxas(empresaId, input);
  },

  async obterConfiguracoes(empresaId: string) {
    const empresa = await empresaRepository.findById(empresaId);

    if (!empresa) {
      throw new AppError('Empresa não encontrada', 404);
    }

    return {
      id: empresa.id,
      nome: empresa.nome,
      taxaJurosMes: Number(empresa.taxaJurosMes),
      taxaMulta: Number(empresa.taxaMulta),
      modoEscuro: empresa.modoEscuro,
    };
  },
};
