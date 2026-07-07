import { z } from 'zod';
import { normalizarCpfCnpj, validarCpfCnpj } from '../../shared/utils/cpfCnpj.util';

const cpfCnpjOpcionalSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((val) => {
    if (!val?.trim()) return undefined;
    return normalizarCpfCnpj(val);
  })
  .refine((val) => val === undefined || validarCpfCnpj(val), 'CPF/CNPJ inválido');

export const criarClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  cpfCnpj: cpfCnpjOpcionalSchema,
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

export const atualizarClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').optional(),
  cpfCnpj: cpfCnpjOpcionalSchema,
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

export const listarClientesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  nome: z.string().optional(),
  cpfCnpj: z.string().optional(),
  incluirInativos: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export type CriarClienteDTO = z.infer<typeof criarClienteSchema>;
export type AtualizarClienteDTO = z.infer<typeof atualizarClienteSchema>;
export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>;
