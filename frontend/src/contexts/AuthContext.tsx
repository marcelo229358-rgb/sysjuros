import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import { Empresa, PerfilUsuario, Usuario } from '../api/types';

interface AuthContextData {
  usuario: Usuario | null;
  empresa: Empresa | null;
  carregando: boolean;
  login: (email: string, senha: string, empresaId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('usuario');
    const empresaSalva = localStorage.getItem('empresa');

    if (token && usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
      if (empresaSalva) setEmpresa(JSON.parse(empresaSalva));

      authApi
        .me()
        .then((dados) => {
          setUsuario(dados);
          localStorage.setItem('usuario', JSON.stringify(dados));
        })
        .catch(() => logout())
        .finally(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
  }, []);

  async function login(email: string, senha: string, empresaId: string) {
    const response = await authApi.login({ email, senha, empresaId });
    localStorage.setItem('token', response.token);
    localStorage.setItem('usuario', JSON.stringify(response.usuario));
    localStorage.setItem('empresa', JSON.stringify(response.empresa));
    setUsuario(response.usuario);
    setEmpresa(response.empresa);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('empresa');
    setUsuario(null);
    setEmpresa(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, empresa, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export type { PerfilUsuario };
