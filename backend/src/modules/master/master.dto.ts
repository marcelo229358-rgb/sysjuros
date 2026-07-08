import { z } from 'zod';

export const masterLoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

export const criarEmpresaMasterSchema = z
  .object({
    nome: z.string().min(2, 'Nome da empresa deve ter ao menos 2 caracteres'),
    cnpj: z.string().optional().or(z.literal('')),
    email: z.string().email('E-mail da empresa inválido').optional().or(z.literal('')),
    telefone: z.string().optional().or(z.literal('')),
    taxaJurosMes: z.coerce.number().min(0).max(100).optional(),
    taxaMulta: z.coerce.number().min(0).max(100).optional(),
    adminNome: z.string().optional().or(z.literal('')),
    adminEmail: z.string().email('E-mail do admin inválido').optional().or(z.literal('')),
    adminSenha: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const temAlgumAdmin =
        !!data.adminNome?.trim() || !!data.adminEmail?.trim() || !!data.adminSenha?.trim();
      if (!temAlgumAdmin) return true;
      return !!(
        data.adminNome?.trim() &&
        data.adminEmail?.trim() &&
        data.adminSenha &&
        data.adminSenha.length >= 6
      );
    },
    { message: 'Se informar dados do admin, preencha nome, e-mail e senha (mín. 6 caracteres)' }
  );

export const atualizarEmpresaMasterSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional().nullable(),
  taxaJurosMes: z.coerce.number().min(0).max(100).optional(),
  taxaMulta: z.coerce.number().min(0).max(100).optional(),
  ativo: z.boolean().optional(),
});

export type MasterLoginInput = z.infer<typeof masterLoginSchema>;
export type CriarEmpresaMasterInput = z.infer<typeof criarEmpresaMasterSchema>;
export type AtualizarEmpresaMasterInput = z.infer<typeof atualizarEmpresaMasterSchema>;
