import { env } from './env';

export function corsOrigins(): boolean | string[] {
  if (env.FRONTEND_URL) {
    return env.FRONTEND_URL.split(',').map((origin) => origin.trim());
  }
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  throw new Error('FRONTEND_URL não configurado em produção');
}
