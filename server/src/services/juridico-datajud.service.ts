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
      Authorization: `APIKey ${env.DATAJUD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });
}

// The DataJud API uses Elasticsearch at: /api_publica-{tribunal}/_search
function tribunalEndpoint(tribunal: string): string {
  return `/api_publica-${tribunal.toLowerCase()}/_search`;
}

// ── Queries ───────────────────────────────────────────────────────────────────

function queryByNumero(numero: string) {
  return {
    query: { match: { numeroProcesso: numero.replace(/\D/g, '').replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6') || numero } },
    size: 5,
    _source: ['numeroProcesso', 'tribunal', 'grau', 'classe', 'assuntos', 'orgaoJulgador', 'partes', 'movimentos', 'dataAjuizamento', 'nivelSigilo'],
  };
}

function queryByDocumento(documento: string) {
  const doc = documento.replace(/\D/g, '');
  return {
    query: {
      nested: {
        path: 'partes',
        query: { match: { 'partes.numeroDocumentoPrincipal': doc } },
      },
    },
    size: 10,
    _source: ['numeroProcesso', 'tribunal', 'grau', 'classe', 'assuntos', 'orgaoJulgador', 'partes', 'movimentos', 'dataAjuizamento'],
  };
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

// Search across multiple common tribunals when none specified
// Silently skips tribunals that fail (unsupported query, timeout, etc.)
export async function buscarMultiTribunal(
  query: { numero?: string; documento?: string },
  tribunais = ['tjsc', 'tjsp', 'tjrj', 'tjmg', 'tjrs'],
): Promise<DataJudProcesso[]> {
  const searches = tribunais.map((t) =>
    query.numero
      ? buscarPorNumero(query.numero, t).catch(() => [] as DataJudProcesso[])
      : buscarPorDocumento(query.documento!, t).catch(() => [] as DataJudProcesso[]),
  );
  const results = await Promise.all(searches);
  return results.flat();
}

// TRF-specific: some federal courts require different field mapping
export async function buscarPorDocumentoTRF(documento: string, tribunal: string): Promise<DataJudProcesso[]> {
  const client = getDataJudClient();
  const doc = documento.replace(/\D/g, '');

  // TRFs may index CPF under different field paths — try both
  const queries = [
    // Standard nested path
    { query: { nested: { path: 'partes', query: { match: { 'partes.numeroDocumentoPrincipal': doc } } } }, size: 10 },
    // Some TRFs use a flat structure
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
