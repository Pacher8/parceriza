import axios from 'axios';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';

// ── DataJud Elasticsearch response types ──────────────────────────────────────

export type DataJudParte = {
  polo: string;
  nome: string;
  numeroDocumentoPrincipal?: string;
  tipoPessoa?: string;
};

export type DataJudMovimento = {
  codigo?: number;
  nome: string;
  dataHora: string;
  complemento?: string;
};

export type DataJudProcesso = {
  numeroProcesso: string;
  tribunal?: string;
  grau?: string;
  dataAjuizamento?: string;
  classe?: { codigo?: number; nome: string };
  assuntos?: { codigo?: number; nome: string }[];
  orgaoJulgador?: { codigo?: number; nome: string; codigoMunicipioIBGE?: number };
  partes?: DataJudParte[];
  movimentos?: DataJudMovimento[];
  nivelSigilo?: number;
  formato?: { nome: string };
};

type DataJudHit = { _id: string; _source: DataJudProcesso };

type DataJudResponse = {
  hits: {
    total: { value: number };
    hits: DataJudHit[];
  };
};

// ── Error helpers ─────────────────────────────────────────────────────────────

function extractErrorReason(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Erro desconhecido';
  const d = data as Record<string, unknown>;
  const err = d.error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    // Elasticsearch root_cause
    const rootCause = Array.isArray(e.root_cause) ? e.root_cause[0] : null;
    if (rootCause && typeof rootCause === 'object') {
      const rc = rootCause as Record<string, unknown>;
      if (typeof rc.reason === 'string') return rc.reason;
    }
    if (typeof e.reason === 'string') return e.reason;
    if (typeof e.type === 'string') return e.type;
    return JSON.stringify(err);
  }
  if (typeof d.message === 'string') return d.message;
  return JSON.stringify(data);
}

function mapDataJudError(err: unknown, tribunal: string, tipo: 'documento' | 'numero'): never {
  if (!axios.isAxiosError(err)) throw err;
  const status = err.response?.status;
  const reason = extractErrorReason(err.response?.data);

  if (status === 404) {
    throw new HttpError(404, 'Nenhum processo encontrado');
  }
  if (status === 400) {
    if (tipo === 'documento') {
      throw new HttpError(422, `Tribunal ${tribunal.toUpperCase()} não suporta busca por CPF/CNPJ — tente pelo número CNJ`);
    }
    throw new HttpError(422, `Consulta inválida para ${tribunal.toUpperCase()}: ${reason}`);
  }
  if (status === 401 || status === 403) {
    throw new HttpError(502, 'Chave DataJud inválida ou sem permissão');
  }
  if (status === 503 || status === 504 || !status) {
    throw new HttpError(503, 'Serviço do DataJud temporariamente indisponível — tente novamente em instantes');
  }
  throw new HttpError(502, `DataJud (${status ?? 'sem resposta'}): ${reason}`);
}

// ── HTTP client ───────────────────────────────────────────────────────────────

function getDataJudClient() {
  return axios.create({
    baseURL: env.DATAJUD_BASE_URL,
    headers: {
      Authorization: `ApiKey ${env.DATAJUD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });
}

// The DataJud API uses Elasticsearch at: /api_publica_{tribunal}/_search
function tribunalEndpoint(tribunal: string): string {
  return `/api_publica_${tribunal.toLowerCase()}/_search`;
}

// ── Queries ───────────────────────────────────────────────────────────────────

const SOURCE_FIELDS = ['numeroProcesso', 'tribunal', 'grau', 'classe', 'assuntos', 'orgaoJulgador', 'partes', 'movimentos', 'dataAjuizamento', 'nivelSigilo'];

function formatNumero(n: string) {
  const digits = n.replace(/\D/g, '');
  return digits.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6') || n;
}

function queryByNumero(numero: string) {
  return {
    query: { match: { numeroProcesso: formatNumero(numero) } },
    size: 5,
    _source: SOURCE_FIELDS,
  };
}

function queryByDocumento(documento: string) {
  const doc = documento.replace(/\D/g, '');
  return {
    query: { match: { 'partes.numeroDocumentoPrincipal': doc } },
    size: 10,
    _source: SOURCE_FIELDS,
  };
}

export type FiltrosConsulta = {
  numero?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  nomeParte?: string | null;
  nomeAdvogado?: string | null;
  classe?: string | null;
  assunto?: string | null;
  vara?: string | null;
  grau?: string | null;
  polo?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
};

function buildBoolQuery(f: FiltrosConsulta) {
  const must: object[] = [];
  const filter: object[] = [];

  if (f.numero) {
    must.push({ match: { numeroProcesso: formatNumero(f.numero) } });
  }

  if (f.cpf || f.cnpj) {
    const doc = (f.cpf ?? f.cnpj!).replace(/\D/g, '');
    must.push({ match: { 'partes.numeroDocumentoPrincipal': doc } });
  }

  if (f.nomeParte) {
    must.push({ match: { 'partes.nome': { query: f.nomeParte, operator: 'and' } } });
  }

  if (f.nomeAdvogado) {
    must.push({ match: { 'partes.nome': { query: f.nomeAdvogado, operator: 'and' } } });
  }

  if (f.polo) {
    filter.push({ term: { 'partes.polo': f.polo } });
  }

  if (f.classe) {
    must.push({ match: { 'classe.nome': { query: f.classe, operator: 'or' } } });
  }

  if (f.assunto) {
    must.push({ match: { 'assuntos.nome': { query: f.assunto, operator: 'or' } } });
  }

  if (f.vara) {
    must.push({ match: { 'orgaoJulgador.nome': { query: f.vara, operator: 'and' } } });
  }

  if (f.grau) {
    filter.push({ term: { grau: f.grau } });
  }

  if (f.dataInicio || f.dataFim) {
    const range: Record<string, string> = {};
    if (f.dataInicio) range.gte = f.dataInicio.replace(/-/g, '') + '000000';
    if (f.dataFim)    range.lte = f.dataFim.replace(/-/g, '')   + '235959';
    filter.push({ range: { dataAjuizamento: range } });
  }

  const query =
    must.length === 0 && filter.length === 0
      ? { match_all: {} }
      : { bool: { ...(must.length ? { must } : {}), ...(filter.length ? { filter } : {}) } };

  return { query, size: 20, _source: SOURCE_FIELDS };
}

// ── Public functions ──────────────────────────────────────────────────────────

export async function buscarPorNumero(numero: string, tribunal = 'tjsc'): Promise<DataJudProcesso[]> {
  const client = getDataJudClient();
  try {
    const res = await client.post<DataJudResponse>(tribunalEndpoint(tribunal), queryByNumero(numero));
    return (res.data.hits?.hits ?? []).map((h) => h._source);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    mapDataJudError(err, tribunal, 'numero');
  }
}

export async function buscarPorDocumento(documento: string, tribunal = 'tjsc'): Promise<DataJudProcesso[]> {
  const client = getDataJudClient();
  try {
    const res = await client.post<DataJudResponse>(tribunalEndpoint(tribunal), queryByDocumento(documento));
    return (res.data.hits?.hits ?? []).map((h) => h._source);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    mapDataJudError(err, tribunal, 'documento');
  }
}

export async function buscarComFiltros(filtros: FiltrosConsulta, tribunal: string): Promise<DataJudProcesso[]> {
  const client = getDataJudClient();
  const body = buildBoolQuery(filtros);
  try {
    const res = await client.post<DataJudResponse>(tribunalEndpoint(tribunal), body);
    return (res.data.hits?.hits ?? []).map((h) => h._source);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    mapDataJudError(err, tribunal, 'numero');
  }
}

// Search across multiple tribunals simultaneously; silently skips failures
export async function buscarMultiTribunal(
  filtros: FiltrosConsulta,
  tribunais = ['tjsc', 'tjsp', 'tjrj', 'tjmg', 'tjrs', 'tjpr', 'tjba', 'tjce'],
): Promise<DataJudProcesso[]> {
  const results = await Promise.all(
    tribunais.map((t) => buscarComFiltros(filtros, t).catch(() => [] as DataJudProcesso[])),
  );
  return results.flat();
}

// TRF-specific: some federal courts require different field mapping
export async function buscarPorDocumentoTRF(documento: string, tribunal: string): Promise<DataJudProcesso[]> {
  const client = getDataJudClient();
  const doc = documento.replace(/\D/g, '');

  // TRFs use flat structure — no nested mapping for partes
  const queries = [
    { query: { match: { 'partes.numeroDocumentoPrincipal': doc } }, size: 10 },
  ];

  for (const q of queries) {
    try {
      const res = await client.post<DataJudResponse>(tribunalEndpoint(tribunal), {
        ...q,
        _source: ['numeroProcesso', 'tribunal', 'grau', 'classe', 'assuntos', 'orgaoJulgador', 'partes', 'movimentos', 'dataAjuizamento'],
      });
      const hits = res.data.hits?.hits ?? [];
      if (hits.length > 0) return hits.map((h) => h._source);
    } catch {
      // try next query variant
    }
  }
  return [];
}

export function mapToProcesso(p: DataJudProcesso) {
  return {
    numeroProcesso: p.numeroProcesso,
    tribunal: p.tribunal ?? p.orgaoJulgador?.nome ?? null,
    vara: p.orgaoJulgador?.nome ?? null,
    classe: p.classe?.nome ?? null,
    assunto: p.assuntos?.[0]?.nome ?? null,
    status: 'ATIVO' as const,
    partes: JSON.stringify(p.partes ?? []),
    movimentacoes: JSON.stringify(p.movimentos ?? []),
  };
}
