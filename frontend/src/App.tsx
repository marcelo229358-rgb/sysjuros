import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MasterAuthProvider } from './contexts/MasterAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MasterAuthProvider>
            <AppRoutes />
          </MasterAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
