import { Request, Response, NextFunction } from 'express';
import { PerfilUsuario } from '@prisma/client';
import { AppError } from '../shared/errors/AppError';

export function permissaoMiddleware(...perfisPermitidos: PerfilUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.perfil) {
      throw new AppError('Perfil não encontrado', 403);
    }

    if (!perfisPermitidos.includes(req.perfil)) {
      throw new AppError('Sem permissão para acessar este recurso', 403);
    }

    next();
  };
}
