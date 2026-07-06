import axios from 'axios';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';

const evolutionApi = axios.create({
  timeout: 15_000,
});

export async function enviarMensagem(telefone: string, mensagem: string): Promise<void> {
  if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) {
    throw new AppError('Evolution API não configurada (EVOLUTION_API_URL / EVOLUTION_API_KEY)', 503);
  }

  const numero = telefone.replace(/\D/g, '');
  if (numero.length < 10) {
    throw new AppError('Telefone do cliente inválido para envio de WhatsApp', 400);
  }

  const ddi = numero.startsWith('55') ? numero : `55${numero}`;

  await evolutionApi.post(
    `${env.EVOLUTION_API_URL}/message/sendText/${env.EVOLUTION_INSTANCE}`,
    { number: ddi, text: mensagem },
    { headers: { apikey: env.EVOLUTION_API_KEY } }
  );
}
