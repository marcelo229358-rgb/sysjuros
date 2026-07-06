import { Request } from 'express';
import { AppError } from '../errors/AppError';

export function getRouteParam(req: Request, param: string): string {
  const value = req.params[param];

  if (typeof value !== 'string' || !value) {
    throw new AppError(`Parâmetro ${param} inválido`, 400);
  }

  return value;
}
