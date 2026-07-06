import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export const empresaRepository = {
  async findById(empresaId: string) {
    return prisma.empresa.findUnique({
      where: { id: empresaId },
    });
  },

  async updateTaxas(
    empresaId: string,
    taxas: { taxaJurosMes: number; taxaMulta: number }
  ) {
    return prisma.empresa.update({
      where: { id: empresaId },
      data: {
        taxaJurosMes: new Decimal(taxas.taxaJurosMes),
        taxaMulta: new Decimal(taxas.taxaMulta),
      },
      select: {
        id: true,
        nome: true,
        taxaJurosMes: true,
        taxaMulta: true,
        modoEscuro: true,
        atualizadoEm: true,
      },
    });
  },
};
