import { z } from 'zod';

export const registrarPagamentoSchema = z.object({
  parcelaId: z.string().uuid('parcelaId inválido'),
  valorPago: z.number().positive('valorPago deve ser maior que zero'),
  formaPagamento: z.string().min(1, 'formaPagamento é obrigatória'),
  observacoes: z.string().optional(),
});

export const listarPagamentosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  clienteId: z.string().uuid().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

export type RegistrarPagamentoDTO = z.infer<typeof registrarPagamentoSchema>;
export type ListarPagamentosQuery = z.infer<typeof listarPagamentosQuerySchema>;
