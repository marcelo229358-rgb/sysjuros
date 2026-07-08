-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "isMaster" BOOLEAN NOT NULL DEFAULT false;
