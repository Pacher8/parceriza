-- CreateTable
CREATE TABLE "pacotes_consulta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "consultasMes" INTEGER NOT NULL,
    "precoTokens" INTEGER NOT NULL,
    "planoMinimo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
