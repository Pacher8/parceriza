import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

// ── Auth helpers ──────────────────────────────────────────────────────────────

import { getToken, setToken, clearToken, apiFetch } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Parte = { polo: string; nome: string; numeroDocumentoPrincipal?: string };
type Movimentacao = { nome: string; dataHora: string; complemento?: string };
type Processo = {
  id: string;
  numeroProcesso: string;
  tribunal: string | null;
  vara: string | null;
  classe: string | null;
  assunto: string | null;
  status: string;
  partes: string | null;
  movimentacoes: string | null;
  resumoIA: string | null;
  ultimaAtualizacaoEm: string | null;
};
type Monitor = {
  id: string;
  documento: string;
  tipoDocumento: string;
  nomeMonitorado: string | null;
  ativo: boolean;
  ultimaVerificacaoEm: string | null;
  _count: { processos: number };
  processos: Pick<Processo, 'id' | 'numeroProcesso' | 'tribunal' | 'classe' | 'status' | 'ultimaAtualizacaoEm'>[];
};
type Especialista = {
  id: string;
  nome: string;
  descricao: string;
  area: string;
  precoTokens: number;
  totalUsos: number;
  mediaAvaliacao: number | null;
  aprovado: boolean;
};

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(data.token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <NavBar />
      <div className="login-card">
        <h2>Entrar na conta</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          <div className="form-group"><label>Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.875rem', color: 'var(--color-gray-500)' }}>
          <Link to="/forgot-password" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Esqueceu sua senha?</Link>
          {' · '}Ainda não tem conta?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Cadastre-se</Link>
        </p>
      </div>
    </>
  );
}


// ── Helpers ───────────────────────────────────────────────────────────────────

// Tribunais verificados via API — maio 2026
// Nota: partes (nome/CPF) NÃO está indexado no DataJud; busca por número,
//       classe, assunto, vara, grau e datas funcionam normalmente.
const TRIBUNAIS_CONFIG = [
  { sigla: 'tjsc', nome: 'TJSC — Tribunal de Justiça de SC',          ativo: true },
  { sigla: 'trf4', nome: 'TRF4 — Tribunal Regional Federal 4ª Região', ativo: true },
  { sigla: 'stj',  nome: 'STJ — Superior Tribunal de Justiça',         ativo: true },
  { sigla: 'stf',  nome: 'STF — Supremo Tribunal Federal',             ativo: false },
  { sigla: 'jfsc', nome: 'JFSC — Justiça Federal SC',                  ativo: false },
  { sigla: 'jfpr', nome: 'JFPR — Justiça Federal PR',                  ativo: false },
  { sigla: 'jfrs', nome: 'JFRS — Justiça Federal RS',                  ativo: false },
] as const;

const SIGLAS_ATIVAS = TRIBUNAIS_CONFIG.filter((t) => t.ativo).map((t) => t.sigla);

const GRAUS = [
  { value: '', label: 'Todos os graus' },
  { value: 'JE',       label: 'Juizado Especial (JE)' },
  { value: 'G1',       label: '1º Grau (G1)' },
  { value: 'G2',       label: '2º Grau (G2)' },
  { value: 'SUP',      label: 'Superior (SUP)' },
  { value: 'TURMA_REC', label: 'Turma Recursal' },
];

function Stars({ media }: { media: number | null }) {
  if (media === null) return <span style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>Sem avaliações</span>;
  const full = Math.round(media);
  return <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)} <span style={{ fontSize: '.72rem', color: 'var(--color-gray-500)' }}>{media.toFixed(1)}</span></span>;
}

function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

function PoloBadge({ polo }: { polo: string }) {
  const cls = polo === 'A' ? 'polo-A' : polo === 'P' ? 'polo-P' : 'polo-T';
  const label = polo === 'A' ? 'Ativo' : polo === 'P' ? 'Passivo' : polo;
  return <span className={`polo-badge ${cls}`}>{label}</span>;
}

// ── ProcessoCard ──────────────────────────────────────────────────────────────

function ProcessoCard({ p, autenticado }: { p: Processo; autenticado: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [resumo, setResumo] = useState(p.resumoIA);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const partes = parseJson<Parte[]>(p.partes, []);
  const movs = parseJson<Movimentacao[]>(p.movimentacoes, []);

  async function gerarResumo() {
    setLoadingResumo(true);
    try {
      const { resumo: r } = await apiFetch<{ resumo: string }>(`/api/juridico/processos/${p.id}/resumo`, { method: 'POST' });
      setResumo(r);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar resumo');
    } finally {
      setLoadingResumo(false);
    }
  }

  return (
    <div className="processo-card">
      <div className="processo-card-header">
        <div>
          <div className="processo-numero">{p.numeroProcesso}</div>
          <div className="processo-classe">{p.classe ?? 'Classe não informada'}</div>
          <div className="processo-meta">
            {p.tribunal && <span>{p.tribunal}</span>}
            {p.vara && <span>· {p.vara}</span>}
            {p.assunto && <span>· {p.assunto}</span>}
            {p.ultimaAtualizacaoEm && <span>· Atualizado {new Date(p.ultimaAtualizacaoEm).toLocaleDateString('pt-BR')}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(!expanded)} type="button">
            {expanded ? 'Fechar' : 'Detalhes'}
          </button>
          {autenticado && !resumo && (
            <button className="btn btn-outline btn-sm" onClick={gerarResumo} disabled={loadingResumo} type="button">
              {loadingResumo ? 'Resumindo…' : 'Resumir com IA'}
            </button>
          )}
        </div>
      </div>

      {resumo && <div className="resumo-ia">{resumo}</div>}

      {expanded && (
        <>
          {partes.length > 0 && (
            <div className="processo-partes">
              <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--color-gray-500)', marginBottom: '.3rem' }}>PARTES</div>
              {partes.map((pt, i) => (
                <div key={i} className="processo-parte">
                  <PoloBadge polo={pt.polo} />
                  <span style={{ fontSize: '.83rem' }}>{pt.nome}</span>
                  {pt.numeroDocumentoPrincipal && <span style={{ fontSize: '.72rem', color: 'var(--color-gray-400)', marginLeft: '.4rem' }}>({pt.numeroDocumentoPrincipal})</span>}
                </div>
              ))}
            </div>
          )}
          {movs.length > 0 && (
            <div className="movimentacoes">
              <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--color-gray-500)', marginBottom: '.3rem' }}>MOVIMENTAÇÕES</div>
              {movs.slice(0, 8).map((m, i) => (
                <div key={i} className="movimentacao-item">
                  <span className="movimentacao-data">{m.dataHora?.slice(0, 10)}</span>
                  {m.nome}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Consultar tab ─────────────────────────────────────────────────────────────

function ConsultarTab() {
  const [numero, setNumero] = useState('');
  const [tribunaisSel, setTribunaisSel] = useState<string[]>(['tjsc']);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({ classe: '', assunto: '', vara: '', grau: '', dataInicio: '', dataFim: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ processos: Processo[]; porTribunal: Record<string, number> } | null>(null);
  const [historico, setHistorico] = useState<Processo[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);

  function setFiltro<K extends keyof typeof filtros>(k: K, v: string) {
    setFiltros((f) => ({ ...f, [k]: v }));
  }

  function toggleTribunal(sigla: string) {
    setTribunaisSel((prev) =>
      prev.includes(sigla) ? prev.filter((t) => t !== sigla) : [...prev, sigla],
    );
  }

  function toggleTodos(checked: boolean) {
    setTribunaisSel(checked ? [...SIGLAS_ATIVAS] : ['tjsc']);
  }

  useEffect(() => {
    apiFetch<{ processos: Processo[] }>('/api/juridico/processos')
      .then((d) => setHistorico(d.processos))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    const temFiltro = Object.values(filtros).some(Boolean);
    if (!numero.trim() && !temFiltro) return;
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const multiTribunal = tribunaisSel.length > 1;
      const body: Record<string, unknown> = {
        tribunal: tribunaisSel[0] ?? 'tjsc',
        multiTribunal,
        ...(multiTribunal && { tribunais: tribunaisSel }),
        ...(numero.trim() && { numero: numero.trim() }),
        ...(filtros.classe     && { classe: filtros.classe }),
        ...(filtros.assunto    && { assunto: filtros.assunto }),
        ...(filtros.vara       && { vara: filtros.vara }),
        ...(filtros.grau       && { grau: filtros.grau }),
        ...(filtros.dataInicio && { dataInicio: filtros.dataInicio }),
        ...(filtros.dataFim    && { dataFim: filtros.dataFim }),
      };

      const data = await apiFetch<{ total: number; processos: Processo[]; porTribunal: Record<string, number> }>('/api/juridico/processos/consultar', { method: 'POST', body: JSON.stringify(body) });
      setResultado({ processos: data.processos, porTribunal: data.porTribunal ?? {} });
      if (data.processos.length > 0) {
        setHistorico((prev) => {
          const novosIds = new Set(data.processos.map((p) => p.id));
          return [...data.processos, ...prev.filter((p) => !novosIds.has(p.id))];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na consulta');
    } finally {
      setLoading(false);
    }
  }

  const temFiltrosAtivos = Object.values(filtros).some(Boolean);
  const todosAtivos = SIGLAS_ATIVAS.every((s) => tribunaisSel.includes(s));

  return (
    <div>
      {/* Aviso sobre limitações do DataJud */}
      <div style={{ padding: '.6rem .85rem', background: 'var(--color-gray-50)', borderRadius: 'var(--radius)', fontSize: '.78rem', color: 'var(--color-gray-500)', marginBottom: '.75rem', borderLeft: '3px solid var(--color-gray-200)' }}>
        <strong>Busca disponível:</strong> número CNJ, classe, assunto, vara, grau e período.
        Busca por nome ou CPF/CNPJ não está disponível no DataJud público (campo não indexado).
      </div>

      <form onSubmit={handleBuscar}>
        {/* Seleção de tribunais */}
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--color-gray-500)', marginBottom: '.4rem' }}>TRIBUNAIS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', cursor: 'pointer', padding: '.3rem .6rem', borderRadius: 'var(--radius)', background: todosAtivos ? 'var(--color-primary)' : 'var(--color-gray-100)', color: todosAtivos ? '#fff' : 'var(--color-gray-700)', fontWeight: 600 }}>
              <input type="checkbox" style={{ display: 'none' }} checked={todosAtivos} onChange={(e) => toggleTodos(e.target.checked)} />
              Todos
            </label>
            {TRIBUNAIS_CONFIG.map((t) => {
              const sel = tribunaisSel.includes(t.sigla);
              return (
                <label key={t.sigla} title={t.nome} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', cursor: t.ativo ? 'pointer' : 'not-allowed', opacity: t.ativo ? 1 : .4, padding: '.3rem .6rem', borderRadius: 'var(--radius)', background: sel && t.ativo ? 'var(--color-primary)' : 'var(--color-gray-100)', color: sel && t.ativo ? '#fff' : 'var(--color-gray-700)', border: t.ativo ? 'none' : '1px dashed var(--color-gray-300)' }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={sel} disabled={!t.ativo} onChange={() => t.ativo && toggleTribunal(t.sigla)} />
                  {t.sigla.toUpperCase()}
                  {!t.ativo && ' ✗'}
                </label>
              );
            })}
          </div>
          <p style={{ fontSize: '.7rem', color: 'var(--color-gray-400)', marginTop: '.3rem' }}>
            STF, JFSC, JFPR e JFRS indisponíveis na API pública do DataJud (índices não encontrados).
          </p>
        </div>

        {/* Barra principal */}
        <div className="search-bar">
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número CNJ — Ex: 5001234-12.2024.8.24.0001"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {/* Filtros avançados */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.4rem' }}>
          <button type="button" className={`btn btn-ghost btn-sm`} onClick={() => setMostrarFiltros(!mostrarFiltros)}>
            {temFiltrosAtivos ? '● ' : ''}Filtros avançados {mostrarFiltros ? '▲' : '▼'}
          </button>
        </div>

        {mostrarFiltros && (
          <div style={{ marginTop: '.5rem', padding: '1rem', background: 'var(--color-gray-50)', borderRadius: 'var(--radius)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Classe processual</label>
              <input value={filtros.classe} onChange={(e) => setFiltro('classe', e.target.value)} placeholder="Ex: Execução" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Assunto</label>
              <input value={filtros.assunto} onChange={(e) => setFiltro('assunto', e.target.value)} placeholder="Ex: Nota Promissória" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Vara / Órgão julgador</label>
              <input value={filtros.vara} onChange={(e) => setFiltro('vara', e.target.value)} placeholder="Ex: 1ª Vara Cível" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Grau</label>
              <select value={filtros.grau} onChange={(e) => setFiltro('grau', e.target.value)}>
                {GRAUS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Ajuizamento — de</label>
              <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltro('dataInicio', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Ajuizamento — até</label>
              <input type="date" value={filtros.dataFim} onChange={(e) => setFiltro('dataFim', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFiltros({ classe: '', assunto: '', vara: '', grau: '', dataInicio: '', dataFim: '' })}>
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </form>

      {error && <div className="error-msg">{error}</div>}

      {resultado !== null && (
        <div style={{ marginBottom: '1.5rem' }}>
          {/* Contador por tribunal */}
          {Object.keys(resultado.porTribunal).length > 0 && (
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
              {Object.entries(resultado.porTribunal).map(([t, n]) => (
                <span key={t} className="badge badge-area">{t}: {n}</span>
              ))}
            </div>
          )}
          <div className="section-title">
            Resultado ({resultado.processos.length} encontrado{resultado.processos.length !== 1 ? 's' : ''})
          </div>
          {resultado.processos.length === 0
            ? <div className="empty-state"><p>Nenhum processo encontrado para os critérios informados.</p></div>
            : resultado.processos.map((p) => <ProcessoCard key={p.id} p={p} autenticado />)
          }
        </div>
      )}

      {!loadingHist && historico.length > 0 && (
        <div>
          <div className="section-title">Consultas Anteriores</div>
          {historico.slice(0, 10).map((p) => <ProcessoCard key={p.id} p={p} autenticado />)}
        </div>
      )}
    </div>
  );
}

// ── Monitorar tab ─────────────────────────────────────────────────────────────

function MonitorarTab() {
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ documento: '', tipoDocumento: 'CPF', nomeMonitorado: '' });
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ monitores: Monitor[] }>('/api/juridico/monitores')
      .then((d) => setMonitores(d.monitores))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();
    setAdicionando(true);
    try {
      const { monitor } = await apiFetch<{ monitor: Monitor }>('/api/juridico/monitores', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMonitores((prev) => [monitor, ...prev]);
      setForm({ documento: '', tipoDocumento: 'CPF', nomeMonitorado: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao adicionar monitor');
    } finally {
      setAdicionando(false);
    }
  }

  async function handleRemover(id: string) {
    if (!confirm('Remover este monitor?')) return;
    setRemovendo(id);
    try {
      await apiFetch(`/api/juridico/monitores/${id}`, { method: 'DELETE' });
      setMonitores((prev) => prev.filter((m) => m.id !== id));
    } catch { /* silent */ } finally {
      setRemovendo(null);
    }
  }

  return (
    <div>
      <div className="detail-card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title">Adicionar Monitor</div>
        <form onSubmit={handleAdicionar} style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label>Documento</label>
            <input value={form.documento} onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))} placeholder="CPF ou CNPJ" required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tipo</label>
            <select value={form.tipoDocumento} onChange={(e) => setForm((f) => ({ ...f, tipoDocumento: e.target.value }))}>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label>Nome (opcional)</label>
            <input value={form.nomeMonitorado} onChange={(e) => setForm((f) => ({ ...f, nomeMonitorado: e.target.value }))} placeholder="Nome do monitorado" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={adicionando}>
            {adicionando ? 'Adicionando…' : 'Monitorar'}
          </button>
        </form>
      </div>

      {loading && <div className="loading">Carregando monitores…</div>}
      {!loading && monitores.length === 0 && (
        <div className="empty-state"><p>Nenhum monitor ativo. Adicione um CPF ou CNPJ para acompanhar processos automaticamente.</p></div>
      )}
      {monitores.map((m) => (
        <div key={m.id} className="monitor-card">
          <div className="monitor-card-header">
            <div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <span className={`badge ${m.tipoDocumento === 'CPF' ? 'badge-judicial' : 'badge-administrativo'}`}>{m.tipoDocumento}</span>
                <span className="monitor-doc">{m.documento}</span>
              </div>
              {m.nomeMonitorado && <div style={{ fontWeight: 600, marginTop: '.2rem', fontSize: '.9rem' }}>{m.nomeMonitorado}</div>}
              <div className="monitor-meta">
                {m._count.processos} processo{m._count.processos !== 1 ? 's' : ''} encontrado{m._count.processos !== 1 ? 's' : ''}
                {m.ultimaVerificacaoEm && ` · Verificado ${new Date(m.ultimaVerificacaoEm).toLocaleDateString('pt-BR')}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {m.processos.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setExpandido(expandido === m.id ? null : m.id)} type="button">
                  {expandido === m.id ? 'Fechar' : 'Processos'}
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => handleRemover(m.id)} disabled={removendo === m.id} type="button" style={{ color: 'crimson' }}>
                {removendo === m.id ? '…' : 'Remover'}
              </button>
            </div>
          </div>

          {expandido === m.id && m.processos.length > 0 && (
            <div className="monitor-processos">
              {m.processos.map((p) => (
                <div key={p.id} style={{ padding: '.35rem 0', borderBottom: '1px solid var(--color-gray-100)', fontSize: '.82rem' }}>
                  <div style={{ fontFamily: 'monospace', color: 'var(--color-gray-600)' }}>{p.numeroProcesso}</div>
                  <div style={{ color: 'var(--color-gray-500)' }}>{p.classe} {p.tribunal && `· ${p.tribunal}`}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Especialistas tab ─────────────────────────────────────────────────────────

function ConsultarModal({
  especialista,
  onClose,
}: {
  especialista: Especialista;
  onClose: () => void;
}) {
  const [caso, setCaso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [analise, setAnalise] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [nota, setNota] = useState(0);
  const [avaliou, setAvaliou] = useState(false);

  async function handleConsultar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setAnalise(null);
    try {
      const res = await apiFetch<{ analise: string; tokensUsados: number }>(`/api/juridico/especialistas/${especialista.id}/consultar`, { method: 'POST', body: JSON.stringify({ descricaoCaso: caso }) });
      setAnalise(res.analise);
      setTokens(res.tokensUsados);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro na consulta');
    } finally {
      setEnviando(false);
    }
  }

  async function handleAvaliar(n: number) {
    setNota(n);
    try {
      await apiFetch(`/api/juridico/especialistas/${especialista.id}/avaliar`, { method: 'POST', body: JSON.stringify({ nota: n }) });
      setAvaliou(true);
    } catch { /* silent */ }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>{especialista.nome}</h3>
            <span className={`badge badge-area`}>{especialista.area}</span>
          </div>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>

        {!analise ? (
          <form onSubmit={handleConsultar}>
            <div className="form-group">
              <label>Descreva o caso para análise</label>
              <textarea
                value={caso}
                onChange={(e) => setCaso(e.target.value)}
                placeholder="Ex: Cliente foi demitido sem justa causa após 3 anos de serviço. Tem direito a aviso prévio indenizado, multa de 40% do FGTS e…"
                style={{ minHeight: 140 }}
                required
              />
            </div>
            {especialista.precoTokens > 0 && (
              <div style={{ fontSize: '.8rem', color: 'var(--color-gray-500)', marginBottom: '.75rem' }}>
                Custo: {especialista.precoTokens} tokens
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={enviando || !caso.trim()}>
              {enviando ? 'Analisando…' : 'Consultar agente'}
            </button>
          </form>
        ) : (
          <div>
            <div className="analise-box">{analise}</div>
            {tokens && <div style={{ fontSize: '.75rem', color: 'var(--color-gray-400)', marginTop: '.4rem' }}>{tokens} tokens usados</div>}
            <div style={{ marginTop: '1rem' }}>
              {!avaliou ? (
                <div>
                  <div style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: '.4rem' }}>Avaliar análise:</div>
                  <div style={{ display: 'flex', gap: '.3rem' }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => handleAvaliar(n)} style={{ fontSize: '1.3rem', background: 'none', border: 'none', cursor: 'pointer', color: n <= nota ? '#f59e0b' : '#d1d5db' }}>★</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '.82rem', color: 'green' }}>Avaliação registrada! Obrigado.</div>
              )}
            </div>
            <div style={{ marginTop: '.75rem', display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAnalise(null); setCaso(''); }} type="button">Nova consulta</button>
              <button className="btn btn-outline btn-sm" onClick={onClose} type="button">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CriarEspecialistaModal({ onClose, onCriado }: { onClose: () => void; onCriado: () => void }) {
  const [form, setForm] = useState({ nome: '', descricao: '', area: '', promptSistema: '', precoTokens: 0, publico: false });
  const [criando, setCriando] = useState(false);

  const AREAS = ['TRABALHISTA', 'CIVIL', 'CONSUMIDOR', 'PREVIDENCIARIO', 'TRIBUTARIO', 'CRIMINAL', 'EMPRESARIAL', 'FAMILIA', 'IMOBILIARIO', 'ADMINISTRATIVO', 'AMBIENTAL', 'DIGITAL', 'OUTROS'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCriando(true);
    try {
      await apiFetch('/api/juridico/especialistas', { method: 'POST', body: JSON.stringify(form) });
      alert('Agente criado! Aguarda aprovação da curadoria PARCERIZA.');
      onCriado();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar agente');
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Criar Agente Especialista</h3><button className="modal-close" onClick={onClose} type="button">×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Nome do agente</label><input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required /></div>
          <div className="form-group"><label>Descrição</label><textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} style={{ minHeight: 60 }} required /></div>
          <div className="form-group">
            <label>Área jurídica</label>
            <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} required>
              <option value="">Selecione…</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group"><label>System prompt (instruções do agente)</label><textarea value={form.promptSistema} onChange={(e) => setForm((f) => ({ ...f, promptSistema: e.target.value }))} style={{ minHeight: 100 }} placeholder="Você é um especialista em direito trabalhista com foco em…" required /></div>
          <div className="form-group">
            <label>Preço em tokens (0 = gratuito)</label>
            <input type="number" min={0} value={form.precoTokens} onChange={(e) => setForm((f) => ({ ...f, precoTokens: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
            <input type="checkbox" id="publico" checked={form.publico} onChange={(e) => setForm((f) => ({ ...f, publico: e.target.checked }))} />
            <label htmlFor="publico" style={{ marginBottom: 0 }}>Publicar no marketplace (após aprovação)</label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={criando}>{criando ? 'Criando…' : 'Criar agente'}</button>
        </form>
      </div>
    </div>
  );
}

function EspecialistasTab() {
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroArea, setFiltroArea] = useState('');
  const [consultando, setConsultando] = useState<Especialista | null>(null);
  const [criando, setCriando] = useState(false);

  const AREAS = ['', 'TRABALHISTA', 'CIVIL', 'CONSUMIDOR', 'PREVIDENCIARIO', 'TRIBUTARIO', 'CRIMINAL', 'EMPRESARIAL', 'FAMILIA', 'IMOBILIARIO', 'ADMINISTRATIVO'];

  function load(area?: string) {
    setLoading(true);
    const q = area ? `?area=${area}` : '';
    apiFetch<{ especialistas: Especialista[] }>(`/api/juridico/especialistas${q}`)
      .then((d) => setEspecialistas(d.especialistas))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleFiltro(area: string) {
    setFiltroArea(area);
    load(area || undefined);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <select className="tribunal-select" value={filtroArea} onChange={(e) => handleFiltro(e.target.value)}>
            {AREAS.map((a) => <option key={a} value={a}>{a || 'Todas as áreas'}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCriando(true)} type="button">+ Criar meu agente especialista</button>
      </div>

      {loading && <div className="loading">Carregando especialistas…</div>}
      {!loading && especialistas.length === 0 && (
        <div className="empty-state"><p>Nenhum agente especialista disponível para esta área.</p></div>
      )}
      {!loading && (
        <div className="especialista-grid">
          {especialistas.map((e) => (
            <div key={e.id} className="especialista-card">
              <div>
                <span className="badge badge-area" style={{ fontSize: '.68rem' }}>{e.area}</span>
              </div>
              <div className="especialista-nome">{e.nome}</div>
              <div className="especialista-desc">{e.descricao}</div>
              <div className="especialista-footer">
                <Stars media={e.mediaAvaliacao} />
                <span className="preco-badge">{e.precoTokens === 0 ? 'Grátis' : `${e.precoTokens} tokens`}</span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--color-gray-400)' }}>{e.totalUsos} consulta{e.totalUsos !== 1 ? 's' : ''}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setConsultando(e)} type="button">Consultar</button>
            </div>
          ))}
        </div>
      )}

      {consultando && <ConsultarModal especialista={consultando} onClose={() => setConsultando(null)} />}
      {criando && <CriarEspecialistaModal onClose={() => setCriando(false)} onCriado={() => load(filtroArea || undefined)} />}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = 'consultar' | 'monitorar' | 'especialistas';

export function Juridico() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [tab, setTab] = useState<Tab>('consultar');

  function handleLogin() { setTokenState(getToken()); }
  function handleLogout() { clearToken(); setTokenState(null); }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  return (
    <>
      <NavBar onLogout={handleLogout} />
      <div className="container">
        <div className="page-header">
          <h1>Retaguarda Jurídica</h1>
          <p>Consulta de processos via DataJud, monitoramento automático e agentes especialistas.</p>
        </div>

        <div className="tabs">
          {(['consultar', 'monitorar', 'especialistas'] as Tab[]).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} type="button">
              {t === 'consultar' ? '🔍 Consultar' : t === 'monitorar' ? '📡 Monitorar' : '🤖 Especialistas'}
            </button>
          ))}
        </div>

        {tab === 'consultar' && <ConsultarTab />}
        {tab === 'monitorar' && <MonitorarTab />}
        {tab === 'especialistas' && <EspecialistasTab />}
      </div>
    </>
  );
}
