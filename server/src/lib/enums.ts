// Constantes que substituem os enums do Prisma (não suportados em SQLite).
// Use nos schemas Zod para validar entrada e na lógica de negócio.

// Valores válidos para o campo Tese.area (renomeado para evitar conflito com o model Prisma AreaJuridica)
export const TeseArea = [
  'TRABALHISTA',
  'CIVIL',
  'CONSUMIDOR',
  'PREVIDENCIARIO',
  'TRIBUTARIO',
  'CRIMINAL',
  'EMPRESARIAL',
  'FAMILIA',
  'IMOBILIARIO',
  'ADMINISTRATIVO',
  'CONSTITUCIONAL',
  'AMBIENTAL',
  'DIGITAL',
  'OUTROS',
] as const;
export type TeseArea = (typeof TeseArea)[number];

export const PlanoTipo = ['STARTER', 'PRO', 'ESCRITORIO'] as const;
export type PlanoTipo = (typeof PlanoTipo)[number];

export const ParceriaStatus = [
  'PENDENTE',
  'ACEITA',
  'RECUSADA',
  'ATIVA',
  'FINALIZADA',
  'CANCELADA',
] as const;
export type ParceriaStatus = (typeof ParceriaStatus)[number];

export const TransacaoTipo = ['CREDITO', 'DEBITO'] as const;
export type TransacaoTipo = (typeof TransacaoTipo)[number];

export const TransacaoOrigem = [
  'COMPRA',
  'BONUS',
  'PAGAMENTO_SERVICO',
  'COMISSAO_PARCERIA',
  'ANUNCIO',
  'REEMBOLSO',
  'AJUSTE',
] as const;
export type TransacaoOrigem = (typeof TransacaoOrigem)[number];

export const AnuncioModelo = ['CPC', 'CPM'] as const;
export type AnuncioModelo = (typeof AnuncioModelo)[number];

export const AnuncioStatus = ['RASCUNHO', 'ATIVO', 'PAUSADO', 'ENCERRADO'] as const;
export type AnuncioStatus = (typeof AnuncioStatus)[number];

export const ModeloIA = [
  'CLAUDE_OPUS',
  'CLAUDE_SONNET',
  'CLAUDE_HAIKU',
  'GPT_4',
  'GEMINI',
] as const;
export type ModeloIA = (typeof ModeloIA)[number];

export const WhatsappStatus = [
  'DESCONECTADO',
  'AGUARDANDO_QR',
  'CONECTADO',
  'ERRO',
  'EXPIRADO',
] as const;
export type WhatsappStatus = (typeof WhatsappStatus)[number];

export const DocumentoOrigem = ['WHATSAPP', 'UPLOAD', 'EMAIL', 'API'] as const;
export type DocumentoOrigem = (typeof DocumentoOrigem)[number];

export const DocumentoStatus = ['RECEBIDO', 'PROCESSANDO', 'PROCESSADO', 'ERRO'] as const;
export type DocumentoStatus = (typeof DocumentoStatus)[number];

export const TipoDocumentoMonitor = ['CPF', 'CNPJ'] as const;
export type TipoDocumentoMonitor = (typeof TipoDocumentoMonitor)[number];

export const ProcessoStatus = [
  'ATIVO',
  'ARQUIVADO',
  'SUSPENSO',
  'TRANSITADO_JULGADO',
  'DESCONHECIDO',
] as const;
export type ProcessoStatus = (typeof ProcessoStatus)[number];

export const JobTipo = ['JUDICIAL', 'ADMINISTRATIVO', 'AMBOS'] as const;
export type JobTipo = (typeof JobTipo)[number];

export const LeadStatus = ['ABERTO', 'EM_NEGOCIACAO', 'FECHADO', 'CANCELADO'] as const;
export type LeadStatus = (typeof LeadStatus)[number];
