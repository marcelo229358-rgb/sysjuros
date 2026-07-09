import { Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema, alterarSenhaSchema } from './auth.dto';
import { AppError } from '../../shared/errors/AppError';
import { parseBody } from '../../shared/utils/zod.util';

export const authController = {
  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const result = await authService.login(parsed.data);
    return res.json(result);
  },

  async me(req: Request, res: Response) {
    const usuario = await authService.me(req.usuarioId!, req.empresaId!);
    return res.json(usuario);
  },

  async alterarSenha(req: Request, res: Response) {
    const input = parseBody(alterarSenhaSchema, req.body);
    const usuario = await authService.alterarSenha(req.usuarioId!, req.empresaId!, input);
    return res.json(usuario);
  },
};
