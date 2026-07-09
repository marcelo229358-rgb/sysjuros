# SysContabel — Backend

Sistema de Controle de Cobranças e Juros — API multi-tenant com Node.js, Express, TypeScript, Prisma e PostgreSQL.

## Stack

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT (autenticação multi-tenant)
- Docker

## Pré-requisitos

- Node.js 22+
- Docker (para PostgreSQL)

## Setup rápido

```bash
# 1. Subir o PostgreSQL
docker compose up -d postgres

# 2. Instalar dependências
npm install

# 3. Copiar variáveis de ambiente
cp .env.example .env

# 4. Rodar migrations e seed
npx prisma migrate dev --name init
npm run db:seed

# 5. Iniciar em desenvolvimento
npm run dev
```

## Credenciais de teste (seed)

| Campo     | Valor                          |
|-----------|--------------------------------|
| empresaId | exibido no console após seed   |
| email     | admin@empresademo.com.br       |
| senha     | admin123                       |

## Endpoints (Fase 1 + 2)

| Método | Rota                         | Descrição |
|--------|------------------------------|-----------|
| GET    | /health                      | Health check |
| POST   | /auth/login                  | Login |
| GET    | /auth/me                     | Usuário logado |
| GET    | /empresa/configuracoes       | Taxas da empresa |
| PUT    | /empresa/configuracoes       | Atualizar taxas (ADMIN) |
| POST   | /clientes                    | Criar cliente |
| GET    | /clientes                    | Listar (paginado, filtros) |
| GET    | /clientes/:id                | Detalhe |
| PUT    | /clientes/:id                | Atualizar |
| DELETE | /clientes/:id                | Soft delete |
| POST   | /contratos                   | Criar + gerar parcelas |
| GET    | /contratos                   | Listar |
| GET    | /contratos/:id               | Detalhe com parcelas |
| PUT    | /contratos/:id               | Atualizar (sem valorTotal/numParcelas) |
| PATCH  | /contratos/:id/status        | Alterar status |
| GET    | /parcelas                    | Listar com filtros |
| GET    | /parcelas/vencidas           | Contas vencidas (cálculo em tempo real) |
| GET    | /parcelas/a-vencer           | Agenda de vencimentos |
| GET    | /parcelas/:id                | Detalhe com valor atualizado |
| PATCH  | /parcelas/:id/status         | Alterar status |
| POST   | /pagamentos                  | Registrar pagamento integral |
| GET    | /pagamentos                  | Histórico |
| GET    | /pagamentos/:id              | Detalhe |
| GET    | /dashboard/resumo            | Indicadores principais |
| GET    | /dashboard/recebimentos-mensais | Gráfico barras (12 meses) |
| GET    | /dashboard/contratos-por-status | Gráfico pizza |
| GET    | /dashboard/proximos-vencimentos | Agenda (?dias=7) |
| GET    | /dashboard/inadimplencia     | Taxa + piores devedores (?limite=10) |

## Testes manuais (.http)

Arquivos em `requests/` para REST Client (VS Code) ou Insomnia:

- `00-auth.http` — login
- `01-cliente.http` — CRUD cliente
- `02-contrato.http` — contrato + parcelas
- `03-parcela.http` — vencidas / a vencer
- `04-pagamento.http` — pagamento + quitação
- `05-dashboard.http` — indicadores e relatórios

Smoke test automatizado:

```bash
npx tsx scripts/test-fase2.ts
npx tsx scripts/test-fase3.ts
```

### Exemplo de login

```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresademo.com.br","senha":"admin123","empresaId":"<UUID>"}'
```

### Exemplo de atualização de taxas (ADMIN)

```bash
curl -X PUT http://localhost:3333/empresa/configuracoes \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"taxaJurosMes":1.5,"taxaMulta":2.0}'
```

## Estrutura

Cada módulo segue o padrão **controller → service → repository**, com filtros multi-tenant via `req.empresaId` nos repositories.

## Próximas fases

- **Fase 4:** WhatsApp + PDF
- **Fase 5:** Notificações, modo escuro, permissões refinadas
- **Fase 6:** Deploy completo
