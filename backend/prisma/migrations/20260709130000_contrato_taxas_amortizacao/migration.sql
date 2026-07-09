-- Taxa de juros/multa por contrato (opcional; fallback na empresa)
ALTER TABLE "contratos" ADD COLUMN "taxaJurosMes" DECIMAL(65,30);
ALTER TABLE "contratos" ADD COLUMN "taxaMulta" DECIMAL(65,30);
