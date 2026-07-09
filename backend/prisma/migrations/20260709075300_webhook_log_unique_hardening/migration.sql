-- DropIndex (index replaced by unique constraint)
DROP INDEX IF EXISTS "billing_webhook_logs_provider_external_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "billing_webhook_logs_provider_external_id_key" ON "billing_webhook_logs"("provider", "external_id");
