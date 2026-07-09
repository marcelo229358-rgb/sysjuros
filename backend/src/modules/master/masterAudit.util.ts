import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export async function logMasterAudit(
  usuarioId: string | undefined,
  acao: string,
  modulo: string,
  detalhes?: Prisma.InputJsonValue,
  ip?: string
) {
  try {
    await prisma.masterAuditLog.create({
      data: {
        usuarioId: usuarioId ?? null,
        acao,
        modulo,
        detalhes: detalhes ?? undefined,
        ip: ip ?? null,
      },
    });
  } catch (error) {
    console.error('[Master] Audit log:', error);
  }
}
