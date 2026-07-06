import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';

export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.empresaId) {
    throw new AppError('Contexto de empresa não encontrado', 403);
  }

  next();
}
