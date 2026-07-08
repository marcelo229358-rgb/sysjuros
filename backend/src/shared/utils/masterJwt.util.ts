import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface MasterJwtPayload {
  usuarioId: string;
  email: string;
  role: 'master';
}

export function signMasterToken(payload: MasterJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyMasterToken(token: string): MasterJwtPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as MasterJwtPayload;
  if (payload.role !== 'master') {
    throw new Error('Token não é de master');
  }
  return payload;
}
