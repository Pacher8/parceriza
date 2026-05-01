import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const planos = [
  {
    codigo: 'STARTER',
    nome: 'Starter',
    preco: 0,
    descricao: 'Plano gratuito para começar. Ideal para advogados autônomos dando os primeiros passos.',
    limiteServicos: 3,
    limiteAnuncios: 1,
    bonusTokens: 100,
  },
  {
    codigo: 'PRO',
    nome: 'Pro',
    preco: 97,
    descricao: 'Para advogados que querem crescer. IA avançada, mais serviços e anúncios.',
    limiteServicos: 20,
    limiteAnuncios: 5,
    bonusTokens: 500,
  },
  {
    codigo: 'ESCRITORIO',
    nome: 'Escritório',
    preco: 297,
    descricao: 'Para escritórios e equipes. Serviços e anúncios ilimitados com máximo de tokens.',
    limiteServicos: null,
    limiteAnuncios: null,
    bonusTokens: 2000,
  },
];

async function main() {
  console.log('Seeding planos...');
  for (const plano of planos) {
    const result = await prisma.plano.upsert({
      where: { codigo: plano.codigo },
      update: {},
      create: plano,
    });
    console.log(`  [${result.codigo}] ${result.nome} — R$ ${result.preco}`);
  }
  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
