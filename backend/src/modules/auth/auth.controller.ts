import { Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema } from './auth.dto';
import { AppError } from '../../shared/errors/AppError';

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
};
