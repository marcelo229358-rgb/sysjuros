import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function parseBody<T>(schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: ZodError } }, body: unknown): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
  }

  return parsed.data;
}

export function parseQuery<T>(schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: ZodError } }, query: unknown): T {
  const parsed = schema.safeParse(query);

  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0]?.message ?? 'Parâmetros inválidos', 400);
  }

  return parsed.data;
}
