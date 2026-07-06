import { useAuth } from '../contexts/AuthContext';

export function usePermissao() {
  const { usuario } = useAuth();

  return {
    podeExcluirCliente: usuario?.perfil === 'ADMIN',
    podeEditarTaxas: usuario?.perfil === 'ADMIN',
    podeRegistrarPagamento: ['ADMIN', 'FINANCEIRO'].includes(usuario?.perfil ?? ''),
    podeEnviarCobrancaWhatsapp: ['ADMIN', 'FINANCEIRO'].includes(usuario?.perfil ?? ''),
    podeVerRelatorios: ['ADMIN', 'FINANCEIRO'].includes(usuario?.perfil ?? ''),
    podeGerenciarUsuarios: usuario?.perfil === 'ADMIN',
  };
}
