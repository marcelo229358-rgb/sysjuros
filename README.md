# SysContabel

Sistema de Controle de Cobranças e Juros — multi-tenant, com backend Node.js + Prisma + PostgreSQL e frontend React + Bootstrap 5.

## Estrutura

| Pasta | Descrição |
|-------|-----------|
| `backend/` | API REST (Express + TypeScript + Prisma) |
| `frontend/` | Interface web (Vite + React) |

## Desenvolvimento local

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev

# Frontend (outro terminal)
cd frontend
cp .env.example .env   # ou use VITE_API_URL=http://localhost:3333
npm install
npm run dev
```

Acesse **http://localhost:5173**

### Login de teste

| Campo | Valor |
|-------|-------|
| E-mail | `admin@empresademo.com.br` |
| Senha | `admin123` |
| ID Empresa | `1030c59f-503a-4dfc-ad8b-66c802060cd0` |

## Deploy na Render

Veja [DEPLOY-RENDER.md](./DEPLOY-RENDER.md) — inclui `render.yaml` para Blueprint automático.

## Funcionalidades

- CRUD de clientes, contratos, parcelas e pagamentos
- Cálculo de juros e multa em tempo real
- Dashboard com indicadores e gráficos
- Envio de cobrança via WhatsApp (Evolution API)
- Geração de PDF (recibo e extrato)
- Notificações internas (cron diário)
- Layout responsivo (mobile)
