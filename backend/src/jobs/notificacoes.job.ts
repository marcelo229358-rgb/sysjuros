import cron from 'node-cron';
import { StatusParcela } from '@prisma/client';
import { prisma } from '../config/database';
import { formatarData } from '../shared/utils/formatar.util';

export function iniciarJobNotificacoes() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[JOB] Verificando parcelas a vencer...');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const em3dias = new Date(hoje);
    em3dias.setDate(em3dias.getDate() + 3);
    em3dias.setHours(23, 59, 59, 999);

    const parcelas = await prisma.parcela.findMany({
      where: {
        status: StatusParcela.PENDENTE,
        dataVencimento: { lte: em3dias, gte: hoje },
      },
      include: { contrato: { include: { cliente: true } } },
    });

    for (const parcela of parcelas) {
      await prisma.notificacao.create({
        data: {
          empresaId: parcela.empresaId,
          titulo: 'Parcela vencendo em breve',
          mensagem:
            `${parcela.contrato.cliente.nome} — Contrato ${parcela.contrato.numero}, ` +
            `parcela ${parcela.numero}, vence em ${formatarData(parcela.dataVencimento)}.`,
        },
      });
    }

    console.log(`[JOB] ${parcelas.length} notificações geradas.`);
  });

  console.log('[JOB] Agendamento de notificações ativo (diário às 08:00).');
}
