import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, PerfilUsuario } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface Props {
  children: React.ReactNode;
  perfisPermitidos?: PerfilUsuario[];
  permitirSenhaPendente?: boolean;
}

export function RotaProtegida({
  children,
  perfisPermitidos,
  permitirSenhaPendente = false,
}: Props) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return <LoadingSpinner />;
  if (!usuario) return <Navigate to="/login" replace />;

  if (usuario.deveAlterarSenha && !permitirSenhaPendente) {
    return <Navigate to="/alterar-senha" replace />;
  }

  if (!usuario.deveAlterarSenha && location.pathname === '/alterar-senha') {
    return <Navigate to="/dashboard" replace />;
  }

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
