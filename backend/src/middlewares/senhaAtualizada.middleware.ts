import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../shared/errors/AppError';

export async function senhaAtualizadaMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.usuarioId || !req.empresaId) {
    return next();
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: req.usuarioId, empresaId: req.empresaId, ativo: true },
    select: { deveAlterarSenha: true },
  });

  if (usuario?.deveAlterarSenha) {
    throw new AppError('É necessário alterar a senha antes de continuar', 403);
  }

  next();
}
