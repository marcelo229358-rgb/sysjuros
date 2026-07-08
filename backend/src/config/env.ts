import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  EVOLUTION_INSTANCE: z.string().default('sysjuros'),
  FRONTEND_URL: z.string().optional(),
  MASTER_EMAIL: z.string().email().optional().or(z.literal('')),
  MASTER_PASSWORD: z.string().optional(),
  NOTIFICACAO_DIAS_ANTECEDENCIA: z.coerce.number().int().min(1).max(30).default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
