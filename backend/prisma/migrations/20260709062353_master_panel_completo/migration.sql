-- CreateEnum
CREATE TYPE "PlanoEmpresa" AS ENUM ('BASICO', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "TipoLancamentoMaster" AS ENUM ('PAGAR', 'RECEBER');

-- CreateEnum
CREATE TYPE "StatusLancamentoMaster" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "plano" "PlanoEmpresa" NOT NULL DEFAULT 'BASICO';

-- CreateTable
CREATE TABLE "master_lancamentos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLancamentoMaster" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusLancamentoMaster" NOT NULL DEFAULT 'PENDENTE',
    "empresaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_permissions" (
    "id" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "acoes" JSONB NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_audit_logs" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "detalhes" JSONB,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "master_lancamentos_tipo_status_idx" ON "master_lancamentos"("tipo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "master_permissions_perfil_modulo_key" ON "master_permissions"("perfil", "modulo");

-- CreateIndex
CREATE INDEX "master_audit_logs_criadoEm_idx" ON "master_audit_logs"("criadoEm");

-- CreateIndex
CREATE INDEX "master_audit_logs_modulo_idx" ON "master_audit_logs"("modulo");

-- AddForeignKey
ALTER TABLE "master_lancamentos" ADD CONSTRAINT "master_lancamentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
