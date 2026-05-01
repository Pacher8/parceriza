import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Planos ──────────────────────────────────────────────────────────────────

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

// ── Áreas Jurídicas ──────────────────────────────────────────────────────────

const areas = [
  { nome: 'Tributário',      slug: 'tributario',     ordem: 1, descricao: 'Planejamento tributário, contencioso fiscal e recuperação de créditos.' },
  { nome: 'Previdenciário',  slug: 'previdenciario',  ordem: 2, descricao: 'Benefícios do INSS, revisões e planejamento previdenciário.' },
  { nome: 'Consumidor',      slug: 'consumidor',      ordem: 3, descricao: 'Defesa do consumidor, revisão contratual e superendividamento.' },
  { nome: 'Administrativo',  slug: 'administrativo',  ordem: 4, descricao: 'Licitações, contratos administrativos e direito público.' },
  { nome: 'Societário',      slug: 'societario',      ordem: 5, descricao: 'Constituição empresarial, M&A, dissolução e acordos de sócios.' },
  { nome: 'Trabalhista',     slug: 'trabalhista',     ordem: 6, descricao: 'Contencioso trabalhista, compliance e consultoria de RH.' },
  { nome: 'Ambiental',       slug: 'ambiental',       ordem: 7, descricao: 'Licenciamento, passivo ambiental e ESG jurídico.' },
  { nome: 'Civil',           slug: 'civil',           ordem: 8, descricao: 'Contratos, responsabilidade civil e direito de família.' },
];

// ── JOBs do Catálogo (por área) ──────────────────────────────────────────────

type JobSeed = { titulo: string; descricao: string; tipo: string };

const jobsPorArea: Record<string, JobSeed[]> = {
  tributario: [
    {
      titulo: 'Transação Tributária Federal',
      tipo: 'ADMINISTRATIVO',
      descricao: 'Negociação de débitos tributários federais junto à PGFN/RFB.',
    },
    {
      titulo: 'Exclusão do ICMS da Base do PIS/COFINS (Tese do Século)',
      tipo: 'JUDICIAL',
      descricao: 'Ação de repetição de indébito para recuperação de valores pagos indevidamente.',
    },
    {
      titulo: 'Adicional de 10% IRPJ Lucro Presumido — LC 224/2025',
      tipo: 'JUDICIAL',
      descricao:
        'Mandado de Segurança Preventivo ou Ação Declaratória para afastar a inconstitucionalidade do adicional de 10% ao IRPJ trimestral instituído pela LC 224/2025. Tese com alta demanda e inconstitucionalidade formal e material.',
    },
  ],
  previdenciario: [
    {
      titulo: 'Revisão da Vida Toda',
      tipo: 'JUDICIAL',
      descricao: 'Ação de revisão de benefício previdenciário com inclusão de todo o histórico contributivo anterior a 1994.',
    },
    {
      titulo: 'Aposentadoria por Invalidez / BPC',
      tipo: 'JUDICIAL',
      descricao: 'Concessão ou revisão de aposentadoria por incapacidade permanente e Benefício de Prestação Continuada.',
    },
    {
      titulo: 'Planejamento Previdenciário',
      tipo: 'ADMINISTRATIVO',
      descricao: 'Análise e estratégia para antecipação ou otimização da aposentadoria junto ao INSS.',
    },
  ],
  consumidor: [
    {
      titulo: 'Revisão de Contratos Bancários',
      tipo: 'JUDICIAL',
      descricao: 'Revisão de cláusulas abusivas em contratos de crédito, financiamento e cartão de crédito.',
    },
    {
      titulo: 'Superendividamento',
      tipo: 'AMBOS',
      descricao: 'Renegociação e reestruturação de dívidas ao amparo da Lei do Superendividamento (Lei 14.181/2021).',
    },
    {
      titulo: 'Recall e Vícios de Produto',
      tipo: 'AMBOS',
      descricao: 'Responsabilização de fabricantes por vícios ocultos, produtos defeituosos e recall obrigatório.',
    },
  ],
  societario: [
    {
      titulo: 'Constituição e Reestruturação Societária',
      tipo: 'ADMINISTRATIVO',
      descricao: 'Abertura de empresas, transformação, fusão, cisão e incorporação societária.',
    },
    {
      titulo: 'Dissolução e Apuração de Haveres',
      tipo: 'JUDICIAL',
      descricao: 'Dissolução parcial ou total de sociedade com apuração judicial ou extrajudicial de haveres.',
    },
    {
      titulo: 'Acordo de Sócios (SHA)',
      tipo: 'ADMINISTRATIVO',
      descricao: 'Elaboração e revisão de Shareholders Agreement para proteção de sócios minoritários e majoritários.',
    },
  ],
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Planos
  console.log('\nSeeding planos...');
  for (const plano of planos) {
    const result = await prisma.plano.upsert({
      where: { codigo: plano.codigo },
      update: {},
      create: plano,
    });
    console.log(`  [${result.codigo}] ${result.nome} — R$ ${result.preco}`);
  }

  // Áreas
  console.log('\nSeeding áreas jurídicas...');
  const areaMap: Record<string, string> = {};
  for (const area of areas) {
    const result = await prisma.areaJuridica.upsert({
      where: { slug: area.slug },
      update: {},
      create: area,
    });
    areaMap[area.slug] = result.id;
    console.log(`  [${result.slug}] ${result.nome}`);
  }

  // JOBs
  console.log('\nSeeding jobs do catálogo...');
  for (const [slug, jobs] of Object.entries(jobsPorArea)) {
    const areaId = areaMap[slug];
    if (!areaId) continue;
    for (const job of jobs) {
      const existing = await prisma.jobCatalogo.findFirst({
        where: { titulo: job.titulo, areaId },
      });
      if (!existing) {
        await prisma.jobCatalogo.create({ data: { ...job, areaId } });
      }
      console.log(`  [${slug}] ${job.titulo}`);
    }
  }

  // Pacotes de Consulta
  console.log('\nSeeding pacotes de consulta...');
  const pacotes = [
    {
      nome: 'Básico',
      descricao: 'Ideal para advogados autônomos. 10 consultas/mês incluídas no plano Pro.',
      consultasMes: 10,
      precoTokens: 0,
      planoMinimo: 'PRO',
    },
    {
      nome: 'Avançado',
      descricao: 'Para escritórios. 50 consultas/mês incluídas no plano Escritório.',
      consultasMes: 50,
      precoTokens: 0,
      planoMinimo: 'ESCRITORIO',
    },
    {
      nome: 'Sob Demanda',
      descricao: 'Pague apenas o que usar. 1 consulta = 20 tokens.',
      consultasMes: 0,
      precoTokens: 20,
      planoMinimo: 'STARTER',
    },
  ];
  for (const pacote of pacotes) {
    const existing = await prisma.pacoteConsulta.findFirst({ where: { nome: pacote.nome } });
    if (!existing) {
      await prisma.pacoteConsulta.create({ data: pacote });
    }
    console.log(`  [${pacote.nome}] ${pacote.consultasMes} consultas/mês, ${pacote.precoTokens} tokens`);
  }

  console.log('\nSeed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
