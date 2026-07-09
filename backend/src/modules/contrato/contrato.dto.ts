import { z } from 'zod';
import { StatusContrato } from '@prisma/client';

export const parcelaCustomizadaSchema = z.object({
  numero: z.number().int().min(1),
  valorOriginal: z.number().positive(),
  dataVencimento: z.coerce.date(),
});

export const criarContratoSchema = z
  .object({
    clienteId: z.string().uuid('clienteId inválido'),
    numero: z.string().min(1, 'Número do contrato é obrigatório'),
    valorTotal: z.number().positive('valorTotal deve ser maior que zero'),
    numParcelas: z.number().int().min(1, 'numParcelas deve ser ao menos 1'),
    dataInicio: z.coerce.date({ invalid_type_error: 'dataInicio inválida' }),
    taxaJurosMes: z.number().min(0).optional(),
    taxaMulta: z.number().min(0).optional(),
    observacoes: z.string().optional(),
    parcelas: z.array(parcelaCustomizadaSchema).optional(),
    valorAntecipado: z.number().min(0).optional(),
    modoAmortizacao: z.enum(['TOTAL', 'PARCELA_ESPECIFICA']).optional(),
    parcelaAmortizacao: z.number().int().min(1).optional(),
  })
  .refine(
    (data) => {
      if (!data.valorAntecipado || data.valorAntecipado <= 0) return true;
      return !!data.modoAmortizacao;
    },
    { message: 'Informe o modo de amortização ao antecipar valor', path: ['modoAmortizacao'] }
  )
  .refine(
    (data) => {
      if (!data.valorAntecipado || data.valorAntecipado <= 0) return true;
      if (data.modoAmortizacao !== 'PARCELA_ESPECIFICA') return true;
      return !!data.parcelaAmortizacao;
    },
    { message: 'Informe o número da parcela para amortização', path: ['parcelaAmortizacao'] }
  )
  .refine((data) => !data.valorAntecipado || data.valorAntecipado < data.valorTotal, {
    message: 'Valor antecipado deve ser menor que o valor total',
    path: ['valorAntecipado'],
  });

export const amortizarContratoSchema = z
  .object({
    valor: z.number().positive('Valor de amortização deve ser maior que zero'),
    modo: z.enum(['TOTAL', 'PARCELA_ESPECIFICA']),
    parcelaAmortizacao: z.number().int().min(1).optional(),
  })
  .refine(
    (data) => data.modo !== 'PARCELA_ESPECIFICA' || !!data.parcelaAmortizacao,
    { message: 'Informe o número da parcela', path: ['parcelaAmortizacao'] }
  );

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
export type AmortizarContratoDTO = z.infer<typeof amortizarContratoSchema>;
export type AtualizarContratoDTO = z.infer<typeof atualizarContratoSchema>;
export type AtualizarStatusContratoDTO = z.infer<typeof atualizarStatusContratoSchema>;
export type ListarContratosQuery = z.infer<typeof listarContratosQuerySchema>;
