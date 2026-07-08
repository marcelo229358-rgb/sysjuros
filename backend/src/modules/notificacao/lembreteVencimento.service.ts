import { StatusParcela } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { formatarData, formatarMoeda } from '../../shared/utils/formatar.util';
import { enviarMensagem, isWhatsappConfigured } from './whatsapp.client';

export const TIPO_LEMBRETE_VENCIMENTO = 'LEMBRETE_VENCIMENTO_1D';

type ParcelaComRelacoes = Awaited<ReturnType<typeof buscarParcelasParaLembrete>>[number];

function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function montarMensagemLembreteVencimento(parcela: ParcelaComRelacoes): string {
  const cliente = parcela.contrato.cliente;
  const contrato = parcela.contrato;

  return (
    `Olá, ${cliente.nome}! 👋\n\n` +
    `Lembrete: sua parcela vence *amanhã*.\n\n` +
    `📋 Contrato: ${contrato.numero}\n` +
    `📌 Parcela: ${parcela.numero}/${contrato.numParcelas}\n` +
    `📅 Vencimento: ${formatarData(parcela.dataVencimento)}\n` +
    `💰 Valor: ${formatarMoeda(parcela.valorOriginal)}\n\n` +
    `Evite multas e juros — entre em contato para regularizar o pagamento.`
  );
}

async function buscarParcelasParaLembrete(diasAntecedencia: number) {
  const hoje = inicioDoDia(new Date());
  const alvo = new Date(hoje);
  alvo.setDate(alvo.getDate() + diasAntecedencia);

  return prisma.parcela.findMany({
    where: {
      status: StatusParcela.PENDENTE,
      dataVencimento: {
        gte: inicioDoDia(alvo),
        lte: fimDoDia(alvo),
      },
    },
    include: {
      contrato: {
        include: {
          cliente: true,
          empresa: true,
        },
      },
    },
  });
}

async function jaProcessouHoje(empresaId: string, parcelaId: string): Promise<boolean> {
  const existente = await prisma.notificacao.findFirst({
    where: {
      empresaId,
      parcelaId,
      tipo: TIPO_LEMBRETE_VENCIMENTO,
      criadoEm: { gte: inicioDoDia(new Date()) },
    },
    select: { id: true },
  });
  return !!existente;
}

export async function processarLembretesVencimento() {
  const diasAntecedencia = env.NOTIFICACAO_DIAS_ANTECEDENCIA;
  const parcelas = await buscarParcelasParaLembrete(diasAntecedencia);

  let notificacoesCriadas = 0;
  let whatsappEnviados = 0;
  let whatsappIgnorados = 0;
  let errosWhatsapp = 0;

  for (const parcela of parcelas) {
    if (await jaProcessouHoje(parcela.empresaId, parcela.id)) {
      continue;
    }

    const mensagemInterna =
      `${parcela.contrato.cliente.nome} — Contrato ${parcela.contrato.numero}, ` +
      `parcela ${parcela.numero}, vence em ${formatarData(parcela.dataVencimento)} (amanhã).`;

    await prisma.notificacao.create({
      data: {
        empresaId: parcela.empresaId,
        titulo: 'Parcela vence amanhã',
        mensagem: mensagemInterna,
        tipo: TIPO_LEMBRETE_VENCIMENTO,
        parcelaId: parcela.id,
      },
    });
    notificacoesCriadas++;

    const telefone = parcela.contrato.cliente.telefone;
    if (!telefone) {
      whatsappIgnorados++;
      continue;
    }

    if (!isWhatsappConfigured()) {
      whatsappIgnorados++;
      continue;
    }

    try {
      await enviarMensagem(telefone, montarMensagemLembreteVencimento(parcela));
      whatsappEnviados++;
    } catch (err) {
      errosWhatsapp++;
      console.error(
        `[JOB] Falha WhatsApp parcela ${parcela.id}:`,
        (err as Error).message ?? err
      );
    }
  }

  return {
    diasAntecedencia,
    parcelasEncontradas: parcelas.length,
    notificacoesCriadas,
    whatsappEnviados,
    whatsappIgnorados,
    errosWhatsapp,
    whatsappConfigurado: isWhatsappConfigured(),
  };
}
