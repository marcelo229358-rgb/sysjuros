import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextData {
  modoEscuro: boolean;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modoEscuro, setModoEscuro] = useState(() => {
    return localStorage.getItem('modoEscuro') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', modoEscuro ? 'dark' : 'light');
    localStorage.setItem('modoEscuro', String(modoEscuro));
  }, [modoEscuro]);

  function alternarTema() {
    setModoEscuro((atual) => !atual);
  }

  return (
    <ThemeContext.Provider value={{ modoEscuro, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
