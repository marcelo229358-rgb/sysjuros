import { prisma } from '../../config/database';

export const usuarioRepository = {
  async findByEmailAndEmpresa(email: string, empresaId: string) {
    return prisma.usuario.findUnique({
      where: {
        empresaId_email: { empresaId, email },
      },
      include: { empresa: true },
    });
  },

  async findByIdAndEmpresa(id: string, empresaId: string) {
    return prisma.usuario.findFirst({
      where: { id, empresaId, ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        empresaId: true,
        ativo: true,
      },
    });
  },
};
