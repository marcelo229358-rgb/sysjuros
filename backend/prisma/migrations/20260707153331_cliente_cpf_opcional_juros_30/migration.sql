-- AlterTable
ALTER TABLE "clientes" ALTER COLUMN "cpfCnpj" DROP NOT NULL;

-- AlterTable
ALTER TABLE "empresas" ALTER COLUMN "taxaJurosMes" SET DEFAULT 30.0;
