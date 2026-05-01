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

  // Áreas e JOBs — Paralegal e Imobiliário
  console.log('\nSeeding áreas Paralegal e Imobiliário...');
  const novasAreas = [
    { nome: 'Paralegal', slug: 'paralegal', ordem: 9, descricao: 'Serviços de apoio jurídico, diligências e suporte processual.' },
    { nome: 'Imobiliário', slug: 'imobiliario', ordem: 10, descricao: 'Assessoria jurídica em negócios imobiliários e regularização de imóveis.' },
  ];
  for (const area of novasAreas) {
    const result = await prisma.areaJuridica.upsert({ where: { slug: area.slug }, update: {}, create: area });
    areaMap[area.slug] = result.id;
    console.log(`  [${result.slug}] ${result.nome}`);
  }

  const novosJobs: Record<string, JobSeed[]> = {
    paralegal: [
      { titulo: 'Diligências em Cartório', tipo: 'ADMINISTRATIVO', descricao: 'Reconhecimento de firma, autenticação, certidões e registros.' },
      { titulo: 'Protocolo e Retirada de Documentos', tipo: 'ADMINISTRATIVO', descricao: 'Protocolo e acompanhamento em órgãos públicos e tribunais.' },
      { titulo: 'Pesquisa Processual Presencial', tipo: 'ADMINISTRATIVO', descricao: 'Consulta física em cartórios e varas judiciais.' },
      { titulo: 'Apostilamento e Autenticação', tipo: 'ADMINISTRATIVO', descricao: 'Apostila de Haia e autenticação de documentos internacionais.' },
      { titulo: 'Intimação e Citação Pessoal', tipo: 'JUDICIAL', descricao: 'Cumprimento de mandados de intimação e citação.' },
    ],
    imobiliario: [
      { titulo: 'Due Diligence Imobiliária', tipo: 'ADMINISTRATIVO', descricao: 'Avaliação completa de restrições, ônus e situação jurídica do imóvel.' },
      { titulo: 'Regularização de Imóvel', tipo: 'ADMINISTRATIVO', descricao: 'Regularização de construções, registros e escrituras.' },
      { titulo: 'Contrato de Compra e Venda', tipo: 'ADMINISTRATIVO', descricao: 'Elaboração e revisão de contratos imobiliários.' },
      { titulo: 'Usucapião', tipo: 'JUDICIAL', descricao: 'Ação de usucapião ordinária, extraordinária ou especial.' },
      { titulo: 'Ação de Despejo', tipo: 'JUDICIAL', descricao: 'Despejo por falta de pagamento ou término de contrato.' },
    ],
  };
  for (const [slug, jobs] of Object.entries(novosJobs)) {
    const areaId = areaMap[slug];
    if (!areaId) continue;
    for (const job of jobs) {
      const existing = await prisma.jobCatalogo.findFirst({ where: { titulo: job.titulo, areaId } });
      if (!existing) await prisma.jobCatalogo.create({ data: { ...job, areaId } });
      console.log(`  [${slug}] ${job.titulo}`);
    }
  }

  // Tarefas de Tokens (Gamificação)
  console.log('\nSeeding tarefas de tokens...');
  const tarefas = [
    // ONBOARDING
    { titulo: 'Complete seu perfil', descricao: 'Adicione foto, bio e suas áreas de atuação', tipo: 'ONBOARDING', categoria: 'PERFIL', recompensaTokens: 20, icone: '🎯', repeticao: 'UNICA' },
    { titulo: 'Cadastre seu primeiro JOB', descricao: 'Ofereça seu primeiro serviço na vitrine da Parceriza', tipo: 'ONBOARDING', categoria: 'JOB', recompensaTokens: 30, icone: '⚖️', repeticao: 'UNICA' },
    { titulo: 'Configure seu Agente', descricao: 'Personalize o nome e personalidade do seu assistente IA', tipo: 'ONBOARDING', categoria: 'PERFIL', recompensaTokens: 25, icone: '🤖', repeticao: 'UNICA' },
    { titulo: 'Faça sua primeira conexão', descricao: 'Solicite ou aceite sua primeira parceria', tipo: 'ONBOARDING', categoria: 'PARCERIA', recompensaTokens: 50, icone: '🤝', repeticao: 'UNICA' },
    { titulo: 'Indique um colega', descricao: 'Convide um advogado para a Parceriza', tipo: 'ONBOARDING', categoria: 'SOCIAL', recompensaTokens: 100, icone: '📣', repeticao: 'UNICA' },
    // SEMANAL
    { titulo: 'Feche 3 JOBs esta semana', descricao: 'Marque 3 leads como fechados em 7 dias', tipo: 'SEMANAL', categoria: 'JOB', recompensaTokens: 150, icone: '🏆', repeticao: 'SEMANAL' },
    { titulo: 'Responda 5 leads disponíveis', descricao: 'Demonstre interesse em 5 oportunidades abertas', tipo: 'SEMANAL', categoria: 'JOB', recompensaTokens: 50, icone: '💬', repeticao: 'SEMANAL' },
    { titulo: 'Avalie um parceiro', descricao: 'Avalie um advogado com quem trabalhou', tipo: 'SEMANAL', categoria: 'SOCIAL', recompensaTokens: 15, icone: '⭐', repeticao: 'SEMANAL' },
    // ESPECIAL
    { titulo: 'Feche uma Transação Tributária', descricao: 'Conclua um JOB de Transação Tributária Federal', tipo: 'ESPECIAL', categoria: 'JOB', recompensaTokens: 200, icone: '💰', repeticao: 'UNICA' },
    { titulo: 'Especialista aprovado', descricao: 'Crie um agente especialista aprovado pela curadoria', tipo: 'ESPECIAL', categoria: 'JOB', recompensaTokens: 300, icone: '🧠', repeticao: 'UNICA' },
    // MENSAL
    { titulo: 'Top Parceiro do Mês', descricao: 'Seja o advogado com mais negócios fechados no mês', tipo: 'MENSAL', categoria: 'SOCIAL', recompensaTokens: 500, icone: '🥇', repeticao: 'MENSAL' },
  ];
  for (const t of tarefas) {
    const existing = await prisma.tarefaToken.findFirst({ where: { titulo: t.titulo } });
    if (!existing) await prisma.tarefaToken.create({ data: t });
    console.log(`  [${t.tipo}] ${t.icone} ${t.titulo} — ${t.recompensaTokens} tokens`);
  }

  // Parceiros de Tokens
  console.log('\nSeeding parceiros de tokens...');
  const parceirosData = [
    {
      nome: 'Parceriza Academy',
      descricao: 'Cursos e webinars jurídicos para advogados modernos.',
      slug: 'parceriza-academy',
      chaveApi: 'pk_academy_parceriza_2026',
      regras: [
        { tipo: 'VISITA_SITE', titulo: 'Assista a um webinar jurídico', descricao: 'Acesse e assista qualquer webinar da Academy', tokensRecompensa: 30 },
        { tipo: 'USO_SERVICO', titulo: 'Conclua um curso', descricao: 'Finalize um curso completo na plataforma', tokensRecompensa: 100 },
      ],
    },
    {
      nome: 'JusContador',
      descricao: 'Contabilidade especializada para advogados e escritórios jurídicos.',
      slug: 'juscontador',
      chaveApi: 'pk_juscontador_2026',
      regras: [
        { tipo: 'VISITA_SITE', titulo: 'Visite nosso site', descricao: 'Acesse o site do JusContador', tokensRecompensa: 10, limiteUsosPorAdvogado: 1 },
        { tipo: 'COMPRA', titulo: 'Abra sua empresa conosco', descricao: 'Contrate a abertura de empresa pelo JusContador', tokensRecompensa: 500 },
      ],
    },
    {
      nome: 'AdvogadoStore',
      descricao: 'Loja de produtos e materiais para profissionais do direito.',
      slug: 'advogado-store',
      chaveApi: 'pk_advstore_2026',
      regras: [
        { tipo: 'COMPRA', titulo: 'Primeira compra', descricao: 'Realize sua primeira compra na AdvogadoStore', tokensRecompensa: 150, limiteUsosPorAdvogado: 1 },
        { tipo: 'CADASTRO', titulo: 'Indique um colega', descricao: 'Seu colega se cadastra na AdvogadoStore', tokensRecompensa: 50 },
      ],
    },
  ];
  for (const p of parceirosData) {
    const { regras, ...parceiroInfo } = p;
    let parceiro = await prisma.tokenParceiro.findUnique({ where: { slug: parceiroInfo.slug } });
    if (!parceiro) {
      parceiro = await prisma.tokenParceiro.create({ data: parceiroInfo });
    }
    console.log(`  ${parceiro.nome}`);
    for (const r of regras) {
      const existeRegra = await prisma.regraTokenParceiro.findFirst({ where: { parceiroId: parceiro.id, titulo: r.titulo } });
      if (!existeRegra) {
        await prisma.regraTokenParceiro.create({ data: { ...r, parceiroId: parceiro.id } });
      }
      console.log(`    → ${r.titulo}: ${r.tokensRecompensa} tokens`);
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
