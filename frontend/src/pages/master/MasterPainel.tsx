import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { useMasterAuth } from '../../contexts/MasterAuthContext';
import { MasterSecao } from '../../api/master.api';
import { MasterSidebar } from './MasterSidebar';
import { MasterEmpresasSection } from './sections/MasterEmpresasSection';
import { MasterClientesSection } from './sections/MasterClientesSection';
import { MasterAssinaturasSection } from './sections/MasterAssinaturasSection';
import { MasterFinanceiroSection } from './sections/MasterFinanceiroSection';
import { MasterPermissoesSection } from './sections/MasterPermissoesSection';
import { MasterMonitoramentoSection } from './sections/MasterMonitoramentoSection';
import { MasterBillingSection } from './sections/MasterBillingSection';
import '../../styles/master.scss';

const TITULOS: Record<MasterSecao, string> = {
  empresas: 'Empresas',
  clientes: 'Clientes',
  assinaturas: 'Assinaturas',
  financeiro: 'Financeiro',
  permissoes: 'Permissões',
  monitoramento: 'Monitoramento',
  billing: 'Billing — AppDeploy',
};

export function MasterPainel() {
  const { user, logout } = useMasterAuth();
  const navigate = useNavigate();
  const [secao, setSecao] = useState<MasterSecao>('empresas');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  function onAlert(tipo: 'erro' | 'sucesso', msg: string) {
    if (tipo === 'erro') {
      setErro(msg);
      setSucesso('');
    } else {
      setSucesso(msg);
      setErro('');
    }
  }

  function handleLogout() {
    logout();
    navigate('/master/login');
  }

  return (
    <div className="master-shell">
      <header className="master-header">
        <h1>👑 Plataforma Master — SysContabel</h1>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">{user?.email}</span>
          <Button variant="outline-light" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <div className="master-layout">
        <MasterSidebar secao={secao} onChange={setSecao} />

        <main className="master-main">
          <h2 className="master-page-title">{TITULOS[secao]}</h2>

          {erro && <div className="alert alert-danger py-2">{erro}</div>}
          {sucesso && <div className="alert alert-success py-2">{sucesso}</div>}

          {secao === 'empresas' && <MasterEmpresasSection onAlert={onAlert} />}
          {secao === 'clientes' && <MasterClientesSection onAlert={onAlert} />}
          {secao === 'assinaturas' && <MasterAssinaturasSection onAlert={onAlert} />}
          {secao === 'financeiro' && <MasterFinanceiroSection onAlert={onAlert} />}
          {secao === 'permissoes' && <MasterPermissoesSection onAlert={onAlert} />}
          {secao === 'monitoramento' && <MasterMonitoramentoSection onAlert={onAlert} />}
          {secao === 'billing' && <MasterBillingSection onAlert={onAlert} />}
        </main>
      </div>
    </div>
  );
}
