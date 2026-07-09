import { usuarioRepository } from './usuario.repository';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginacaoMeta } from '../../shared/utils/pagination.util';
import { hashPassword } from '../../shared/utils/hash.util';
import {
  CriarUsuarioDTO,
  AtualizarUsuarioDTO,
  ListarUsuariosQuery,
  RedefinirSenhaUsuarioDTO,
} from './usuario.dto';

export const usuarioService = {
  async criar(empresaId: string, input: CriarUsuarioDTO) {
    const email = input.email.trim().toLowerCase();
    const existente = await usuarioRepository.findByEmailInEmpresa(email, empresaId);

    if (existente) {
      throw new AppError('E-mail já cadastrado nesta empresa', 409);
    }

    const senhaHash = await hashPassword(input.senha);

    return usuarioRepository.criar(empresaId, {
      nome: input.nome,
      email,
      senhaHash,
      perfil: input.perfil,
      deveAlterarSenha: true,
    });
  },

  async listar(empresaId: string, query: ListarUsuariosQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { data, total } = await usuarioRepository.listar(empresaId, {
      skip,
      take: limit,
      nome: query.nome,
      email: query.email,
      incluirInativos: query.incluirInativos,
    });

    return {
      data,
      meta: buildPaginacaoMeta(total, page, limit),
    };
  },

  async obterPorId(id: string, empresaId: string) {
    const usuario = await usuarioRepository.findByIdIncluindoInativo(id, empresaId);

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return usuario;
  },

  async atualizar(id: string, empresaId: string, usuarioLogadoId: string, input: AtualizarUsuarioDTO) {
    const usuario = await usuarioRepository.findByIdIncluindoInativo(id, empresaId);

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (input.email) {
      const email = input.email.trim().toLowerCase();
      const existente = await usuarioRepository.findByEmailInEmpresa(email, empresaId, id);

      if (existente) {
        throw new AppError('E-mail já cadastrado nesta empresa', 409);
      }
    }

    if (input.ativo === false && id === usuarioLogadoId) {
      throw new AppError('Você não pode inativar seu próprio usuário', 400);
    }

    if (input.perfil && input.perfil !== 'ADMIN' && usuario.perfil === 'ADMIN') {
      const outrosAdmins = await usuarioRepository.contarAdminsAtivos(empresaId, id);
      if (outrosAdmins === 0) {
        throw new AppError('A empresa precisa ter ao menos um administrador ativo', 400);
      }
    }

    if (input.ativo === false && usuario.perfil === 'ADMIN') {
      const outrosAdmins = await usuarioRepository.contarAdminsAtivos(empresaId, id);
      if (outrosAdmins === 0) {
        throw new AppError('Não é possível inativar o único administrador da empresa', 400);
      }
    }

    const atualizado = await usuarioRepository.atualizar(id, empresaId, {
      ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.perfil !== undefined ? { perfil: input.perfil } : {}),
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
    });

    if (!atualizado) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return atualizado;
  },

  async redefinirSenha(
    id: string,
    empresaId: string,
    usuarioLogadoId: string,
    input: RedefinirSenhaUsuarioDTO
  ) {
    const usuario = await usuarioRepository.findByIdIncluindoInativo(id, empresaId);

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (id === usuarioLogadoId) {
      throw new AppError('Use a tela de alterar senha para mudar sua própria senha', 400);
    }

    const senhaHash = await hashPassword(input.senha);

    const atualizado = await usuarioRepository.atualizarSenha(id, empresaId, senhaHash, true);

    if (!atualizado) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return atualizado;
  },

  async excluir(id: string, empresaId: string, usuarioLogadoId: string) {
    const usuario = await usuarioRepository.findByIdIncluindoInativo(id, empresaId);

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (!usuario.ativo) {
      throw new AppError('Usuário já está inativo', 400);
    }

    if (id === usuarioLogadoId) {
      throw new AppError('Você não pode inativar seu próprio usuário', 400);
    }

    if (usuario.perfil === 'ADMIN') {
      const outrosAdmins = await usuarioRepository.contarAdminsAtivos(empresaId, id);
      if (outrosAdmins === 0) {
        throw new AppError('Não é possível inativar o único administrador da empresa', 400);
      }
    }

    const result = await usuarioRepository.atualizar(id, empresaId, { ativo: false });

    if (!result) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return result;
  },
};
