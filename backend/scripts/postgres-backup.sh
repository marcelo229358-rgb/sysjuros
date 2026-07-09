#!/bin/sh
# Backup PostgreSQL — SysContabel
# Uso local:  ./scripts/postgres-backup.sh
# Uso na VPS: docker compose exec postgres sh /backup/postgres-backup.sh
#
# Variáveis (opcional):
#   BACKUP_DIR=/var/backups/syscontabel
#   RETENTION_DAYS=14

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="syscontabel_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Iniciando pg_dump → ${BACKUP_DIR}/${FILENAME}"

if [ -n "$DATABASE_URL" ]; then
  pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"
elif [ -n "$POSTGRES_USER" ] && [ -n "$POSTGRES_DB" ]; then
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -h "${POSTGRES_HOST:-localhost}" "$POSTGRES_DB" | gzip > "${BACKUP_DIR}/${FILENAME}"
else
  echo "ERRO: defina DATABASE_URL ou POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB" >&2
  exit 1
fi

echo "[backup] Concluído: ${BACKUP_DIR}/${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

if [ "$RETENTION_DAYS" -gt 0 ]; then
  find "$BACKUP_DIR" -name 'syscontabel_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
  echo "[backup] Retenção: arquivos > ${RETENTION_DAYS} dias removidos"
fi
