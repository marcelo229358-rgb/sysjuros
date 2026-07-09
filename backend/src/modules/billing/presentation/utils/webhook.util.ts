import { Request } from 'express';
import { AppError } from '../../../../shared/errors/AppError';

export function getWebhookRawBody(req: Request): string {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  if (typeof req.body === 'string') {
    return req.body;
  }
  return JSON.stringify(req.body ?? {});
}

export function parseWebhookJson(rawBody: string): unknown {
  if (!rawBody.trim()) {
    throw new AppError('Corpo do webhook vazio', 400);
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new AppError('JSON do webhook inválido', 400);
  }
}

export function normalizeHeaders(headers: Request['headers']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') out[key.toLowerCase()] = value;
    else if (Array.isArray(value)) out[key.toLowerCase()] = value[0] ?? '';
  }
  return out;
}
