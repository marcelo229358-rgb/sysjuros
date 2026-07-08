-- AlterTable
ALTER TABLE "notificacoes" ADD COLUMN     "parcelaId" TEXT,
ADD COLUMN     "tipo" TEXT;

-- CreateIndex
CREATE INDEX "notificacoes_empresaId_tipo_parcelaId_idx" ON "notificacoes"("empresaId", "tipo", "parcelaId");
