import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificacoesSino } from './NotificacoesSino';

interface Props {
  titulo: string;
  onMenuClick?: () => void;
}

export function Topbar({ titulo, onMenuClick }: Props) {
  const { usuario, empresa, logout } = useAuth();
  const { modoEscuro, alternarTema } = useTheme();

  return (
    <Navbar className="app-topbar border-bottom px-3 px-md-4 py-2 py-md-3 bg-body">
      <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
        <Button
          variant="outline-secondary"
          size="sm"
          className="d-md-none flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          data-testid="btn-menu-mobile"
        >
          ☰
        </Button>
        <Navbar.Brand className="fw-semibold mb-0 text-truncate">{titulo}</Navbar.Brand>
      </div>

      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        <NotificacoesSino />

        <Button
          variant="outline-secondary"
          size="sm"
          onClick={alternarTema}
          data-testid="toggle-modo-escuro"
          className="topbar-btn-tema"
        >
          <span className="d-md-none">{modoEscuro ? '☀️' : '🌙'}</span>
          <span className="d-none d-md-inline">{modoEscuro ? '☀️ Claro' : '🌙 Escuro'}</span>
        </Button>

        <div className="text-end small d-none d-lg-block">
          <div className="fw-semibold">{usuario?.nome}</div>
          <div className="text-muted">{empresa?.nome}</div>
        </div>

        <Dropdown align="end" className="d-lg-none">
          <Dropdown.Toggle variant="outline-secondary" size="sm" id="topbar-user-menu">
            👤
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Header>
              <div className="fw-semibold">{usuario?.nome}</div>
              <div className="small text-muted">{empresa?.nome}</div>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item onClick={logout} className="text-danger">
              Sair
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <Button variant="outline-danger" size="sm" onClick={logout} className="d-none d-lg-inline-block">
          Sair
        </Button>
      </div>
    </Navbar>
  );
}
