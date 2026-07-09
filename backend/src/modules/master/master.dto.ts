import { z } from 'zod';
import { PlanoEmpresa, StatusLancamentoMaster, TipoLancamentoMaster } from '@prisma/client';

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
    plano: z.nativeEnum(PlanoEmpresa).optional(),
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
  plano: z.nativeEnum(PlanoEmpresa).optional(),
});

export const atualizarClienteMasterSchema = z.object({
  nome: z.string().min(2).optional(),
  ativo: z.boolean().optional(),
  plano: z.nativeEnum(PlanoEmpresa).optional(),
});

export const atualizarAssinaturaMasterSchema = z.object({
  plano: z.nativeEnum(PlanoEmpresa).optional(),
  ativo: z.boolean().optional(),
});

export const criarLancamentoMasterSchema = z.object({
  tipo: z.nativeEnum(TipoLancamentoMaster),
  descricao: z.string().min(2),
  valor: z.coerce.number().positive(),
  vencimento: z.string().min(1),
  empresaId: z.string().uuid().optional().nullable(),
});

export const atualizarLancamentoMasterSchema = z.object({
  descricao: z.string().min(2).optional(),
  valor: z.coerce.number().positive().optional(),
  vencimento: z.string().optional(),
  status: z.nativeEnum(StatusLancamentoMaster).optional(),
  empresaId: z.string().uuid().optional().nullable(),
});

export const atualizarPermissaoMasterSchema = z.object({
  perfil: z.string().min(1),
  modulo: z.string().min(1),
  acoes: z.array(z.string()),
});

export const listarClientesMasterQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  tipo: z.enum(['empresa', 'usuario']).optional(),
});

export const listarLogsMasterQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  modulo: z.string().optional(),
});

export type MasterLoginInput = z.infer<typeof masterLoginSchema>;
export type CriarEmpresaMasterInput = z.infer<typeof criarEmpresaMasterSchema>;
export type AtualizarEmpresaMasterInput = z.infer<typeof atualizarEmpresaMasterSchema>;
