import { PerfilUsuario } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      usuarioId?: string;
      empresaId?: string;
      perfil?: PerfilUsuario;
      masterUsuarioId?: string;
      masterEmail?: string;
    }
  }
}

export {};
