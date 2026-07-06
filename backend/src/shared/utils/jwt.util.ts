import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { PerfilUsuario } from '@prisma/client';

export interface JwtPayload {
  usuarioId: string;
  empresaId: string;
  perfil: PerfilUsuario;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
