import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

interface AuditOptions {
  acao: string;
  entidade: string;
  getEntidadeId?: (req: Request, res: Response) => string | undefined;
  getDetalhes?: (req: Request, res: Response) => Prisma.InputJsonValue | undefined;
}

export function auditLogMiddleware(options: AuditOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function auditJson(body: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.usuarioId && req.empresaId) {
        const entidadeId =
          options.getEntidadeId?.(req, res) ??
          (typeof body === 'object' && body !== null && 'id' in body
            ? String((body as { id: string }).id)
            : 'unknown');

        void prisma.logAuditoria
          .create({
            data: {
              empresaId: req.empresaId,
              usuarioId: req.usuarioId,
              acao: options.acao,
              entidade: options.entidade,
              entidadeId,
              detalhes: options.getDetalhes?.(req, res) ?? undefined,
            },
          })
          .catch((err) => console.error('[AuditLog]', err));
      }

      return originalJson(body);
    };

    next();
  };
}
