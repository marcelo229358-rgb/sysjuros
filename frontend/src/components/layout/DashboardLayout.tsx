import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Sidebar } from './Sidebar';
import { SidebarNav } from './SidebarNav';
import { Topbar } from './Topbar';

const titulos: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/contratos': 'Contratos',
  '/parcelas': 'Parcelas',
  '/saudavel': 'Saudável',
  '/agenda': 'Agenda',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/usuarios': 'Usuários',
};

export function DashboardLayout() {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const basePath = '/' + (location.pathname.split('/')[1] ?? '');
  const titulo =
    location.pathname.startsWith('/contratos/') && location.pathname !== '/contratos'
      ? 'Detalhe do contrato'
      : titulos[basePath] ?? 'SysContabel';

  return (
    <div className="app-layout d-flex min-vh-100 w-100">
      <Sidebar />

      <Offcanvas
        show={menuAberto}
        onHide={() => setMenuAberto(false)}
        placement="start"
        className="sidebar-offcanvas d-md-none"
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold text-primary">SysContabel</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-3">
          <SidebarNav onNavigate={() => setMenuAberto(false)} mostrarBrand={false} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="flex-grow-1 d-flex flex-column min-vw-0">
        <Topbar titulo={titulo} onMenuClick={() => setMenuAberto(true)} />
        <main className="app-main p-3 p-md-4 flex-grow-1 bg-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
