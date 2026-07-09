import { Routes, Route, Navigate } from 'react-router-dom';
import { RotaProtegida } from './RotaProtegida';
import { MasterRotaProtegida } from './MasterRotaProtegida';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Clientes } from '../pages/Clientes';
import { Contratos } from '../pages/Contratos';
import { ContratoDetalhe } from '../pages/ContratoDetalhe';
import { Parcelas } from '../pages/Parcelas';
import { Saudavel } from '../pages/Saudavel';
import { Agenda } from '../pages/Agenda';
import { Relatorios } from '../pages/Relatorios';
import { Configuracoes } from '../pages/Configuracoes';
import { Usuarios } from '../pages/Usuarios';
import { AlterarSenha } from '../pages/AlterarSenha';
import { MinhaAssinatura } from '../pages/MinhaAssinatura';
import { MasterLogin } from '../pages/master/MasterLogin';
import { MasterPainel } from '../pages/master/MasterPainel';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/alterar-senha"
        element={
          <RotaProtegida permitirSenhaPendente>
            <AlterarSenha />
          </RotaProtegida>
        }
      />
      <Route path="/master/login" element={<MasterLogin />} />
      <Route
        path="/master"
        element={
          <MasterRotaProtegida>
            <MasterPainel />
          </MasterRotaProtegida>
        }
      />

      <Route
        element={
          <RotaProtegida>
            <DashboardLayout />
          </RotaProtegida>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/contratos/:id" element={<ContratoDetalhe />} />
        <Route path="/parcelas" element={<Parcelas />} />
        <Route path="/saudavel" element={<Saudavel />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route
          path="/relatorios"
          element={
            <RotaProtegida perfisPermitidos={['ADMIN', 'FINANCEIRO']}>
              <Relatorios />
            </RotaProtegida>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <RotaProtegida perfisPermitidos={['ADMIN']}>
              <Configuracoes />
            </RotaProtegida>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RotaProtegida perfisPermitidos={['ADMIN']}>
              <Usuarios />
            </RotaProtegida>
          }
        />
        <Route
          path="/minha-assinatura"
          element={
            <RotaProtegida perfisPermitidos={['ADMIN']}>
              <MinhaAssinatura />
            </RotaProtegida>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
