import { z } from 'zod';
import { parcelaRepository } from '../parcela/parcela.repository';
import { notificacaoRepository } from './notificacao.repository';
import { enviarMensagem } from './whatsapp.client';
import { calcularValorAtualizado } from '../parcela/parcela.calculo';
import { formatarData, formatarMoeda } from '../../shared/utils/formatar.util';
import { AppError } from '../../shared/errors/AppError';

export const enviarCobrancaSchema = z.object({
  parcelaId: z.string().uuid('parcelaId inválido'),
});

export const notificacaoService = {
  async enviarCobrancaWhatsapp(parcelaId: string, empresaId: string, _usuarioId: string) {
    const parcela = await parcelaRepository.buscarComRelacoes(parcelaId, empresaId);

    if (!parcela) {
      throw new AppError('Parcela não encontrada', 404);
    }

    if (!parcela.contrato.cliente.telefone) {
      throw new AppError('Cliente não possui telefone cadastrado', 400);
    }

    const empresa = parcela.contrato.empresa;
    const calculo = calcularValorAtualizado({
      valorOriginal: Number(parcela.valorOriginal),
      dataVencimento: parcela.dataVencimento,
      dataReferencia: new Date(),
      taxaJurosMes: Number(empresa.taxaJurosMes),
      taxaMulta: Number(empresa.taxaMulta),
    });

    const vencida = calculo.diasAtraso > 0;
    const mensagem = vencida
      ? `Olá, ${parcela.contrato.cliente.nome}! 👋\n\n` +
        `Identificamos uma parcela em atraso:\n` +
        `📋 Contrato: ${parcela.contrato.numero}\n` +
        `📌 Parcela: ${parcela.numero}/${parcela.contrato.numParcelas}\n` +
        `📅 Vencimento: ${formatarData(parcela.dataVencimento)}\n` +
        `⏳ Dias em atraso: ${calculo.diasAtraso}\n\n` +
        `💰 Valor original: ${formatarMoeda(parcela.valorOriginal)}\n` +
        `➕ Multa: ${formatarMoeda(calculo.valorMulta)}\n` +
        `➕ Juros: ${formatarMoeda(calculo.valorJuros)}\n` +
        `✅ Total a pagar: ${formatarMoeda(calculo.valorAtualizado)}\n\n` +
        `Entre em contato para regularizar sua situação.`
      : `Olá, ${parcela.contrato.cliente.nome}! 👋\n\n` +
        `Lembramos que você tem uma parcela a vencer:\n` +
        `📋 Contrato: ${parcela.contrato.numero}\n` +
        `📌 Parcela: ${parcela.numero}/${parcela.contrato.numParcelas}\n` +
        `📅 Vencimento: ${formatarData(parcela.dataVencimento)}\n` +
        `💰 Valor: ${formatarMoeda(parcela.valorOriginal)}\n\n` +
        `Em caso de dúvidas, entre em contato.`;

    await enviarMensagem(parcela.contrato.cliente.telefone, mensagem);

    return { enviado: true, parcelaId };
  },

  async listar(empresaId: string, usuarioId: string) {
    return notificacaoRepository.listarNaoLidas(empresaId, usuarioId);
  },

  async marcarTodasComoLidas(empresaId: string, usuarioId: string) {
    const result = await notificacaoRepository.marcarTodasComoLidas(empresaId, usuarioId);
    return { atualizadas: result.count };
  },

  async marcarComoLida(id: string, empresaId: string, usuarioId: string) {
    const notificacao = await notificacaoRepository.marcarComoLida(id, empresaId, usuarioId);

    if (!notificacao) {
      throw new AppError('Notificação não encontrada', 404);
    }

    return notificacao;
  },

  async statusWhatsapp() {
    const { obterStatusWhatsapp } = await import('./whatsapp.client');
    return obterStatusWhatsapp();
  },

  async executarLembretesVencimento() {
    const { processarLembretesVencimento } = await import('./lembreteVencimento.service');
    return processarLembretesVencimento();
  },
};
