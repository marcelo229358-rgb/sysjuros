import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
  empresaId: z.string().uuid('empresaId inválido'),
});

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    senhaNova: z.string().min(6, 'Nova senha deve ter ao menos 6 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.senhaNova === data.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;
