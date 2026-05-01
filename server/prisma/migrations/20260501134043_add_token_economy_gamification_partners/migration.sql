-- CreateTable
CREATE TABLE "tarefas_token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "recompensaTokens" INTEGER NOT NULL,
    "icone" TEXT NOT NULL DEFAULT '🎯',
    "condicao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "repeticao" TEXT NOT NULL DEFAULT 'UNICA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "advogado_tarefas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "completadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokensGanhos" INTEGER NOT NULL,
    "advogadoId" TEXT NOT NULL,
    "tarefaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "advogado_tarefas_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "advogado_tarefas_tarefaId_fkey" FOREIGN KEY ("tarefaId") REFERENCES "tarefas_token" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "indicacoes_token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "tokensCreditos" INTEGER,
    "codigoIndicacao" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "indicadoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "indicacoes_token_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "advogados" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "indicacoes_token_indicadoId_fkey" FOREIGN KEY ("indicadoId") REFERENCES "advogados" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saques_token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantidadeTokens" INTEGER NOT NULL,
    "valorReais" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
    "pixChave" TEXT NOT NULL,
    "asaasTransferId" TEXT,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "saques_token_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "token_parceiros" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "logoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT NOT NULL,
    "chaveApi" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "regras_token_parceiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tokensRecompensa" INTEGER NOT NULL,
    "limiteUsosPorAdvogado" INTEGER,
    "limiteUsosTotal" INTEGER,
    "totalUsado" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "validoAte" DATETIME,
    "condicaoJson" TEXT,
    "parceiroId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "regras_token_parceiro_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "token_parceiros" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historico_token_parceiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokensCreditos" INTEGER NOT NULL,
    "comprovanteJson" TEXT,
    "advogadoId" TEXT NOT NULL,
    "regraId" TEXT NOT NULL,
    "parceiroId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historico_token_parceiro_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "historico_token_parceiro_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "regras_token_parceiro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "historico_token_parceiro_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "token_parceiros" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "tarefas_token_tipo_ativo_idx" ON "tarefas_token"("tipo", "ativo");

-- CreateIndex
CREATE INDEX "tarefas_token_categoria_idx" ON "tarefas_token"("categoria");

-- CreateIndex
CREATE INDEX "advogado_tarefas_advogadoId_completadaEm_idx" ON "advogado_tarefas"("advogadoId", "completadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "advogado_tarefas_advogadoId_tarefaId_key" ON "advogado_tarefas"("advogadoId", "tarefaId");

-- CreateIndex
CREATE UNIQUE INDEX "indicacoes_token_codigoIndicacao_key" ON "indicacoes_token"("codigoIndicacao");

-- CreateIndex
CREATE INDEX "indicacoes_token_indicadorId_idx" ON "indicacoes_token"("indicadorId");

-- CreateIndex
CREATE INDEX "saques_token_advogadoId_status_idx" ON "saques_token"("advogadoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "token_parceiros_slug_key" ON "token_parceiros"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "token_parceiros_chaveApi_key" ON "token_parceiros"("chaveApi");

-- CreateIndex
CREATE INDEX "regras_token_parceiro_parceiroId_ativo_idx" ON "regras_token_parceiro"("parceiroId", "ativo");

-- CreateIndex
CREATE INDEX "historico_token_parceiro_advogadoId_createdAt_idx" ON "historico_token_parceiro"("advogadoId", "createdAt");

-- CreateIndex
CREATE INDEX "historico_token_parceiro_parceiroId_idx" ON "historico_token_parceiro"("parceiroId");
