# CLAUDE.md — Parceriza
> Arquivo de instruções permanentes para o Claude Code.
> Leia este arquivo integralmente antes de qualquer ação neste repositório.

---

## 1. Identidade do Projeto

**Parceriza** é um ecossistema jurídico digital B2B que conecta advogados por meio de um marketplace de JOBs jurídicos, agentes de IA, tokens (PCT) e retaguarda processual.

- **Produto:** Plataforma SaaS para advogados
- **Modelo:** B2B (advogado × advogado)
- **Status:** MVP concluído (9 fases), aguardando deploy em produção
- **Desenvolvido por:** HMP Advocacia & Preddita — Jaraguá do Sul, SC
- **Stack:** TypeScript · Node.js · React · Prisma · Claude API (Anthropic)

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Observação |
|---|---|---|
| Backend | Node.js + TypeScript + Express | API REST, tipagem estrita |
| ORM | Prisma | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 18 + Vite + TypeScript | SPA com proxy reverso |
| IA | Anthropic Claude API | Haiku (custo), Sonnet (qualidade), Opus (complexo) |
| Pagamentos | Asaas | Pix, boleto — sandbox configurado |
| Tribunais | DataJud CNJ (ativo) + JUDIT (pronto, aguarda chave) | |
| Agenda | Google Calendar API OAuth2 | Requer config no Google Cloud Console |
| PDF | PDFKit | Geração de apresentações profissionais |
| Jobs | node-cron | Monitoramento processual a cada 6h |
| Testes | Vitest + Testing Library | |
| Containers | Docker + docker-compose | |
| Deploy alvo | Railway ou Render + PostgreSQL | |

---

## 3. Estrutura do Repositório (Monorepo)

```
parceriza/
├── CLAUDE.md              ← este arquivo
├── package.json           ← workspaces npm (root)
├── docker-compose.yml
├── .env.example
├── server/                ← backend
│   ├── src/
│   │   ├── routes/        ← endpoints Express
│   │   ├── services/      ← lógica de negócio
│   │   ├── middleware/     ← auth JWT, validação Zod
│   │   ├── jobs/          ← cron jobs (node-cron)
│   │   └── lib/           ← clientes externos (Asaas, DataJud, Claude)
│   └── prisma/
│       ├── schema.prisma  ← 30+ tabelas
│       └── seed.ts        ← dados iniciais (JOBs, áreas, tarefas)
└── client/                ← frontend React
    ├── src/
    │   ├── pages/         ← 12 páginas (ver seção 7)
    │   ├── components/    ← design system compartilhado
    │   └── lib/           ← clientes de API, utils
    └── vite.config.ts
```

---

## 4. Banco de Dados — Domínios e Tabelas Principais

O schema Prisma tem 30+ tabelas. Nunca altere uma tabela sem criar migration (`npx prisma migrate dev --name <descricao>`).

| Domínio | Tabelas Principais |
|---|---|
| Auth / Core | `planos`, `advogados` |
| Marketplace | `areas_juridicas`, `jobs_catalogo`, `jobs_ofertas`, `leads` |
| Parcerias | `parcerias`, `avaliacoes`, `teses`, `servicos` |
| Agente IA | `agente_config`, `agente_whatsapp`, `conversas_agente`, `mensagens_agente` |
| Secretária | `agenda_config`, `financeiro_config`, `documentos`, `secretaria_conversas`, `secretaria_mensagens` |
| Retaguarda | `processo_monitores`, `processos`, `agentes_especialistas`, `avaliacoes_agente`, `pacotes_consulta` |
| Tokens | `transacoes`, `saques_token`, `indicacoes_token`, `tarefas_token`, `advogado_tarefas` |
| Parceiros | `token_parceiros`, `regras_token_parceiro`, `historico_token_parceiro` |
| Ads | `anuncios` (com impressões, cliques, CTR, CPC/CPM) |

**Regra:** Enums são implementados como `String` com validação `Zod` na camada de aplicação (compatibilidade com SQLite).

---

## 5. Módulos Funcionais — Visão Rápida

### 5.1 Autenticação JWT
- `POST /api/auth/register` — cadastro com validação OAB única por estado
- `POST /api/auth/login` — retorna JWT
- `GET /api/auth/me` — perfil autenticado
- Senha: bcrypt com 12 rounds

### 5.2 Marketplace de JOBs
- Catálogo curado de JOBs jurídicos por área
- Advogados se habilitam em JOBs ou sugerem novos
- Leads: oportunidades buscando especialistas
- Match: conecta leads a advogados habilitados por área/tese

**JOBs seedados ativos:** Tributário (Transação, ICMS, PIS/COFINS, LC 224/2025), Previdenciário, Consumidor, Societário, Paralegal, Imobiliário

### 5.3 Agente de IA Pessoal (Camada 1)
- Configuração por advogado: nome, personalidade, tom, temperatura (0–1), modelo
- System prompt dinâmico com dados reais do perfil do advogado
- Histórico de conversas persistido no banco
- **Backlog Camada 2:** integração WhatsApp via Evolution API (pós-deploy)

### 5.4 Secretária Multiagente
Três agentes especializados em interface unificada:
- **Agenda:** Google Calendar OAuth2
- **Financeiro:** Asaas API (honorários, Pix/boleto)
- **Controladoria:** Claude API (checklists de documentos por tipo de caso)

### 5.5 Retaguarda Jurídica
- Consulta por número CNJ, CPF ou CNPJ em 5 tribunais simultâneos
- Resumo automático via Claude Haiku
- Monitoramento a cada 6h (node-cron)
- Marketplace de Agentes Especialistas
- Pacotes: Básico (10/mês), Avançado (50/mês), Sob Demanda (20 tokens/consulta)

### 5.6 Tokens PCT (Parceriza Token)
- Economia interna de engajamento
- Formas de obtenção: compra, serviços, referenciamento, conteúdo, avaliações, onboarding
- Usos: IA, Ads, serviços paralegais, funcionalidades premium

### 5.7 Parceriza Ads
- CPC (links patrocinados) e CPM (banners)
- Leilão de posicionamento em tempo real
- Segmentação por área, tese, localidade, perfil

---

## 6. APIs Externas — Contratos e Chaves

| Serviço | Variável de Ambiente | Status |
|---|---|---|
| Anthropic Claude | `ANTHROPIC_API_KEY` | Necessário |
| Google Calendar | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Requer criação no Google Cloud Console |
| Asaas (pagamentos) | `ASAAS_API_KEY` | Usar sandbox: sandbox.asaas.com |
| DataJud CNJ | Gratuito, sem chave | Ativo |
| JUDIT | `JUDIT_API_KEY` + `TRIBUNAL_API_PROVIDER=judit` | Aguarda contratação |
| JWT | `JWT_SECRET` | Gerar: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| Admin | `ADMIN_SECRET` | Trocar antes do deploy |

**Nunca commite o arquivo `.env` real. Use sempre `.env.example` com valores placeholder.**

---

## 7. Páginas do Frontend (12 rotas)

| Rota | Página | Função |
|---|---|---|
| `/` | Home | Landing com hero, métricas, JOBs em destaque |
| `/jobs` | Marketplace | Grid com filtros + Ads Patrocinados |
| `/jobs/:id` | Detalhe do JOB | Advogados habilitados + match |
| `/agente` | Meu Agente | Config de personalidade + chat em tempo real |
| `/secretaria` | Secretária | 3 abas: Agenda / Financeiro / Controladoria |
| `/juridico` | Retaguarda | 3 abas: Consultar / Monitorar / Especialistas |
| `/tokens` | Tokens PCT | Saldo, pacotes, compra, extrato, saque |
| `/conquistas` | Conquistas | Gamificação, ranking, parceiros |
| `/ads` | Meus Anúncios | Criação, métricas, CTR, status |
| `/perfil/apresentacao` | Apresentação | Gerador de PDF profissional (500 tokens) |
| `/login` | Login | JWT → localStorage |
| `*` | 404 | Página not found personalizada |

---

## 8. Design System

- Variáveis CSS para cores, sombras e border-radius — não usar valores hardcoded
- Responsivo para mobile (breakpoint 640px)
- Componentes: cards, badges, filtros, toggles, tabelas, modais, chats, calendário
- NavBar com badge de saldo PCT em tempo real
- Anúncios Patrocinados: borda dourada + badge discreto

---

## 9. Convenções de Código

- **TypeScript strict mode** — sem `any` implícito
- **Zod** para validação de entrada em todos os endpoints
- **Prisma transactions** para operações que tocam múltiplas tabelas
- **Separação de camadas:** route → middleware → service → repository (via Prisma)
- Erros: sempre retornar `{ error: string, code?: string }` com status HTTP correto
- Logs: usar prefixos `[AUTH]`, `[JOB]`, `[TOKEN]`, `[IA]`, `[CRON]` para facilitar filtragem
- Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `test:` (Conventional Commits)

---

## 10. Pendências Críticas de Pré-Deploy

Execute esta checklist antes de qualquer deploy em produção:

- [ ] Criar projeto Google Cloud Console e configurar OAuth2 (Calendar)
- [ ] Criar conta Asaas sandbox e obter `ASAAS_API_KEY`
- [ ] Contratar JUDIT e configurar `JUDIT_API_KEY`
- [ ] Gerar `JWT_SECRET` forte (48 bytes)
- [ ] Trocar `ADMIN_SECRET` para valor seguro
- [ ] Instalar Docker Desktop para PostgreSQL em produção
- [ ] Configurar variáveis de ambiente no Railway/Render
- [ ] Rodar `npx prisma migrate deploy` no ambiente de produção
- [ ] Rodar `npx prisma db seed` para dados iniciais

---

## 11. Backlog Estratégico (não implementar sem instrução explícita)

- Canal B2C: plataforma separada para oferta de JOBs a clientes finais
- WhatsApp Camada 2: Evolution API pós-deploy
- Apresentação para Instagram/LinkedIn: imagens quadradas/retangulares
- Curadoria IA: agente para aprovação de novos JOBs
- App Mobile: React Native
- Dashboard Analytics: métricas de conversão e engajamento

---

## 12. Regras de Comportamento do Agente

1. **Nunca altere schema do banco sem criar migration nomeada.**
2. **Nunca hardcode credenciais** — sempre usar variáveis de ambiente via `.env`.
3. **Antes de criar qualquer novo endpoint**, verifique se já existe rota similar em `server/src/routes/`.
4. **Ao integrar Claude API**, sempre use ZDR (Zero Data Retention) para dados sensíveis de clientes.
5. **Ao modificar o sistema de tokens PCT**, recalcule o impacto na tabela `transacoes` e nos saldos dos advogados.
6. **Pergunte antes de deletar** qualquer tabela, migration ou arquivo de seed.
7. **Ao trabalhar em Ads**, lembre que o sistema é leilão em tempo real — qualquer mudança na lógica de ranking afeta o faturamento.
8. Quando em dúvida sobre regra de negócio jurídica ou ética da OAB, **pare e pergunte ao humano**.
