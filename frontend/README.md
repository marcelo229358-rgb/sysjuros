# SysContabel — Frontend

React + TypeScript + Bootstrap 5 + Recharts

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # ajuste VITE_API_URL e VITE_EMPRESA_ID
npm run dev
```

Acesse: http://localhost:5173

## Credenciais demo

| Campo | Valor |
|-------|-------|
| E-mail | admin@empresademo.com.br |
| Senha | admin123 |
| Empresa ID | UUID exibido no seed do backend |

## Telas

- **Dashboard** — indicadores + gráficos Recharts
- **Clientes** — CRUD com busca debounced
- **Contratos** — criação com preview de parcelas
- **Parcelas** — abas vencidas / a vencer / todas + modal pagamento
- **Agenda** — calendário de vencimentos (7/15/30 dias)
- **Relatórios** — ADMIN/FINANCEIRO
- **Configurações** — taxas (ADMIN)
- **Usuários** — placeholder Fase 5

## Modo escuro

Toggle no topbar — persiste em `localStorage` via `data-bs-theme`.

## Backend

Certifique-se de que a API está rodando em `http://localhost:3333` (ou ajuste `VITE_API_URL`).
