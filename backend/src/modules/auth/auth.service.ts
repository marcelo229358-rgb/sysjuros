import { usuarioRepository } from '../usuario/usuario.repository';
import { comparePassword, hashPassword } from '../../shared/utils/hash.util';
import { signToken } from '../../shared/utils/jwt.util';
import { AppError } from '../../shared/errors/AppError';
import { AlterarSenhaInput, LoginInput } from './auth.dto';

export const authService = {
  async login(input: LoginInput) {
    let usuario;

    if (input.empresaId) {
      usuario = await usuarioRepository.findByEmailAndEmpresa(input.email, input.empresaId);
    } else {
      const candidatos = await usuarioRepository.findActiveByEmail(input.email);

      if (candidatos.length === 0) {
        throw new AppError('Credenciais inválidas', 401);
      }

      if (candidatos.length > 1) {
        throw new AppError('Informe o ID da empresa para continuar', 400);
      }

      usuario = candidatos[0];
    }

    if (!usuario || !usuario.ativo || usuario.isMaster) {
      throw new AppError('Credenciais inválidas', 401);
    }

    if (!usuario.empresa.ativo) {
      throw new AppError('Empresa desativada. Contate o suporte.', 403);
    }

    const senhaValida = await comparePassword(input.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const token = signToken({
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      perfil: usuario.perfil,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        empresaId: usuario.empresaId,
        deveAlterarSenha: usuario.deveAlterarSenha,
      },
      empresa: {
        id: usuario.empresa.id,
        nome: usuario.empresa.nome,
        taxaJurosMes: Number(usuario.empresa.taxaJurosMes),
        taxaMulta: Number(usuario.empresa.taxaMulta),
      },
    };
  },

  async me(usuarioId: string, empresaId: string) {
    const usuario = await usuarioRepository.findByIdAndEmpresa(usuarioId, empresaId);

    if (!usuario) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return usuario;
  },

  async alterarSenha(usuarioId: string, empresaId: string, input: AlterarSenhaInput) {
    const registro = await usuarioRepository.findAuthByIdAndEmpresa(usuarioId, empresaId);

    if (!registro) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const senhaValida = await comparePassword(input.senhaAtual, registro.senhaHash);

    if (!senhaValida) {
      throw new AppError('Senha atual incorreta', 400);
    }

    const mesmaSenha = await comparePassword(input.senhaNova, registro.senhaHash);

    if (mesmaSenha) {
      throw new AppError('A nova senha deve ser diferente da senha atual', 400);
    }

    const senhaHash = await hashPassword(input.senhaNova);

    const atualizado = await usuarioRepository.atualizarSenha(usuarioId, empresaId, senhaHash, false);

    if (!atualizado) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const { deveAlterarSenha, ...usuario } = atualizado;
    return { ...usuario, deveAlterarSenha };
  },
};
