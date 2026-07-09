import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3333),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('7d'),
    EVOLUTION_API_URL: z.string().optional(),
    EVOLUTION_API_KEY: z.string().optional(),
    EVOLUTION_INSTANCE: z.string().default('syscontabel'),
    FRONTEND_URL: z.string().optional(),
    MASTER_EMAIL: z.string().email().optional().or(z.literal('')),
    MASTER_PASSWORD: z.string().optional(),
    NOTIFICACAO_DIAS_ANTECEDENCIA: z.coerce.number().int().min(1).max(30).default(1),
    BILLING_ENABLED: z.preprocess(
      (v) => v === 'true' || v === true || v === '1',
      z.boolean().default(false)
    ),
    BILLING_ENFORCE_ACCESS: z.preprocess(
      (v) => v === 'true' || v === true || v === '1',
      z.boolean().default(false)
    ),
    BILLING_PRODUCT_ID: z.string().default('syscontabel'),
    KIWIFY_WEBHOOK_SECRET: z.string().optional(),
    HOTMART_WEBHOOK_SECRET: z.string().optional(),
    KIWIFY_CHECKOUT_URL: z.string().optional(),
    HOTMART_CHECKOUT_URL: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.FRONTEND_URL?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FRONTEND_URL é obrigatório em produção',
          path: ['FRONTEND_URL'],
        });
      }
      if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET deve ter no mínimo 32 caracteres em produção',
          path: ['JWT_SECRET'],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
