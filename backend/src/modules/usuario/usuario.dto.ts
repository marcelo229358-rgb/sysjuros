import { z } from 'zod';
import { PerfilUsuario } from '@prisma/client';

const perfilSchema = z.nativeEnum(PerfilUsuario);

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  perfil: perfilSchema.default('OPERADOR'),
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  perfil: perfilSchema.optional(),
  ativo: z.boolean().optional(),
});

export const redefinirSenhaUsuarioSchema = z.object({
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export const listarUsuariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  nome: z.string().optional(),
  email: z.string().optional(),
  incluirInativos: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

export type CriarUsuarioDTO = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioDTO = z.infer<typeof atualizarUsuarioSchema>;
export type RedefinirSenhaUsuarioDTO = z.infer<typeof redefinirSenhaUsuarioSchema>;
export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>;
