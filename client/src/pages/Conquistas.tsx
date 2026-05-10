import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { NavBar } from '../components/NavBar';

import { getToken, setToken, clearToken, apiFetch } from '../lib/api';

type Tarefa = {
  id: string; titulo: string; descricao: string; tipo: string; categoria: string;
  recompensaTokens: number; icone: string; repeticao: string;
  disponivel: boolean; completadaEm: string | null; tokensGanhos: number | null;
};
type RankingItem = { posicao: number; tokensGanhos: number; advogado: { id: string; nome: string; avatarUrl: string | null; oabUf: string } | undefined };
type Parceiro = { id: string; nome: string; logoUrl: string | null; descricao: string | null; regras: Regra[] };
type Regra = { id: string; tipo: string; titulo: string; descricao: string | null; tokensRecompensa: number; totalUsado: number };

function celebrar() {
  confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 }, colors: ['#059669', '#047857', '#f97316', '#d1fae5'] });
}

type TabId = 'todas' | 'ONBOARDING' | 'SEMANAL' | 'ESPECIAL' | 'parceiros';

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const d = await apiFetch<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(d.token); onLogin();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); } finally { setLoading(false); }
  }

  return (
    <>
      <NavBar />
      <div className="login-card">
        <h2>Entrar na conta</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
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

export function Conquistas() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('todas');
  const [completando, setCompletando] = useState<string | null>(null);
  const [navRefresh, setNavRefresh] = useState(0);
  const [resgatando, setResgatando] = useState<string | null>(null);

  function handleLogin() { setTokenState(getToken()); }
  function handleLogout() { clearToken(); setTokenState(null); }

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<{ tarefas: Tarefa[] }>('/api/gamificacao/tarefas'),
      apiFetch<{ ranking: RankingItem[] }>('/api/gamificacao/ranking'),
      apiFetch<{ parceiros: Parceiro[] }>('/api/tokens/parceiros'),
    ]).then(([t, r, p]) => {
      setTarefas(t.tarefas);
      setRanking(r.ranking);
      setParceiros(p.parceiros);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  async function handleCompletar(tarefaId: string) {
    setCompletando(tarefaId);
    try {
      const res = await apiFetch<{ tokensGanhos: number }>(`/api/gamificacao/tarefas/${tarefaId}/completar`, { method: 'POST' });
      setTarefas((prev) => prev.map((t) => t.id === tarefaId ? { ...t, disponivel: false, completadaEm: new Date().toISOString(), tokensGanhos: res.tokensGanhos } : t));
      setNavRefresh((n) => n + 1);
      celebrar();
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); } finally { setCompletando(null); }
  }

  async function handleResgatar(regraId: string) {
    setResgatando(regraId);
    try {
      const res = await apiFetch<{ tokensCredits: number; regra: { titulo: string } }>(`/api/tokens/parceiros/${regraId}/resgatar`, { method: 'POST', body: '{}' });
      alert(`✅ ${res.tokensCredits} tokens creditados por "${res.regra.titulo}"!`);
      setNavRefresh((n) => n + 1);
      celebrar();
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro ao resgatar'); } finally { setResgatando(null); }
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  const total = tarefas.length;
  const completadas = tarefas.filter((t) => !t.disponivel && t.completadaEm).length;
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const filtered = tab === 'todas' ? tarefas
    : tab === 'parceiros' ? []
    : tarefas.filter((t) => t.tipo === tab);

  const initials = (nome: string) => nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <NavBar onLogout={handleLogout} refreshKey={navRefresh} />
      <div className="container">
        <div className="page-header">
          <h1>Centro de Conquistas</h1>
          <p>Complete tarefas, ganhe tokens e suba no ranking.</p>
        </div>

        {/* Progress */}
        {!loading && (
          <div className="detail-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{completadas} de {total} tarefas completadas</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{pct}%</span>
            </div>
            <div className="progress-bar-outer">
              <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem', alignItems: 'start' }}>
          <div>
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              {(['todas', 'ONBOARDING', 'SEMANAL', 'ESPECIAL', 'parceiros'] as TabId[]).map((t) => (
                <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} type="button">
                  {t === 'todas' ? 'Todas' : t === 'ONBOARDING' ? '🚀 Onboarding' : t === 'SEMANAL' ? '📅 Semanal' : t === 'ESPECIAL' ? '⭐ Especial' : '🤝 Parceiros'}
                </button>
              ))}
            </div>

            {loading && <div className="loading">Carregando tarefas…</div>}

            {/* Parceiros tab */}
            {!loading && tab === 'parceiros' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {parceiros.map((p) => (
                  <div key={p.id} className="parceiro-card">
                    <div className="parceiro-header">
                      <div className="parceiro-logo">{p.nome.slice(0, 1)}</div>
                      <div>
                        <div className="parceiro-nome">{p.nome}</div>
                        <div className="parceiro-desc">{p.descricao}</div>
                      </div>
                    </div>
                    <div className="parceiro-regras">
                      {p.regras.map((r) => (
                        <div key={r.id} className="regra-item">
                          <div className="regra-info">
                            <div className="regra-titulo">{r.titulo}</div>
                            <div className="regra-tipo">{r.tipo.replace('_', ' ')}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.25rem' }}>
                            <div className="regra-tokens">+{r.tokensRecompensa}</div>
                            <button className="btn btn-primary btn-sm" style={{ fontSize: '.7rem', padding: '.2rem .5rem' }} onClick={() => handleResgatar(r.id)} disabled={resgatando === r.id} type="button">
                              {resgatando === r.id ? '…' : 'Resgatar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tarefas grid */}
            {!loading && tab !== 'parceiros' && (
              <div className="tarefa-grid">
                {filtered.map((t) => {
                  const estado = !t.completadaEm ? 'disponivel' : t.disponivel ? 'disponivel' : 'completada';
                  return (
                    <div key={t.id} className={`tarefa-card ${estado}`}>
                      <div className="tarefa-icone">{t.icone}</div>
                      <div className="tarefa-titulo">{t.titulo}</div>
                      <div className="tarefa-desc">{t.descricao}</div>
                      <div className="tarefa-footer">
                        <div className="tarefa-tokens">+{t.recompensaTokens} tokens</div>
                        <span className={`tarefa-status-badge ${estado}`}>
                          {estado === 'completada' ? '✓ Feita' : t.repeticao === 'UNICA' ? 'Única' : t.repeticao === 'SEMANAL' ? 'Semanal' : 'Mensal'}
                        </span>
                      </div>
                      {t.disponivel && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleCompletar(t.id)} disabled={completando === t.id} type="button">
                          {completando === t.id ? 'Completando…' : 'Marcar como feita'}
                        </button>
                      )}
                      {!t.disponivel && t.completadaEm && (
                        <div style={{ fontSize: '.72rem', color: 'var(--color-gray-400)', textAlign: 'right' }}>
                          {new Date(t.completadaEm).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ranking sidebar */}
          <div className="secretaria-panel">
            <div className="secretaria-panel-header"><h3>🏆 Ranking do Mês</h3></div>
            <div className="secretaria-panel-body">
              {ranking.length === 0 && <div style={{ fontSize: '.82rem', color: 'var(--color-gray-400)', textAlign: 'center', padding: '.5rem 0' }}>Sem dados ainda</div>}
              {ranking.slice(0, 10).map((r) => (
                <div key={r.posicao} className="ranking-item">
                  <div className={`ranking-pos ${r.posicao <= 3 ? 'top3' : ''}`}>
                    {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : `${r.posicao}º`}
                  </div>
                  <div className="ranking-avatar">{r.advogado ? initials(r.advogado.nome) : '?'}</div>
                  <div className="ranking-info">
                    <div className="ranking-nome">{r.advogado?.nome ?? '—'}</div>
                    <div className="ranking-tokens">⚡ {r.tokensGanhos.toLocaleString('pt-BR')} tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
