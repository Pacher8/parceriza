-- CreateTable
CREATE TABLE "conversas_agente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canal" TEXT NOT NULL DEFAULT 'TESTE',
    "clienteNome" TEXT,
    "clienteIdentificador" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversas_agente_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mensagens_agente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "papel" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tokensUsados" INTEGER,
    "conversaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mensagens_agente_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas_agente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "conversas_agente_advogadoId_ativo_idx" ON "conversas_agente"("advogadoId", "ativo");

-- CreateIndex
CREATE INDEX "conversas_agente_canal_idx" ON "conversas_agente"("canal");

-- CreateIndex
CREATE INDEX "mensagens_agente_conversaId_createdAt_idx" ON "mensagens_agente"("conversaId", "createdAt");
