import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';

export const authRoutes = Router();

authRoutes.post('/login', (req, res) => authController.login(req, res));

authRoutes.get('/me', authMiddleware, tenantMiddleware, (req, res, next) =>
  authController.me(req, res).catch(next)
);

authRoutes.post('/alterar-senha', authMiddleware, tenantMiddleware, (req, res, next) =>
  authController.alterarSenha(req, res).catch(next)
);
