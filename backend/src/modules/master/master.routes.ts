import { Router } from 'express';
import { masterController } from './master.controller';
import { masterAuthMiddleware } from '../../middlewares/masterAuth.middleware';

export const masterRoutes = Router();

masterRoutes.post('/auth/signin', (req, res, next) =>
  masterController.login(req, res).catch(next)
);
masterRoutes.get('/auth/me', masterAuthMiddleware, (req, res, next) =>
  masterController.me(req, res).catch(next)
);

const auth = masterAuthMiddleware;

masterRoutes.get('/empresas', auth, (req, res, next) =>
  masterController.listarEmpresas(req, res).catch(next)
);
masterRoutes.post('/empresas', auth, (req, res, next) =>
  masterController.criarEmpresa(req, res).catch(next)
);
masterRoutes.patch('/empresas/:id', auth, (req, res, next) =>
  masterController.atualizarEmpresa(req, res).catch(next)
);
masterRoutes.delete('/empresas/:id', auth, (req, res, next) =>
  masterController.excluirEmpresa(req, res).catch(next)
);

masterRoutes.get('/clientes/stats', auth, (req, res, next) =>
  masterController.clientesStats(req, res).catch(next)
);
masterRoutes.get('/clientes', auth, (req, res, next) =>
  masterController.listarClientes(req, res).catch(next)
);
masterRoutes.patch('/clientes/:id', auth, (req, res, next) =>
  masterController.atualizarCliente(req, res).catch(next)
);

masterRoutes.get('/assinaturas', auth, (req, res, next) =>
  masterController.listarAssinaturas(req, res).catch(next)
);
masterRoutes.patch('/assinaturas/:id', auth, (req, res, next) =>
  masterController.atualizarAssinatura(req, res).catch(next)
);

masterRoutes.get('/financeiro/resumo', auth, (req, res, next) =>
  masterController.financeiroResumo(req, res).catch(next)
);
masterRoutes.get('/financeiro/pagamentos', auth, (req, res, next) =>
  masterController.listarPagamentosFinanceiro(req, res).catch(next)
);
masterRoutes.get('/lancamentos', auth, (req, res, next) =>
  masterController.listarLancamentos(req, res).catch(next)
);
masterRoutes.post('/lancamentos', auth, (req, res, next) =>
  masterController.criarLancamento(req, res).catch(next)
);
masterRoutes.patch('/lancamentos/:id', auth, (req, res, next) =>
  masterController.atualizarLancamento(req, res).catch(next)
);
masterRoutes.delete('/lancamentos/:id', auth, (req, res, next) =>
  masterController.excluirLancamento(req, res).catch(next)
);

masterRoutes.get('/permissions/modules', auth, (req, res, next) =>
  masterController.permissoesMeta(req, res).catch(next)
);
masterRoutes.get('/permissions/:perfil', auth, (req, res, next) =>
  masterController.listarPermissoes(req, res).catch(next)
);
masterRoutes.put('/permissions', auth, (req, res, next) =>
  masterController.atualizarPermissao(req, res).catch(next)
);

masterRoutes.get('/monitoramento', auth, (req, res, next) =>
  masterController.monitoramento(req, res).catch(next)
);
masterRoutes.get('/monitoramento/logs', auth, (req, res, next) =>
  masterController.listarLogs(req, res).catch(next)
);
