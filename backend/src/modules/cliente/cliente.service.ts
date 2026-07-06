import { clienteRepository } from './cliente.repository';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginacaoMeta } from '../../shared/utils/pagination.util';
import { CriarClienteDTO, AtualizarClienteDTO, ListarClientesQuery } from './cliente.dto';

export const clienteService = {
  async criar(empresaId: string, input: CriarClienteDTO) {
    const existente = await clienteRepository.buscarPorCpfCnpj(input.cpfCnpj, empresaId);

    if (existente) {
      throw new AppError('CPF/CNPJ já cadastrado nesta empresa', 409);
    }

    return clienteRepository.criar(empresaId, {
      nome: input.nome,
      cpfCnpj: input.cpfCnpj,
      email: input.email || null,
      telefone: input.telefone ?? null,
      endereco: input.endereco ?? null,
    });
  },

  async listar(empresaId: string, query: ListarClientesQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { data, total } = await clienteRepository.listar(empresaId, {
      skip,
      take: limit,
      nome: query.nome,
      cpfCnpj: query.cpfCnpj,
      incluirInativos: query.incluirInativos,
    });

    return {
      data,
      meta: buildPaginacaoMeta(total, page, limit),
    };
  },

  async obterPorId(id: string, empresaId: string) {
    const cliente = await clienteRepository.buscarPorId(id, empresaId);

    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    return cliente;
  },

  async atualizar(id: string, empresaId: string, input: AtualizarClienteDTO) {
    const cliente = await clienteRepository.buscarPorId(id, empresaId);

    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (input.cpfCnpj && input.cpfCnpj !== cliente.cpfCnpj) {
      const existente = await clienteRepository.buscarPorCpfCnpj(input.cpfCnpj, empresaId, id);

      if (existente) {
        throw new AppError('CPF/CNPJ já cadastrado nesta empresa', 409);
      }
    }

    const atualizado = await clienteRepository.atualizar(id, empresaId, {
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.cpfCnpj !== undefined ? { cpfCnpj: input.cpfCnpj } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.telefone !== undefined ? { telefone: input.telefone ?? null } : {}),
      ...(input.endereco !== undefined ? { endereco: input.endereco ?? null } : {}),
    });

    if (!atualizado) {
      throw new AppError('Cliente não encontrado', 404);
    }

    return atualizado;
  },

  async excluir(id: string, empresaId: string) {
    const cliente = await clienteRepository.buscarPorId(id, empresaId);

    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (!cliente.ativo) {
      throw new AppError('Cliente já está inativo', 400);
    }

    const contratosEmAberto = await clienteRepository.contarContratosEmAberto(id, empresaId);

    if (contratosEmAberto > 0) {
      throw new AppError('Não é possível excluir cliente com contratos em aberto', 400);
    }

    const result = await clienteRepository.softDelete(id, empresaId);

    if (!result) {
      throw new AppError('Cliente não encontrado', 404);
    }

    return result;
  },
};
