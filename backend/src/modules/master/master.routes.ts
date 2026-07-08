import { Router } from 'express';
import { masterController } from './master.controller';
import { masterAuthMiddleware } from '../../middlewares/masterAuth.middleware';

export const masterRoutes = Router();

masterRoutes.post('/auth/signin', (req, res) => masterController.login(req, res));
masterRoutes.get('/auth/me', masterAuthMiddleware, (req, res) => masterController.me(req, res));

masterRoutes.get('/empresas', masterAuthMiddleware, (req, res) =>
  masterController.listarEmpresas(req, res)
);
masterRoutes.post('/empresas', masterAuthMiddleware, (req, res) =>
  masterController.criarEmpresa(req, res)
);
masterRoutes.patch('/empresas/:id', masterAuthMiddleware, (req, res) =>
  masterController.atualizarEmpresa(req, res)
);
masterRoutes.get('/monitoramento', masterAuthMiddleware, (req, res) =>
  masterController.monitoramento(req, res)
);
