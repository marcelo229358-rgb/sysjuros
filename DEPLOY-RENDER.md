# Deploy na Render (teste gratuito)

Guia para publicar o SysContabel na [Render](https://render.com) antes de migrar para a Hostinger.

## O que será criado

| Serviço | Tipo | Nome |
|---------|------|------|
| PostgreSQL | Banco free | `syscontabel-db` |
| Backend API | Web Node | `syscontabel-api` |
| Frontend | Static Site | `syscontabel-web` |

## Pré-requisitos

1. Conta na Render (grátis)
2. Repositório no **GitHub** com o código do projeto
3. `render.yaml` na **raiz** do repositório (já incluído)

## Passo a passo

### 1. Subir o código no GitHub

```bash
cd syscontabel
git init
git add .
git commit -m "Deploy Render"
git remote add origin https://github.com/SEU_USUARIO/syscontabel.git
git push -u origin main
```

### 2. Criar o Blueprint na Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. **New** → **Blueprint**
3. Conecte o repositório GitHub
4. A Render detecta o `render.yaml` e lista os 3 recursos
5. Clique em **Apply**

O deploy leva alguns minutos. O backend roda migrations + seed automaticamente.

### 3. URLs após o deploy

- **Frontend:** `https://syscontabel-web.onrender.com`
- **API:** `https://syscontabel-api.onrender.com`
- **Health:** `https://syscontabel-api.onrender.com/health`

### 4. Login de teste

| Campo | Valor |
|-------|-------|
| E-mail | `admin@empresademo.com.br` |
| Senha | `admin123` |
| ID da Empresa | `1030c59f-503a-4dfc-ad8b-66c802060cd0` |

O ID da empresa é fixo no seed — o mesmo valor já está no build do frontend.

## Variáveis de ambiente (opcionais)

No painel da Render → serviço **syscontabel-api** → **Environment**:

| Variável | Descrição |
|----------|-----------|
| `EVOLUTION_API_URL` | URL da Evolution API (WhatsApp) — ex. VPS Hostinger |
| `EVOLUTION_API_KEY` | Chave da instância |
| `EVOLUTION_INSTANCE` | Nome da instância (padrão: `syscontabel`) |

O WhatsApp **não roda na Render** no plano free. Configure a Evolution API em outro servidor e aponte essas variáveis para lá.

## Limitações do plano free na Render

- **API dorme** após ~15 min sem uso — primeiro acesso pode levar 30–60 s
- **PostgreSQL free** expira em 90 dias (renovável ou migre para Hostinger)
- **PDF** funciona com Chromium leve (`@sparticuz/chromium`), mas pode ser lento no free tier
- **Cron de notificações** (08:00) só roda enquanto o serviço estiver ativo

## Redeploy manual

Após push no GitHub, a Render faz deploy automático. Para forçar:

**Manual Deploy** → **Deploy latest commit** em cada serviço.

## Migrar para Hostinger depois

Quando os testes estiverem ok:

1. Use o `docker-compose.yml` do backend na VPS Hostinger
2. Build do frontend: `VITE_API_URL=https://api.seudominio.com npm run build`
3. Sirva o `dist/` com Nginx ou Caddy
4. Rode a Evolution API no mesmo VPS
5. Copie o banco da Render com `pg_dump` / `pg_restore` se precisar dos dados de teste

## Troubleshooting

### Login não funciona
- Verifique se o deploy do **syscontabel-api** terminou sem erro
- Confira logs: `prisma migrate deploy` e `prisma db seed` devem aparecer no start

### CORS / frontend não conecta na API
- `FRONTEND_URL` e `VITE_API_URL` são ligados automaticamente pelo Blueprint
- Se alterou nomes dos serviços no `render.yaml`, faça redeploy dos dois

### PDF falha em produção
- Verifique logs do Chromium no serviço API
- No plano free, tente novamente após o serviço “acordar”

### Banco SSL
A Render já fornece `DATABASE_URL` com SSL. Se o Prisma falhar na conexão, adicione na URL:
`?sslmode=require`
