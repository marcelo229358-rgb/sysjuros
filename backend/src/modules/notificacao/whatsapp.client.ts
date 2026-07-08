import axios from 'axios';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';

const evolutionApi = axios.create({
  timeout: 15_000,
});

export function isWhatsappConfigured(): boolean {
  return !!(env.EVOLUTION_API_URL?.trim() && env.EVOLUTION_API_KEY?.trim());
}

function headers() {
  return { apikey: env.EVOLUTION_API_KEY! };
}

function baseUrl() {
  return env.EVOLUTION_API_URL!.replace(/\/$/, '');
}

export function normalizarTelefoneWhatsapp(telefone: string): string {
  const numero = telefone.replace(/\D/g, '');
  if (numero.length < 10) {
    throw new AppError('Telefone do cliente inválido para envio de WhatsApp', 400);
  }
  return numero.startsWith('55') ? numero : `55${numero}`;
}

export async function enviarMensagem(telefone: string, mensagem: string): Promise<void> {
  if (!isWhatsappConfigured()) {
    throw new AppError('Evolution API não configurada (EVOLUTION_API_URL / EVOLUTION_API_KEY)', 503);
  }

  const ddi = normalizarTelefoneWhatsapp(telefone);

  await evolutionApi.post(
    `${baseUrl()}/message/sendText/${env.EVOLUTION_INSTANCE}`,
    { number: ddi, text: mensagem },
    { headers: headers() }
  );
}

export async function obterStatusWhatsapp(): Promise<{
  configurado: boolean;
  instancia: string;
  conectado: boolean;
  estado: string;
  managerUrl?: string;
}> {
  const instancia = env.EVOLUTION_INSTANCE;

  if (!isWhatsappConfigured()) {
    return {
      configurado: false,
      instancia,
      conectado: false,
      estado: 'nao_configurado',
    };
  }

  try {
    const { data } = await evolutionApi.get(
      `${baseUrl()}/instance/connectionState/${instancia}`,
      { headers: headers() }
    );

    const estado = String(data?.instance?.state ?? data?.state ?? 'desconhecido').toLowerCase();
    const conectado = estado === 'open';

    return {
      configurado: true,
      instancia,
      conectado,
      estado,
      managerUrl: baseUrl().replace(':8080', ':3000'),
    };
  } catch {
    return {
      configurado: true,
      instancia,
      conectado: false,
      estado: 'instancia_nao_encontrada',
      managerUrl: baseUrl().replace(':8080', ':3000'),
    };
  }
}

export async function garantirInstanciaEvolution(): Promise<void> {
  if (!isWhatsappConfigured()) {
    console.log('[WhatsApp] Evolution API não configurada — envio automático desativado.');
    return;
  }

  const instancia = env.EVOLUTION_INSTANCE;
  const status = await obterStatusWhatsapp();

  if (status.estado !== 'instancia_nao_encontrada') {
    console.log(`[WhatsApp] Instância "${instancia}" — estado: ${status.estado}`);
    return;
  }

  try {
    await evolutionApi.post(
      `${baseUrl()}/instance/create`,
      {
        instanceName: instancia,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      },
      { headers: headers() }
    );
    console.log(`[WhatsApp] Instância "${instancia}" criada. Escaneie o QR no Evolution Manager.`);
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    console.warn('[WhatsApp] Não foi possível criar instância:', msg ?? 'erro desconhecido');
  }
}
