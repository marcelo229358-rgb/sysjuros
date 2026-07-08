import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { masterApiClient, MasterUser } from '../api/master.api';

interface MasterAuthContextValue {
  user: MasterUser | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const MasterAuthContext = createContext<MasterAuthContextValue | null>(null);

export function MasterAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MasterUser | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('master_token');
    if (!token) {
      setCarregando(false);
      return;
    }

    masterApiClient
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('master_token');
        localStorage.removeItem('master_user');
      })
      .finally(() => setCarregando(false));
  }, []);

  async function login(email: string, senha: string) {
    const { token, user: loggedUser } = await masterApiClient.signin(email, senha);
    localStorage.setItem('master_token', token);
    localStorage.setItem('master_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  function logout() {
    localStorage.removeItem('master_token');
    localStorage.removeItem('master_user');
    setUser(null);
  }

  return (
    <MasterAuthContext.Provider value={{ user, carregando, login, logout }}>
      {children}
    </MasterAuthContext.Provider>
  );
}

export function useMasterAuth() {
  const ctx = useContext(MasterAuthContext);
  if (!ctx) {
    throw new Error('useMasterAuth deve ser usado dentro de MasterAuthProvider');
  }
  return ctx;
}
