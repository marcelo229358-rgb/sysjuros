import { z } from 'zod';

export const registrarPagamentoSchema = z
  .object({
    parcelaId: z.string().uuid('parcelaId inválido'),
    valorPago: z.number().positive('valorPago deve ser maior que zero'),
    formaPagamento: z.string().min(1, 'formaPagamento é obrigatória'),
    observacoes: z.string().optional(),
    valorAntecipado: z.number().min(0).optional(),
    modoAmortizacao: z.enum(['TOTAL', 'PARCELA_ESPECIFICA']).optional(),
    parcelaAmortizacao: z.number().int().min(1).optional(),
  })
  .refine(
    (data) => {
      if (!data.valorAntecipado || data.valorAntecipado <= 0) return true;
      return !!data.modoAmortizacao;
    },
    { message: 'Informe o modo de amortização', path: ['modoAmortizacao'] }
  )
  .refine(
    (data) => {
      if (!data.valorAntecipado || data.valorAntecipado <= 0) return true;
      if (data.modoAmortizacao !== 'PARCELA_ESPECIFICA') return true;
      return !!data.parcelaAmortizacao;
    },
    { message: 'Informe o número da parcela', path: ['parcelaAmortizacao'] }
  );

export const listarPagamentosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  clienteId: z.string().uuid().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

export type RegistrarPagamentoDTO = z.infer<typeof registrarPagamentoSchema>;
export type ListarPagamentosQuery = z.infer<typeof listarPagamentosQuerySchema>;
