import { useEffect, useState } from 'react';
import { NavBar } from '../components/NavBar';

function getToken() { return localStorage.getItem('parceriza_token'); }
function setToken(t: string) { localStorage.setItem('parceriza_token', t); }
function clearToken() { localStorage.removeItem('parceriza_token'); }

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...((options.headers as Record<string, string>) ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}

type Anuncio = {
  id: string; titulo: string; descricao: string; mediaUrl: string | null;
  modelo: string; posicionamento: string; tokensLance: number; orcamentoTokens: number;
  gastoTokens: number; impressoes: number; cliques: number; status: string;
  ctr: string; orcamentoPct: number;
  job: { titulo: string } | null; area: { nome: string; slug: string } | null;
  createdAt: string;
};
type Job = { id: string; titulo: string; area: { nome: string } };
type Area = { id: string; nome: string; slug: string };

const STATUS_BADGE: Record<string, string> = {
  RASCUNHO: 'badge-area', ATIVO: 'badge-pago', PAUSADO: 'badge-pendente', ENCERRADO: 'badge-cancelado',
};
const POSICIONAMENTO_INFO: Record<string, { icon: string; label: string; desc: string }> = {
  DESTAQUE_JOB: { icon: '⚖️', label: 'Destaque JOB', desc: 'Aparece no topo da página de um JOB específico' },
  DESTAQUE_AREA: { icon: '📂', label: 'Destaque Área', desc: 'Aparece ao filtrar uma área jurídica' },
  BANNER_BUSCA: { icon: '🔍', label: 'Banner Busca', desc: 'Exibido no topo do marketplace de JOBs' },
};

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { const d = await apiFetch<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setToken(d.token); onLogin(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); } finally { setLoading(false); }
  }
  return (<><NavBar /><div className="login-card"><h2>Entrar</h2>{error && <div className="error-msg">{error}</div>}<form onSubmit={submit}><div className="form-group"><label>E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div><div className="form-group"><label>Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div><button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button></form></div></>);
}

function CriarModal({ jobs, areas, onClose, onCriado }: { jobs: Job[]; areas: Area[]; onClose: () => void; onCriado: () => void }) {
  const [form, setForm] = useState({
    titulo: '', descricao: '', mediaUrl: '', modelo: 'CPC', posicionamento: 'BANNER_BUSCA',
    jobId: '', areaId: '', tokensLance: 50, orcamentoTokens: 500, inicioEm: '', fimEm: '',
  });
  const [criando, setCriando] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setCriando(true);
    try {
      await apiFetch('/api/ads', {
        method: 'POST',
        body: JSON.stringify({
          titulo: form.titulo, descricao: form.descricao,
          mediaUrl: form.mediaUrl || null, modelo: form.modelo,
          posicionamento: form.posicionamento,
          jobId: form.posicionamento === 'DESTAQUE_JOB' ? form.jobId || null : null,
          areaId: form.posicionamento === 'DESTAQUE_AREA' ? form.areaId || null : null,
          tokensLance: form.tokensLance, orcamentoTokens: form.orcamentoTokens,
          inicioEm: form.inicioEm || null, fimEm: form.fimEm || null,
        }),
      });
      onCriado(); onClose();
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); } finally { setCriando(false); }
  }

  const alcance = Math.floor((form.orcamentoTokens / form.tokensLance) * 100);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header"><h3>Criar Anúncio</h3><button className="modal-close" onClick={onClose} type="button">×</button></div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: '.4rem', color: 'var(--color-gray-600)' }}>Posicionamento</div>
            <div className="posicionamento-cards">
              {Object.entries(POSICIONAMENTO_INFO).map(([key, info]) => (
                <div key={key} className={`posicionamento-card ${form.posicionamento === key ? 'selected' : ''}`} onClick={() => set('posicionamento', key)} role="button">
                  <div className="posicionamento-card-icon">{info.icon}</div>
                  <div className="posicionamento-card-label">{info.label}</div>
                  <div className="posicionamento-card-desc">{info.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {form.posicionamento === 'DESTAQUE_JOB' && (
            <div className="form-group">
              <label>JOB</label>
              <select value={form.jobId} onChange={(e) => set('jobId', e.target.value)} required>
                <option value="">Selecione um JOB</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.titulo} ({j.area.nome})</option>)}
              </select>
            </div>
          )}
          {form.posicionamento === 'DESTAQUE_AREA' && (
            <div className="form-group">
              <label>Área Jurídica</label>
              <select value={form.areaId} onChange={(e) => set('areaId', e.target.value)} required>
                <option value="">Selecione uma área</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div className="form-group">
              <label>Título</label>
              <input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} maxLength={100} required />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <select value={form.modelo} onChange={(e) => set('modelo', e.target.value)}>
                <option value="CPC">CPC (por clique)</option>
                <option value="CPM">CPM (por impressão)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} maxLength={500} required style={{ minHeight: 60 }} />
          </div>

          <div className="form-group">
            <label>Lance em tokens (por {form.modelo === 'CPC' ? 'clique' : 'impressão'}): <strong>{form.tokensLance}</strong></label>
            <input type="range" min={1} max={500} value={form.tokensLance} onChange={(e) => set('tokensLance', parseInt(e.target.value))} />
          </div>

          <div className="form-group">
            <label>Orçamento total: <strong>{form.orcamentoTokens} tokens</strong> ≈ {alcance} {form.modelo === 'CPC' ? 'cliques' : 'impressões'} estimados</label>
            <input type="range" min={50} max={50000} step={50} value={form.orcamentoTokens} onChange={(e) => set('orcamentoTokens', parseInt(e.target.value))} />
          </div>

          <div className="form-group">
            <label>URL da imagem (opcional)</label>
            <input type="url" value={form.mediaUrl} onChange={(e) => set('mediaUrl', e.target.value)} placeholder="https://..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div className="form-group">
              <label>Início (opcional)</label>
              <input type="datetime-local" value={form.inicioEm} onChange={(e) => set('inicioEm', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fim (opcional)</label>
              <input type="datetime-local" value={form.fimEm} onChange={(e) => set('fimEm', e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={criando}>
            {criando ? 'Criando…' : 'Criar anúncio (como Rascunho)'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function Ads() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCriar, setShowCriar] = useState(false);
  const [navRefresh, setNavRefresh] = useState(0);

  function handleLogin() { setTokenState(getToken()); }
  function handleLogout() { clearToken(); setTokenState(null); }

  async function carregar() {
    try {
      const [a, j, ar] = await Promise.all([
        apiFetch<{ anuncios: Anuncio[] }>('/api/ads/meus'),
        fetch('/api/jobs').then((r) => r.json()),
        fetch('/api/areas').then((r) => r.json()),
      ]);
      setAnuncios(a.anuncios);
      setJobs(j.jobs ?? []);
      setAreas(ar.areas ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  useEffect(() => { if (token) carregar(); }, [token]);

  async function toggleStatus(id: string, status: 'ATIVO' | 'PAUSADO' | 'ENCERRADO') {
    try {
      await apiFetch(`/api/ads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setAnuncios((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); }
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  const totalImpressoes = anuncios.reduce((s, a) => s + a.impressoes, 0);
  const totalCliques = anuncios.reduce((s, a) => s + a.cliques, 0);
  const totalGasto = anuncios.reduce((s, a) => s + a.gastoTokens, 0);
  const ctrMedio = totalImpressoes > 0 ? ((totalCliques / totalImpressoes) * 100).toFixed(2) : '0.00';

  return (
    <>
      <NavBar onLogout={handleLogout} refreshKey={navRefresh} />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
          <div className="page-header" style={{ margin: 0 }}>
            <h1>Meus Anúncios</h1>
            <p>Gerencie suas campanhas e monitore métricas em tempo real.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCriar(true)} type="button">+ Criar Anúncio</button>
        </div>

        {/* Resumo */}
        <div className="ads-summary-grid">
          {[
            { value: anuncios.filter((a) => a.status === 'ATIVO').length, label: 'Ativos' },
            { value: totalImpressoes.toLocaleString('pt-BR'), label: 'Impressões' },
            { value: totalCliques.toLocaleString('pt-BR'), label: 'Cliques' },
            { value: `${ctrMedio}%`, label: 'CTR Médio' },
          ].map((s) => (
            <div key={s.label} className="ads-summary-card">
              <div className="ads-summary-value">{s.value}</div>
              <div className="ads-summary-label">{s.label}</div>
            </div>
          ))}
        </div>

        {loading && <div className="loading">Carregando anúncios…</div>}
        {!loading && anuncios.length === 0 && (
          <div className="empty-state"><p>Nenhum anúncio criado ainda. Comece agora!</p></div>
        )}

        {!loading && anuncios.length > 0 && (
          <div className="table-wrapper">
            <table width="100%" style={{ borderCollapse: 'collapse', fontSize: '.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-gray-50)', borderBottom: '2px solid var(--color-gray-100)' }}>
                  {['Anúncio', 'Tipo', 'Impressões', 'Cliques', 'CTR', 'Orçamento', 'Status', 'Ações'].map((h) => (
                    <th key={h} style={{ padding: '.6rem .85rem', textAlign: 'left', fontWeight: 700, fontSize: '.72rem', textTransform: 'uppercase', color: 'var(--color-gray-500)', letterSpacing: '.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anuncios.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                    <td style={{ padding: '.65rem .85rem' }}>
                      <div style={{ fontWeight: 600 }}>{a.titulo}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>{a.modelo} · {a.job?.titulo ?? a.area?.nome ?? '—'}</div>
                    </td>
                    <td style={{ padding: '.65rem .85rem' }}>
                      <span style={{ fontSize: '.82rem' }}>{POSICIONAMENTO_INFO[a.posicionamento]?.icon} {POSICIONAMENTO_INFO[a.posicionamento]?.label}</span>
                    </td>
                    <td style={{ padding: '.65rem .85rem', fontWeight: 600 }}>{a.impressoes.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '.65rem .85rem', fontWeight: 600 }}>{a.cliques.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '.65rem .85rem' }}>{a.ctr}%</td>
                    <td style={{ padding: '.65rem .85rem', minWidth: 140 }}>
                      <div style={{ fontSize: '.75rem', color: 'var(--color-gray-500)', marginBottom: '.25rem' }}>
                        {a.gastoTokens} / {a.orcamentoTokens} tokens
                      </div>
                      <div className="progress-bar-outer" style={{ height: 6 }}>
                        <div className="progress-bar-inner" style={{ width: `${a.orcamentoPct}%` }} />
                      </div>
                    </td>
                    <td style={{ padding: '.65rem .85rem' }}>
                      <span className={`badge ${STATUS_BADGE[a.status] ?? 'badge-area'}`}>{a.status}</span>
                    </td>
                    <td style={{ padding: '.65rem .85rem' }}>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        {a.status === 'RASCUNHO' && <button className="btn btn-primary btn-sm" onClick={() => toggleStatus(a.id, 'ATIVO')} type="button">Ativar</button>}
                        {a.status === 'ATIVO' && <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(a.id, 'PAUSADO')} type="button">Pausar</button>}
                        {a.status === 'PAUSADO' && <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(a.id, 'ATIVO')} type="button">Ativar</button>}
                        {a.status !== 'ENCERRADO' && <button className="btn btn-ghost btn-sm" style={{ color: 'crimson' }} onClick={() => toggleStatus(a.id, 'ENCERRADO')} type="button">Encerrar</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCriar && (
        <CriarModal
          jobs={jobs}
          areas={areas}
          onClose={() => setShowCriar(false)}
          onCriado={() => { carregar(); setNavRefresh((n) => n + 1); }}
        />
      )}
    </>
  );
}
