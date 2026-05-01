-- CreateTable
CREATE TABLE "secretaria_conversas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modulo" TEXT NOT NULL,
    "clienteNome" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "advogadoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "secretaria_conversas_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "secretaria_mensagens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "papel" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tokensUsados" INTEGER,
    "conversaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "secretaria_mensagens_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "secretaria_conversas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "secretaria_conversas_advogadoId_modulo_idx" ON "secretaria_conversas"("advogadoId", "modulo");

-- CreateIndex
CREATE INDEX "secretaria_mensagens_conversaId_createdAt_idx" ON "secretaria_mensagens"("conversaId", "createdAt");
