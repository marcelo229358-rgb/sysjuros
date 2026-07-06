import { NavLink } from 'react-router-dom';
import { usePermissao } from '../../hooks/usePermissao';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/contratos', label: 'Contratos', icon: '📄' },
  { to: '/parcelas', label: 'Parcelas', icon: '💰' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/relatorios', label: 'Relatórios', icon: '📈', permissao: 'relatorios' as const },
  {
    to: '/configuracoes',
    label: 'Configurações',
    icon: '⚙️',
    permissao: 'taxas' as const,
    testId: 'menu-configuracoes',
  },
  {
    to: '/usuarios',
    label: 'Usuários',
    icon: '🔐',
    permissao: 'usuarios' as const,
    testId: 'menu-usuarios',
  },
];

interface Props {
  onNavigate?: () => void;
  mostrarBrand?: boolean;
}

export function SidebarNav({ onNavigate, mostrarBrand = true }: Props) {
  const { podeVerRelatorios, podeEditarTaxas, podeGerenciarUsuarios } = usePermissao();

  const visivel = (permissao?: string) => {
    if (permissao === 'relatorios') return podeVerRelatorios;
    if (permissao === 'taxas') return podeEditarTaxas;
    if (permissao === 'usuarios') return podeGerenciarUsuarios;
    return true;
  };

  return (
    <>
      {mostrarBrand && (
        <div className="mb-4">
          <h5 className="fw-bold text-primary mb-0">SysJuros</h5>
          <small className="text-muted">Controle de cobranças</small>
        </div>
      )}
      <nav className="nav flex-column gap-1">
        {links
          .filter((link) => visivel(link.permissao))
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              data-testid={link.testId}
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-link rounded px-3 py-2 ${isActive ? 'active bg-primary text-white' : 'text-body'}`
              }
            >
              <span className="me-2">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
      </nav>
    </>
  );
}
