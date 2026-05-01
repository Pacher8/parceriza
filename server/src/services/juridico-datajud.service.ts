import axios from 'axios';
import { env } from '../config/env.js';

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
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) return [];
      throw new Error(`DataJud: ${err.response?.data?.error ?? err.message}`);
    }
    throw err;
  }
}

export async function buscarPorDocumento(documento: string, tribunal = 'tjsc'): Promise<DataJudProcesso[]> {
  const client = getDataJudClient();
  try {
    const res = await client.post<DataJudResponse>(tribunalEndpoint(tribunal), queryByDocumento(documento));
    return (res.data.hits?.hits ?? []).map((h) => h._source);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) return [];
      throw new Error(`DataJud: ${err.response?.data?.error ?? err.message}`);
    }
    throw err;
  }
}

// Search across multiple common tribunals when none specified
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
