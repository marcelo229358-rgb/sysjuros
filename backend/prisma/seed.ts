import { PrismaClient, PerfilUsuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMPRESA_ID = '1030c59f-503a-4dfc-ad8b-66c802060cd0';

async function main() {
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '00000000000191' },
    update: { taxaJurosMes: 30.0, nome: 'Empresa Demo SysContabel' },
    create: {
      id: DEMO_EMPRESA_ID,
      nome: 'Empresa Demo SysContabel',
      cnpj: '00000000000191',
      email: 'contato@empresademo.com.br',
      telefone: '(11) 99999-0000',
      taxaJurosMes: 30.0,
      taxaMulta: 2.0,
    },
  });

  const senhaHash = await bcrypt.hash('admin123', 10);

  const usuario = await prisma.usuario.upsert({
    where: {
      empresaId_email: {
        empresaId: empresa.id,
        email: 'admin@empresademo.com.br',
      },
    },
    update: {},
    create: {
      empresaId: empresa.id,
      nome: 'Administrador',
      email: 'admin@empresademo.com.br',
      senhaHash,
      perfil: PerfilUsuario.ADMIN,
      ativo: true,
    },
  });

  console.log('Seed concluído:');
  console.log(`  Empresa: ${empresa.nome} (${empresa.id})`);
  console.log(`  Usuário: ${usuario.email} / senha: admin123`);
  console.log(`  empresaId para login: ${empresa.id}`);
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
