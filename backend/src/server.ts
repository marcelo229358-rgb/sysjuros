import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { iniciarJobNotificacoes } from './jobs/notificacoes.job';
import { bootstrapMasterUser } from './modules/master/master.service';
import { garantirInstanciaEvolution } from './modules/notificacao/whatsapp.client';

async function bootstrap() {
  await connectDatabase();
  await bootstrapMasterUser();
  await garantirInstanciaEvolution();
  iniciarJobNotificacoes();

  const server = app.listen(env.PORT, () => {
    console.log(`Servidor rodando na porta ${env.PORT}`);
  });

  const shutdown = async () => {
    console.log('Encerrando servidor...');
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});
