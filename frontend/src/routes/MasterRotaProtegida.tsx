import { Navigate } from 'react-router-dom';
import { useMasterAuth } from '../contexts/MasterAuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function MasterRotaProtegida({ children }: { children: React.ReactNode }) {
  const { user, carregando } = useMasterAuth();

  if (carregando) {
    return (
      <div className="master-shell min-vh-100 d-flex align-items-center justify-content-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/master/login" replace />;
  }

  return children;
}
