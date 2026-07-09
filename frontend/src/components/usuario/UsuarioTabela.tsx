import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { Usuario } from '../../api/types';
import { TabelaPaginada } from '../common/TabelaPaginada';
import { MobileDataCard } from '../common/MobileDataCard';
import { PaginacaoMeta } from '../../api/types';

const perfilLabel: Record<string, string> = {
  ADMIN: 'Administrador',
  FINANCEIRO: 'Financeiro',
  OPERADOR: 'Operador',
};

interface Props {
  usuarios: Usuario[];
  meta?: PaginacaoMeta;
  usuarioLogadoId?: string;
  onPaginaChange: (pagina: number) => void;
  onEditar: (usuario: Usuario) => void;
  onRedefinirSenha: (usuario: Usuario) => void;
  onExcluir?: (usuario: Usuario) => void;
}

export function UsuarioTabela({
  usuarios,
  meta,
  usuarioLogadoId,
  onPaginaChange,
  onEditar,
  onRedefinirSenha,
  onExcluir,
}: Props) {
  return (
    <TabelaPaginada
      colunas={['Nome', 'E-mail', 'Perfil', 'Status', 'Senha', 'Ações']}
      meta={meta}
      onPaginaChange={onPaginaChange}
      mobileCards={usuarios.map((usuario) => (
        <MobileDataCard
          key={usuario.id}
          titulo={usuario.nome}
          campos={[
            { label: 'E-mail', valor: usuario.email },
            { label: 'Perfil', valor: perfilLabel[usuario.perfil] ?? usuario.perfil },
            { label: 'Status', valor: usuario.ativo ? 'Ativo' : 'Inativo' },
            {
              label: 'Senha',
              valor: usuario.deveAlterarSenha ? 'Troca pendente' : 'Definida',
            },
          ]}
          acoes={
            <>
              <Button size="sm" variant="outline-primary" onClick={() => onEditar(usuario)}>
                Editar
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => onRedefinirSenha(usuario)}>
                Redefinir senha
              </Button>
              {onExcluir && usuario.ativo && usuario.id !== usuarioLogadoId && (
                <Button size="sm" variant="outline-danger" onClick={() => onExcluir(usuario)}>
                  Inativar
                </Button>
              )}
            </>
          }
        />
      ))}
    >
      {usuarios.map((usuario) => (
        <tr key={usuario.id}>
          <td>{usuario.nome}</td>
          <td className="d-none d-lg-table-cell">{usuario.email}</td>
          <td>{perfilLabel[usuario.perfil] ?? usuario.perfil}</td>
          <td>{usuario.ativo ? 'Ativo' : 'Inativo'}</td>
          <td>
            {usuario.deveAlterarSenha ? (
              <Badge bg="warning" text="dark">
                Troca pendente
              </Badge>
            ) : (
              <Badge bg="success">OK</Badge>
            )}
          </td>
          <td className="d-flex flex-wrap gap-2">
            <Button size="sm" variant="outline-primary" onClick={() => onEditar(usuario)}>
              Editar
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => onRedefinirSenha(usuario)}>
              Redefinir senha
            </Button>
            {onExcluir && usuario.ativo && usuario.id !== usuarioLogadoId && (
              <Button size="sm" variant="outline-danger" onClick={() => onExcluir(usuario)}>
                Inativar
              </Button>
            )}
          </td>
        </tr>
      ))}
    </TabelaPaginada>
  );
}
