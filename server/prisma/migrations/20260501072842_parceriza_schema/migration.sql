/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "users";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DECIMAL NOT NULL,
    "descricao" TEXT,
    "limiteServicos" INTEGER,
    "limiteAnuncios" INTEGER,
    "bonusTokens" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "advogados" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "oab" TEXT NOT NULL,
    "oabUf" TEXT NOT NULL,
    "telefone" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "saldoTokens" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "planoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "advogados_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "area" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "criadorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teses_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "advogados" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "advogadoId" TEXT NOT NULL,
    "teseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "servicos_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "servicos_teseId_fkey" FOREIGN KEY ("teseId") REFERENCES "teses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parcerias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comissaoPct" REAL NOT NULL,
    "valorAcordado" DECIMAL,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "advogadoOrigemId" TEXT NOT NULL,
    "advogadoDestinoId" TEXT NOT NULL,
    "servicoId" TEXT,
    "aceitaEm" DATETIME,
    "finalizadaEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parcerias_advogadoOrigemId_fkey" FOREIGN KEY ("advogadoOrigemId") REFERENCES "advogados" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "parcerias_advogadoDestinoId_fkey" FOREIGN KEY ("advogadoDestinoId") REFERENCES "advogados" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "parcerias_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "servicoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avaliacoes_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servicos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "advogados" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "descricao" TEXT,
    "referenciaId" TEXT,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transacoes_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "anuncios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "modelo" TEXT NOT NULL,
    "valorLance" DECIMAL NOT NULL,
    "orcamentoTotal" DECIMAL NOT NULL,
    "gastoAcumulado" DECIMAL NOT NULL DEFAULT 0,
    "impressoes" INTEGER NOT NULL DEFAULT 0,
    "cliques" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "inicioEm" DATETIME,
    "fimEm" DATETIME,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "anuncios_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agente_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL DEFAULT 'Assistente',
    "personalidade" TEXT,
    "tomDeVoz" TEXT,
    "temperatura" REAL NOT NULL DEFAULT 0.7,
    "promptSistema" TEXT,
    "modelo" TEXT NOT NULL DEFAULT 'CLAUDE_SONNET',
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agente_config_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agente_whatsapp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroTelefone" TEXT,
    "statusConexao" TEXT NOT NULL DEFAULT 'DESCONECTADO',
    "sessionData" TEXT,
    "ultimoQrEm" DATETIME,
    "ultimaConexaoEm" DATETIME,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agente_whatsapp_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agenda_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleCalendarId" TEXT,
    "fusoHorario" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "horariosDisponiveis" TEXT,
    "conectadoEm" DATETIME,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agenda_config_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financeiro_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pixChave" TEXT,
    "contaBancaria" TEXT,
    "tabelaHonorarios" TEXT,
    "regrasCobranca" TEXT,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "financeiro_config_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "urlArmazenamento" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
    "resumoIA" TEXT,
    "metadados" TEXT,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documentos_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "processo_monitores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documento" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "nomeMonitorado" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaVerificacaoEm" DATETIME,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "processo_monitores_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroProcesso" TEXT NOT NULL,
    "tribunal" TEXT,
    "vara" TEXT,
    "classe" TEXT,
    "assunto" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DESCONHECIDO',
    "partes" TEXT,
    "movimentacoes" TEXT,
    "resumoIA" TEXT,
    "ultimaAtualizacaoEm" DATETIME,
    "monitorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "processos_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "processo_monitores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agentes_especialistas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "promptSistema" TEXT NOT NULL,
    "exemplos" TEXT,
    "precoTokens" INTEGER NOT NULL DEFAULT 0,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "aprovado" BOOLEAN NOT NULL DEFAULT false,
    "totalUsos" INTEGER NOT NULL DEFAULT 0,
    "criadorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agentes_especialistas_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacoes_agente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "agenteId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avaliacoes_agente_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "agentes_especialistas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_agente_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "advogados" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "planos_codigo_key" ON "planos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "advogados_email_key" ON "advogados"("email");

-- CreateIndex
CREATE INDEX "advogados_oabUf_idx" ON "advogados"("oabUf");

-- CreateIndex
CREATE INDEX "advogados_nome_idx" ON "advogados"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "advogados_oab_oabUf_key" ON "advogados"("oab", "oabUf");

-- CreateIndex
CREATE INDEX "teses_area_idx" ON "teses"("area");

-- CreateIndex
CREATE INDEX "teses_titulo_idx" ON "teses"("titulo");

-- CreateIndex
CREATE INDEX "servicos_advogadoId_ativo_idx" ON "servicos"("advogadoId", "ativo");

-- CreateIndex
CREATE INDEX "servicos_teseId_ativo_idx" ON "servicos"("teseId", "ativo");

-- CreateIndex
CREATE INDEX "parcerias_advogadoOrigemId_status_idx" ON "parcerias"("advogadoOrigemId", "status");

-- CreateIndex
CREATE INDEX "parcerias_advogadoDestinoId_status_idx" ON "parcerias"("advogadoDestinoId", "status");

-- CreateIndex
CREATE INDEX "parcerias_status_idx" ON "parcerias"("status");

-- CreateIndex
CREATE INDEX "avaliacoes_servicoId_idx" ON "avaliacoes"("servicoId");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_servicoId_autorId_key" ON "avaliacoes"("servicoId", "autorId");

-- CreateIndex
CREATE INDEX "transacoes_advogadoId_createdAt_idx" ON "transacoes"("advogadoId", "createdAt");

-- CreateIndex
CREATE INDEX "transacoes_origem_idx" ON "transacoes"("origem");

-- CreateIndex
CREATE INDEX "anuncios_advogadoId_status_idx" ON "anuncios"("advogadoId", "status");

-- CreateIndex
CREATE INDEX "anuncios_status_modelo_idx" ON "anuncios"("status", "modelo");

-- CreateIndex
CREATE UNIQUE INDEX "agente_config_advogadoId_key" ON "agente_config"("advogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "agente_whatsapp_advogadoId_key" ON "agente_whatsapp"("advogadoId");

-- CreateIndex
CREATE INDEX "agente_whatsapp_statusConexao_idx" ON "agente_whatsapp"("statusConexao");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_config_advogadoId_key" ON "agenda_config"("advogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "financeiro_config_advogadoId_key" ON "financeiro_config"("advogadoId");

-- CreateIndex
CREATE INDEX "documentos_advogadoId_status_idx" ON "documentos"("advogadoId", "status");

-- CreateIndex
CREATE INDEX "documentos_origem_idx" ON "documentos"("origem");

-- CreateIndex
CREATE INDEX "processo_monitores_advogadoId_ativo_idx" ON "processo_monitores"("advogadoId", "ativo");

-- CreateIndex
CREATE INDEX "processo_monitores_documento_idx" ON "processo_monitores"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "processo_monitores_advogadoId_documento_key" ON "processo_monitores"("advogadoId", "documento");

-- CreateIndex
CREATE INDEX "processos_numeroProcesso_idx" ON "processos"("numeroProcesso");

-- CreateIndex
CREATE INDEX "processos_status_idx" ON "processos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "processos_monitorId_numeroProcesso_key" ON "processos"("monitorId", "numeroProcesso");

-- CreateIndex
CREATE INDEX "agentes_especialistas_area_publico_aprovado_idx" ON "agentes_especialistas"("area", "publico", "aprovado");

-- CreateIndex
CREATE INDEX "agentes_especialistas_criadorId_idx" ON "agentes_especialistas"("criadorId");

-- CreateIndex
CREATE INDEX "agentes_especialistas_nome_idx" ON "agentes_especialistas"("nome");

-- CreateIndex
CREATE INDEX "avaliacoes_agente_agenteId_idx" ON "avaliacoes_agente"("agenteId");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_agente_agenteId_autorId_key" ON "avaliacoes_agente"("agenteId", "autorId");
