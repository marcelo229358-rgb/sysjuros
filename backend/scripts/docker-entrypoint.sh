#!/bin/sh
set -e

echo "[entrypoint] Aplicando migrations..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] RUN_SEED=true — executando seed..."
  npx prisma db seed
else
  echo "[entrypoint] Seed ignorado (defina RUN_SEED=true para rodar manualmente)."
fi

echo "[entrypoint] Iniciando API..."
exec node dist/server.js
