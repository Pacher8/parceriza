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
          Ainda não tem conta?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Cadastre-se</Link>
        </p>
      </div>
    </>
  );
}


// ── Helpers ───────────────────────────────────────────────────────────────────

const TRIBUNAIS = ['tjsc', 'tjsp', 'tjrj', 'tjmg', 'tjrs', 'tjpr', 'tjba', 'tjce', 'trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6', 'stj', 'stf', 'tst'];

const GRAUS = [
  { value: '', label: 'Todos os graus' },
  { value: 'JE', label: 'Juizado Especial (JE)' },
  { value: 'G1', label: '1º Grau (G1)' },
  { value: 'G2', label: '2º Grau (G2)' },
  { value: 'SUP', label: 'Superior (SUP)' },
  { value: 'TURMA_REC', label: 'Turma Recursal' },
];

const POLOS = [
  { value: '', label: 'Qualquer polo' },
  { value: 'ATIVO', label: 'Polo Ativo (Autor)' },
  { value: 'PASSIVO', label: 'Polo Passivo (Réu)' },
  { value: 'TERCEIRO', label: 'Terceiro' },
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

type ModoBusca = 'numero' | 'cpf' | 'cnpj' | 'nomeParte' | 'nomeAdvogado';

function ConsultarTab() {
  const [modo, setModo] = useState<ModoBusca>('numero');
  const [valor, setValor] = useState('');
  const [tribunal, setTribunal] = useState('tjsc');
  const [multiTribunal, setMultiTribunal] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState({ classe: '', assunto: '', vara: '', grau: '', polo: '', dataInicio: '', dataFim: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Processo[] | null>(null);
  const [historico, setHistorico] = useState<Processo[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);

  function setFiltro<K extends keyof typeof filtros>(k: K, v: string) {
    setFiltros((f) => ({ ...f, [k]: v }));
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
    if (!valor.trim() && !temFiltro) return;
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const body: Record<string, unknown> = {
        tribunal: multiTribunal ? 'tjsc' : tribunal,
        multiTribunal,
        ...(filtros.classe    && { classe: filtros.classe }),
        ...(filtros.assunto   && { assunto: filtros.assunto }),
        ...(filtros.vara      && { vara: filtros.vara }),
        ...(filtros.grau      && { grau: filtros.grau }),
        ...(filtros.polo      && { polo: filtros.polo }),
        ...(filtros.dataInicio && { dataInicio: filtros.dataInicio }),
        ...(filtros.dataFim   && { dataFim: filtros.dataFim }),
      };
      const v = valor.trim();
      if (modo === 'numero'        && v) body.numero       = v;
      else if (modo === 'cpf'      && v) body.cpf          = v;
      else if (modo === 'cnpj'     && v) body.cnpj         = v;
      else if (modo === 'nomeParte'    && v) body.nomeParte    = v;
      else if (modo === 'nomeAdvogado' && v) body.nomeAdvogado = v;

      const data = await apiFetch<{ total: number; processos: Processo[] }>('/api/juridico/processos/consultar', { method: 'POST', body: JSON.stringify(body) });
      setResultado(data.processos);
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

  const modos: { key: ModoBusca; label: string; placeholder: string }[] = [
    { key: 'numero',       label: 'Número CNJ',     placeholder: '0001234-12.2023.8.24.0001' },
    { key: 'cpf',          label: 'CPF',             placeholder: '000.000.000-00' },
    { key: 'cnpj',         label: 'CNPJ',            placeholder: '00.000.000/0001-00' },
    { key: 'nomeParte',    label: 'Nome da Parte',   placeholder: 'Nome do cliente ou empresa' },
    { key: 'nomeAdvogado', label: 'Nome/OAB Adv.',   placeholder: 'Nome do advogado' },
  ];

  const modoAtual = modos.find((m) => m.key === modo)!;

  const temFiltrosAtivos = Object.values(filtros).some(Boolean);

  return (
    <div>
      <form onSubmit={handleBuscar}>
        {/* Modo de busca */}
        <div className="toggle-group" style={{ flexWrap: 'wrap', marginBottom: '.75rem' }}>
          {modos.map((m) => (
            <button key={m.key} type="button" className={modo === m.key ? 'active' : ''} onClick={() => { setModo(m.key); setValor(''); }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Barra principal */}
        <div className="search-bar">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={modoAtual.placeholder}
          />
          {!multiTribunal && (
            <select className="tribunal-select" value={tribunal} onChange={(e) => setTribunal(e.target.value)}>
              {TRIBUNAIS.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {/* Controles secundários */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '.5rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.8rem', color: 'var(--color-gray-600)', cursor: 'pointer' }}>
            <input type="checkbox" checked={multiTribunal} onChange={(e) => setMultiTribunal(e.target.checked)} />
            Buscar em múltiplos tribunais (TJSC, TJSP, TJRJ, TJMG, TJRS, TJPR, TJBA, TJCE)
          </label>
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${temFiltrosAtivos ? 'btn-active' : ''}`}
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{ marginLeft: 'auto' }}
          >
            {temFiltrosAtivos ? '● ' : ''}Filtros avançados {mostrarFiltros ? '▲' : '▼'}
          </button>
        </div>

        {/* Filtros avançados */}
        {mostrarFiltros && (
          <div style={{ marginTop: '.75rem', padding: '1rem', background: 'var(--color-gray-50)', borderRadius: 'var(--radius)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Classe processual</label>
              <input value={filtros.classe} onChange={(e) => setFiltro('classe', e.target.value)} placeholder="Ex: Execução, Monitória" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '.75rem' }}>Assunto</label>
              <input value={filtros.assunto} onChange={(e) => setFiltro('assunto', e.target.value)} placeholder="Ex: Nota Promissória, Dano Moral" />
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
              <label style={{ fontSize: '.75rem' }}>Polo da parte buscada</label>
              <select value={filtros.polo} onChange={(e) => setFiltro('polo', e.target.value)}>
                {POLOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
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
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFiltros({ classe: '', assunto: '', vara: '', grau: '', polo: '', dataInicio: '', dataFim: '' })}>
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </form>

      {error && <div className="error-msg">{error}</div>}

      {resultado !== null && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Resultado da Consulta ({resultado.length} encontrado{resultado.length !== 1 ? 's' : ''})</div>
          {resultado.length === 0
            ? <div className="empty-state"><p>Nenhum processo encontrado para os critérios informados.</p></div>
            : resultado.map((p) => <ProcessoCard key={p.id} p={p} autenticado />)
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
      alert('Agente criado! Aguarda aprovação da curadoria Parceriza.');
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
