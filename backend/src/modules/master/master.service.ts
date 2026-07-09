import { masterRepository } from './master.repository';
import { AppError } from '../../shared/errors/AppError';
import { comparePassword, hashPassword } from '../../shared/utils/hash.util';
import { signMasterToken } from '../../shared/utils/masterJwt.util';
import { getMasterEmail, isMasterConfigured } from '../../shared/utils/masterConfig';
import {
  MasterLoginInput,
  CriarEmpresaMasterInput,
  AtualizarEmpresaMasterInput,
} from './master.dto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const DEMO_EMPRESA_ID = '1030c59f-503a-4dfc-ad8b-66c802060cd0';

export const masterService = {
  async login(input: MasterLoginInput) {
    if (!isMasterConfigured()) {
      throw new AppError('Acesso master não configurado no servidor', 503);
    }

    const emailNorm = input.email.trim().toLowerCase();
    const masterEmail = getMasterEmail();

    if (emailNorm !== masterEmail) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    const usuario = await masterRepository.findMasterByEmail(emailNorm);

    if (!usuario?.senhaHash) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    const senhaValida = await comparePassword(input.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    const token = signMasterToken({
      usuarioId: usuario.id,
      email: usuario.email,
      role: 'master',
    });

    return {
      token,
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    };
  },

  async me(usuarioId: string) {
    const usuario = await prisma.usuario.findFirst({
      where: { id: usuarioId, isMaster: true, ativo: true },
      select: { id: true, nome: true, email: true },
    });

    if (!usuario) {
      throw new AppError('Usuário master não encontrado', 404);
    }

    return usuario;
  },

  async listarEmpresas() {
    const empresas = await masterRepository.listarEmpresas();

    return empresas.map((empresa) => ({
      id: empresa.id,
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      email: empresa.email,
      telefone: empresa.telefone,
      taxaJurosMes: Number(empresa.taxaJurosMes),
      taxaMulta: Number(empresa.taxaMulta),
      ativo: empresa.ativo,
      criadoEm: empresa.criadoEm,
      admin: empresa.usuarios[0] ?? null,
      totais: empresa._count,
      loginUrl: buildLoginHint(empresa.id),
    }));
  },

  async criarEmpresa(input: CriarEmpresaMasterInput) {
    const cnpj = input.cnpj?.trim() || null;
    const adminEmail = input.adminEmail?.trim().toLowerCase() || '';
    const adminNome = input.adminNome?.trim() || '';
    const adminSenha = input.adminSenha?.trim() || '';
    const temAdmin = !!(adminEmail && adminSenha && adminNome);
    const masterEmail = getMasterEmail();

    if (temAdmin && masterEmail && adminEmail === masterEmail) {
      throw new AppError('Este e-mail é reservado ao master da plataforma', 400);
    }

    if (temAdmin && (await masterRepository.emailAdminJaExiste(adminEmail))) {
      throw new AppError('E-mail do admin já está em uso em outra empresa', 409);
    }

    if (cnpj) {
      const existente = await prisma.empresa.findUnique({ where: { cnpj } });
      if (existente) {
        throw new AppError('CNPJ já cadastrado', 409);
      }
    }

    const empresaEmail =
      input.email?.trim().toLowerCase() ||
      (temAdmin ? adminEmail : `contato-${Date.now()}@syscontabel.local`);

    const senhaHash = temAdmin ? await hashPassword(adminSenha) : undefined;
    const empresa = await masterRepository.criarEmpresaComAdmin(
      {
        nome: input.nome.trim(),
        cnpj,
        email: empresaEmail,
        telefone: input.telefone?.trim() || null,
        taxaJurosMes: input.taxaJurosMes ?? 30,
        taxaMulta: input.taxaMulta ?? 2,
        ativo: true,
      },
      temAdmin && senhaHash
        ? {
            nome: adminNome,
            email: adminEmail,
            senhaHash,
          }
        : undefined
    );

    return {
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        email: empresa.email,
        ativo: empresa.ativo,
      },
      adminEmail: temAdmin ? adminEmail : null,
      empresaId: empresa.id,
      loginUrl: buildLoginHint(empresa.id),
    };
  },

  async atualizarEmpresa(id: string, input: AtualizarEmpresaMasterInput) {
    if (id === DEMO_EMPRESA_ID && input.ativo === false) {
      throw new AppError('A empresa demo não pode ser desativada', 400);
    }

    const existente = await masterRepository.obterEmpresaPorId(id);
    if (!existente) {
      throw new AppError('Empresa não encontrada', 404);
    }

    const empresa = await masterRepository.atualizarEmpresa(id, {
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.telefone !== undefined ? { telefone: input.telefone } : {}),
      ...(input.taxaJurosMes !== undefined ? { taxaJurosMes: input.taxaJurosMes } : {}),
      ...(input.taxaMulta !== undefined ? { taxaMulta: input.taxaMulta } : {}),
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
    });

    return {
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo,
      taxaJurosMes: Number(empresa.taxaJurosMes),
      taxaMulta: Number(empresa.taxaMulta),
    };
  },

  async monitoramento() {
    const stats = await masterRepository.contarPlataforma();
    const mem = process.memoryUsage();

    return {
      api: 'online',
      timestamp: new Date().toISOString(),
      stats,
      memoria: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
    };
  },
};

function buildLoginHint(empresaId: string) {
  const base = (env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/login?empresaId=${empresaId}`;
}

export async function bootstrapMasterUser() {
  if (!isMasterConfigured()) {
    console.log('[Master] MASTER_EMAIL/MASTER_PASSWORD não configurados — bootstrap ignorado.');
    return;
  }

  const masterEmail = getMasterEmail();
  const senhaHash = await hashPassword(env.MASTER_PASSWORD!);

  await prisma.empresa.updateMany({
    where: { nome: 'Plataforma SysJuros' },
    data: { nome: 'Plataforma SysContabel' },
  });

  let empresaPlataforma = await prisma.empresa.findFirst({
    where: { nome: 'Plataforma SysContabel' },
    select: { id: true },
  });

  if (!empresaPlataforma) {
    empresaPlataforma = await prisma.empresa.create({
      data: {
        nome: 'Plataforma SysContabel',
        email: masterEmail,
        ativo: true,
      },
      select: { id: true },
    });
  }

  await prisma.usuario.updateMany({
    where: { isMaster: true, email: { not: masterEmail } },
    data: { isMaster: false },
  });

  await prisma.usuario.upsert({
    where: {
      empresaId_email: {
        empresaId: empresaPlataforma.id,
        email: masterEmail,
      },
    },
    update: {
      nome: 'Master SysContabel',
      senhaHash,
      isMaster: true,
      ativo: true,
      perfil: 'ADMIN',
    },
    create: {
      empresaId: empresaPlataforma.id,
      nome: 'Master SysContabel',
      email: masterEmail,
      senhaHash,
      isMaster: true,
      ativo: true,
      perfil: 'ADMIN',
    },
  });

  console.log('[Master] Usuário master sincronizado:', masterEmail);
}
