import type { Browser } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';
import { pagamentoRepository } from '../pagamento/pagamento.repository';
import { contratoRepository } from '../contrato/contrato.repository';
import { reciboTemplate } from './templates/recibo.html';
import { extratoTemplate } from './templates/extrato.html';
import { AppError } from '../../shared/errors/AppError';

async function launchBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV === 'production') {
    const chromium = await import('@sparticuz/chromium');
    return puppeteer.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
    });
  }

  const puppeteerFull = await import('puppeteer');
  return puppeteerFull.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }) as Promise<Browser>;
}

async function gerarPDF(html: string): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export const pdfService = {
  async gerarRecibo(pagamentoId: string, empresaId: string): Promise<Buffer> {
    const pagamento = await pagamentoRepository.buscarComRelacoes(pagamentoId, empresaId);

    if (!pagamento) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    const html = reciboTemplate(pagamento);
    return gerarPDF(html);
  },

  async gerarExtrato(contratoId: string, empresaId: string): Promise<Buffer> {
    const contrato = await contratoRepository.buscarComRelacoesParaExtrato(contratoId, empresaId);

    if (!contrato) {
      throw new AppError('Contrato não encontrado', 404);
    }

    const html = extratoTemplate(contrato);
    return gerarPDF(html);
  },
};
