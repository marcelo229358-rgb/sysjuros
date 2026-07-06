import { z } from 'zod';
import { StatusContrato } from '@prisma/client';

export const criarContratoSchema = z.object({
  clienteId: z.string().uuid('clienteId inválido'),
  numero: z.string().min(1, 'Número do contrato é obrigatório'),
  valorTotal: z.number().positive('valorTotal deve ser maior que zero'),
  numParcelas: z.number().int().min(1, 'numParcelas deve ser ao menos 1'),
  dataInicio: z.coerce.date({ invalid_type_error: 'dataInicio inválida' }),
  observacoes: z.string().optional(),
});

export const atualizarContratoSchema = z
  .object({
    numero: z.string().min(1).optional(),
    observacoes: z.string().optional(),
    valorTotal: z.number().optional(),
    numParcelas: z.number().optional(),
  })
  .refine((data) => data.valorTotal === undefined && data.numParcelas === undefined, {
    message: 'valorTotal e numParcelas não podem ser alterados após a criação',
    path: ['valorTotal'],
  });

export const atualizarStatusContratoSchema = z.object({
  status: z.nativeEnum(StatusContrato),
});

export const listarContratosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(StatusContrato).optional(),
  clienteId: z.string().uuid().optional(),
});

export type CriarContratoDTO = z.infer<typeof criarContratoSchema>;
export type AtualizarContratoDTO = z.infer<typeof atualizarContratoSchema>;
export type AtualizarStatusContratoDTO = z.infer<typeof atualizarStatusContratoSchema>;
export type ListarContratosQuery = z.infer<typeof listarContratosQuerySchema>;
