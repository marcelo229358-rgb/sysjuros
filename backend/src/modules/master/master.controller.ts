import { Request, Response } from 'express';
import { TipoLancamentoMaster } from '@prisma/client';
import { masterService } from './master.service';
import {
  masterLoginSchema,
  criarEmpresaMasterSchema,
  atualizarEmpresaMasterSchema,
  atualizarClienteMasterSchema,
  atualizarAssinaturaMasterSchema,
  criarLancamentoMasterSchema,
  atualizarLancamentoMasterSchema,
  atualizarPermissaoMasterSchema,
  listarClientesMasterQuerySchema,
  listarLogsMasterQuerySchema,
} from './master.dto';
import { AppError } from '../../shared/errors/AppError';
import { parseBody, parseQuery } from '../../shared/utils/zod.util';
import { getRouteParam } from '../../shared/utils/request.util';

export const masterController = {
  async login(req: Request, res: Response) {
    const parsed = masterLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const result = await masterService.login(parsed.data);
    return res.json(result);
  },

  async me(req: Request, res: Response) {
    const user = await masterService.me(req.masterUsuarioId!);
    return res.json(user);
  },

  async listarEmpresas(_req: Request, res: Response) {
    const data = await masterService.listarEmpresas();
    return res.json({ data });
  },

  async criarEmpresa(req: Request, res: Response) {
    const parsed = criarEmpresaMasterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const result = await masterService.criarEmpresa(parsed.data);
    return res.status(201).json(result);
  },

  async atualizarEmpresa(req: Request, res: Response) {
    const parsed = atualizarEmpresaMasterSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message ?? 'Dados inválidos', 400);
    }

    const result = await masterService.atualizarEmpresa(getRouteParam(req, 'id'), parsed.data);
    return res.json(result);
  },

  async excluirEmpresa(req: Request, res: Response) {
    const result = await masterService.excluirEmpresa(
      getRouteParam(req, 'id'),
      req.masterUsuarioId,
      req.ip
    );
    return res.json(result);
  },

  async clientesStats(_req: Request, res: Response) {
    const data = await masterService.clientesStats();
    return res.json(data);
  },

  async listarClientes(req: Request, res: Response) {
    const query = parseQuery(listarClientesMasterQuerySchema, req.query);
    const data = await masterService.listarClientes(
      query.search,
      query.status,
      query.tipo ?? 'empresa'
    );
    return res.json(data);
  },

  async atualizarCliente(req: Request, res: Response) {
    const input = parseBody(atualizarClienteMasterSchema, req.body);
    const data = await masterService.atualizarCliente(
      getRouteParam(req, 'id'),
      input,
      req.masterUsuarioId,
      req.ip
    );
    return res.json(data);
  },

  async listarAssinaturas(_req: Request, res: Response) {
    const data = await masterService.listarAssinaturas();
    return res.json(data);
  },

  async atualizarAssinatura(req: Request, res: Response) {
    const input = parseBody(atualizarAssinaturaMasterSchema, req.body);
    const data = await masterService.atualizarAssinatura(
      getRouteParam(req, 'id'),
      input,
      req.masterUsuarioId,
      req.ip
    );
    return res.json(data);
  },

  async financeiroResumo(_req: Request, res: Response) {
    const data = await masterService.financeiroResumo();
    return res.json(data);
  },

  async listarLancamentos(req: Request, res: Response) {
    const tipo = String(req.query.tipo || 'PAGAR').toUpperCase() as TipoLancamentoMaster;
    const data = await masterService.listarLancamentos(tipo);
    return res.json({ data });
  },

  async criarLancamento(req: Request, res: Response) {
    const input = parseBody(criarLancamentoMasterSchema, req.body);
    const data = await masterService.criarLancamento(input, req.masterUsuarioId, req.ip);
    return res.status(201).json(data);
  },

  async atualizarLancamento(req: Request, res: Response) {
    const input = parseBody(atualizarLancamentoMasterSchema, req.body);
    const data = await masterService.atualizarLancamento(
      getRouteParam(req, 'id'),
      input,
      req.masterUsuarioId,
      req.ip
    );
    return res.json(data);
  },

  async excluirLancamento(req: Request, res: Response) {
    const data = await masterService.excluirLancamento(
      getRouteParam(req, 'id'),
      req.masterUsuarioId,
      req.ip
    );
    return res.json(data);
  },

  async listarPagamentosFinanceiro(req: Request, res: Response) {
    const limit = Number(req.query.limit ?? 30);
    const data = await masterService.listarPagamentosFinanceiro(limit);
    return res.json({ data });
  },

  async permissoesMeta(_req: Request, res: Response) {
    const data = await masterService.permissoesMeta();
    return res.json(data);
  },

  async listarPermissoes(req: Request, res: Response) {
    const data = await masterService.listarPermissoes(getRouteParam(req, 'perfil'));
    return res.json({ data });
  },

  async atualizarPermissao(req: Request, res: Response) {
    const input = parseBody(atualizarPermissaoMasterSchema, req.body);
    const data = await masterService.atualizarPermissao(input, req.masterUsuarioId, req.ip);
    return res.json(data);
  },

  async monitoramento(_req: Request, res: Response) {
    const data = await masterService.monitoramento();
    return res.json(data);
  },

  async listarLogs(req: Request, res: Response) {
    const query = parseQuery(listarLogsMasterQuerySchema, req.query);
    const data = await masterService.listarLogs(query.limit ?? 40, query.modulo);
    return res.json({ data });
  },
};
