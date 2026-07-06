import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export const notificacaoRepository = {
  async listarNaoLidas(empresaId: string, usuarioId: string) {
    return prisma.notificacao.findMany({
      where: {
        empresaId,
        lida: false,
        OR: [{ usuarioId: null }, { usuarioId }],
      },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
  },

  async marcarTodasComoLidas(empresaId: string, usuarioId: string) {
    return prisma.notificacao.updateMany({
      where: {
        empresaId,
        lida: false,
        OR: [{ usuarioId: null }, { usuarioId }],
      },
      data: { lida: true },
    });
  },

  async marcarComoLida(id: string, empresaId: string, usuarioId: string) {
    const notificacao = await prisma.notificacao.findFirst({
      where: {
        id,
        empresaId,
        OR: [{ usuarioId: null }, { usuarioId }],
      },
    });

    if (!notificacao) return null;

    return prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  },

  async criar(data: Prisma.NotificacaoCreateInput) {
    return prisma.notificacao.create({ data });
  },
};
