import { usuarioRepository } from '../usuario/usuario.repository';
import { comparePassword } from '../../shared/utils/hash.util';
import { signToken } from '../../shared/utils/jwt.util';
import { AppError } from '../../shared/errors/AppError';
import { LoginInput } from './auth.dto';

export const authService = {
  async login(input: LoginInput) {
    const usuario = await usuarioRepository.findByEmailAndEmpresa(input.email, input.empresaId);

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
};
