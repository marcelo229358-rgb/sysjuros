import { z } from 'zod';
import { StatusParcela } from '@prisma/client';

export const listarParcelasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(StatusParcela).optional(),
  contratoId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  vencimentoInicio: z.coerce.date().optional(),
  vencimentoFim: z.coerce.date().optional(),
});

export const atualizarStatusParcelaSchema = z.object({
  status: z.nativeEnum(StatusParcela),
});

export type ListarParcelasQuery = z.infer<typeof listarParcelasQuerySchema>;
export type AtualizarStatusParcelaDTO = z.infer<typeof atualizarStatusParcelaSchema>;
