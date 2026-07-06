import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../shared/utils/jwt.util';
import { AppError } from '../shared/errors/AppError';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Token não informado', 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.usuarioId = payload.usuarioId;
    req.empresaId = payload.empresaId;
    req.perfil = payload.perfil;
    next();
  } catch {
    throw new AppError('Token inválido ou expirado', 401);
  }
}
