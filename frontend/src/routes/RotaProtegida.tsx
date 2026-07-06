import { Navigate } from 'react-router-dom';
import { useAuth, PerfilUsuario } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface Props {
  children: React.ReactNode;
  perfisPermitidos?: PerfilUsuario[];
}

export function RotaProtegida({ children, perfisPermitidos }: Props) {
  const { usuario, carregando } = useAuth();

  if (carregando) return <LoadingSpinner />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
