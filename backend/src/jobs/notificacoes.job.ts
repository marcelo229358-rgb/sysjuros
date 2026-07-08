import cron from 'node-cron';
import { processarLembretesVencimento } from '../modules/notificacao/lembreteVencimento.service';
import { env } from '../config/env';

export function iniciarJobNotificacoes() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[JOB] Verificando parcelas com vencimento amanhã...');

    try {
      const resultado = await processarLembretesVencimento();
      console.log(
        `[JOB] Lembretes: ${resultado.notificacoesCriadas} notificações, ` +
          `${resultado.whatsappEnviados} WhatsApp enviados, ` +
          `${resultado.whatsappIgnorados} ignorados, ` +
          `${resultado.errosWhatsapp} erros.`
      );
    } catch (err) {
      console.error('[JOB] Erro ao processar lembretes:', err);
    }
  });

  console.log(
    `[JOB] Agendamento de lembretes ativo (diário às 08:00, ${env.NOTIFICACAO_DIAS_ANTECEDENCIA} dia(s) antes do vencimento).`
  );
}
