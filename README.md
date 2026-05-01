# Parceriza

Plataforma web — monorepo com `server` (API Node/Express) e `client` (React + Vite).

## Stack

- **Server:** Node.js 20, TypeScript, Express, Prisma, PostgreSQL, Vitest
- **Client:** React 18, TypeScript, Vite, Vitest
- **Infra:** Docker + docker-compose, ESLint, Prettier

## Estrutura

```
parceriza/
├── server/        # API Express + Prisma
├── client/        # Frontend React + Vite
├── docker-compose.yml
└── package.json   # workspaces
```

## Pré-requisitos

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose (opcional, para Postgres local)

## Setup

```bash
npm install
cp server/.env.example server/.env
docker compose up -d db          # sobe Postgres
npm run --workspace=server prisma:migrate
npm run dev                       # roda server e client em paralelo
```

- API: http://localhost:3000
- Web: http://localhost:5173

## Scripts úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | server + client em paralelo |
| `npm run build` | build em todos os workspaces |
| `npm run test` | testes em todos os workspaces |
| `npm run lint` | lint em todos os workspaces |
| `npm run format` | Prettier em todo o repo |
