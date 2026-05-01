-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_anuncios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "modelo" TEXT NOT NULL,
    "valorLance" DECIMAL NOT NULL DEFAULT 0,
    "orcamentoTotal" DECIMAL NOT NULL DEFAULT 0,
    "gastoAcumulado" DECIMAL NOT NULL DEFAULT 0,
    "impressoes" INTEGER NOT NULL DEFAULT 0,
    "cliques" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "inicioEm" DATETIME,
    "fimEm" DATETIME,
    "posicionamento" TEXT NOT NULL DEFAULT 'BANNER_BUSCA',
    "tokensLance" INTEGER NOT NULL DEFAULT 0,
    "orcamentoTokens" INTEGER NOT NULL DEFAULT 0,
    "gastoTokens" INTEGER NOT NULL DEFAULT 0,
    "advogadoId" TEXT NOT NULL,
    "jobId" TEXT,
    "areaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "anuncios_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "anuncios_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs_catalogo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "anuncios_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas_juridicas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_anuncios" ("advogadoId", "cliques", "createdAt", "descricao", "fimEm", "gastoAcumulado", "id", "impressoes", "inicioEm", "mediaUrl", "modelo", "orcamentoTotal", "status", "titulo", "updatedAt", "valorLance") SELECT "advogadoId", "cliques", "createdAt", "descricao", "fimEm", "gastoAcumulado", "id", "impressoes", "inicioEm", "mediaUrl", "modelo", "orcamentoTotal", "status", "titulo", "updatedAt", "valorLance" FROM "anuncios";
DROP TABLE "anuncios";
ALTER TABLE "new_anuncios" RENAME TO "anuncios";
CREATE INDEX "anuncios_advogadoId_status_idx" ON "anuncios"("advogadoId", "status");
CREATE INDEX "anuncios_status_posicionamento_idx" ON "anuncios"("status", "posicionamento");
CREATE INDEX "anuncios_jobId_idx" ON "anuncios"("jobId");
CREATE INDEX "anuncios_areaId_idx" ON "anuncios"("areaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
