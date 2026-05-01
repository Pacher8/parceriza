-- CreateTable
CREATE TABLE "areas_juridicas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "jobs_catalogo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "aprovado" BOOLEAN NOT NULL DEFAULT true,
    "areaId" TEXT NOT NULL,
    "sugeridoPorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "jobs_catalogo_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas_juridicas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "jobs_catalogo_sugeridoPorId_fkey" FOREIGN KEY ("sugeridoPorId") REFERENCES "advogados" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jobs_ofertas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricaoCustom" TEXT,
    "valorEstimadoMin" DECIMAL,
    "valorEstimadoMax" DECIMAL,
    "comissaoPct" REAL,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalFechados" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "advogadoId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "jobs_ofertas_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "advogados" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "jobs_ofertas_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs_catalogo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "estadoCliente" TEXT NOT NULL,
    "valorEstimado" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "comissaoAcordada" REAL,
    "jobId" TEXT NOT NULL,
    "advogadoCaptorId" TEXT NOT NULL,
    "advogadoMatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leads_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs_catalogo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leads_advogadoCaptorId_fkey" FOREIGN KEY ("advogadoCaptorId") REFERENCES "advogados" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leads_advogadoMatchId_fkey" FOREIGN KEY ("advogadoMatchId") REFERENCES "advogados" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_juridicas_nome_key" ON "areas_juridicas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "areas_juridicas_slug_key" ON "areas_juridicas"("slug");

-- CreateIndex
CREATE INDEX "areas_juridicas_ativo_ordem_idx" ON "areas_juridicas"("ativo", "ordem");

-- CreateIndex
CREATE INDEX "jobs_catalogo_areaId_ativo_aprovado_idx" ON "jobs_catalogo"("areaId", "ativo", "aprovado");

-- CreateIndex
CREATE INDEX "jobs_catalogo_tipo_idx" ON "jobs_catalogo"("tipo");

-- CreateIndex
CREATE INDEX "jobs_ofertas_jobId_ativo_idx" ON "jobs_ofertas"("jobId", "ativo");

-- CreateIndex
CREATE INDEX "jobs_ofertas_advogadoId_ativo_idx" ON "jobs_ofertas"("advogadoId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_ofertas_advogadoId_jobId_key" ON "jobs_ofertas"("advogadoId", "jobId");

-- CreateIndex
CREATE INDEX "leads_jobId_status_idx" ON "leads"("jobId", "status");

-- CreateIndex
CREATE INDEX "leads_advogadoCaptorId_idx" ON "leads"("advogadoCaptorId");

-- CreateIndex
CREATE INDEX "leads_advogadoMatchId_idx" ON "leads"("advogadoMatchId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");
