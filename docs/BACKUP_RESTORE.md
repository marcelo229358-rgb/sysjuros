# Backup e restore — PostgreSQL SysContabel

## Backup automático (VPS)

### 1. Cron diário na VPS

```bash
mkdir -p /var/backups/syscontabel

# Crontab (03:30 diário)
crontab -e
```

```
30 3 * * * cd /root/sysjuros && docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'PGPASSWORD=$POSTGRES_PASSWORD pg_dump -U $POSTGRES_USER $POSTGRES_DB' | gzip > /var/backups/syscontabel/syscontabel_$(date +\%Y\%m\%d).sql.gz
```

### 2. Via script do repositório

```bash
# Dentro do container postgres
docker compose -f docker-compose.prod.yml exec postgres sh -c \
  'apk add --no-cache postgresql-client && POSTGRES_HOST=localhost /path/to/postgres-backup.sh'
```

Ou localmente com `DATABASE_URL`:

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/sysjuros"
chmod +x backend/scripts/postgres-backup.sh
./backend/scripts/postgres-backup.sh
```

Arquivos ficam em `./backups/` (gitignored).

### 3. Retenção

Padrão: **14 dias** (`RETENTION_DAYS=14`).

### 4. Cópia off-site (recomendado)

```bash
# Exemplo: rsync para outro servidor
rsync -avz /var/backups/syscontabel/ user@backup-server:/backups/syscontabel/
```

---

## Restore

### Ambiente de staging / disaster recovery

```bash
# 1. Parar backend (evita escritas durante restore)
docker compose -f docker-compose.prod.yml stop backend frontend

# 2. Restaurar dump
gunzip -c /var/backups/syscontabel/syscontabel_20260709.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# 3. Subir novamente
docker compose -f docker-compose.prod.yml up -d
```

### Restore em banco vazio

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -c "DROP DATABASE IF EXISTS sysjuros;"
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -c "CREATE DATABASE sysjuros;"
gunzip -c backup.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d sysjuros
```

### Validação pós-restore

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status
curl https://api-sysjuros.appdeploy.site/health
```

---

## Teste mensal recomendado

1. Restaurar último backup em ambiente isolado
2. Validar login tenant + master
3. Validar contagem de empresas/clientes/contratos
4. Documentar tempo de restore
