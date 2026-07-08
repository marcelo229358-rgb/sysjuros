import { Request, Response, NextFunction } from 'express';
import { verifyMasterToken } from '../shared/utils/masterJwt.util';
import { getMasterEmail } from '../shared/utils/masterConfig';
import { AppError } from '../shared/errors/AppError';

export function masterAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Token master não informado', 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyMasterToken(token);
    const masterEmail = getMasterEmail();

    if (!masterEmail || payload.email !== masterEmail) {
      throw new AppError('Token master inválido', 401);
    }

    req.masterUsuarioId = payload.usuarioId;
    req.masterEmail = payload.email;
    next();
  } catch {
    throw new AppError('Token master inválido ou expirado', 401);
  }
}
