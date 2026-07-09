import { PlanoEmpresa } from '@prisma/client';
import { LEGACY_PLANO_MAP, LEGACY_PLANO_REVERSE } from '../../billing.config';

export const LegacyPlanoAdapter = {
  toPlanSlug(plano: PlanoEmpresa): string {
    return LEGACY_PLANO_MAP[plano] ?? 'basico';
  },

  toPlanoEmpresa(slug: string): PlanoEmpresa {
    return LEGACY_PLANO_REVERSE[slug.toLowerCase()] ?? 'BASICO';
  },
};
