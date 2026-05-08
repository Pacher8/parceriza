import { useEffect, useState } from 'react';
import { NavBar } from '../components/NavBar';

import { getToken, setToken, clearToken, apiFetch, apiUrl } from '../lib/api';

type AdvogadoData = {
  nome: string; email: string; oab: string; oabUf: string; bio: string | null;
  telefone: string | null;
  servicos: { titulo: string; valor: string; tese: { area: string } }[];
  saldoTokens: number;
};

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
      </div>
    </>
  );
}

export function Apresentacao() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [advogado, setAdvogado] = useState<AdvogadoData | null>(null);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [gerando, setGerando] = useState(false);
  const [navRefresh, setNavRefresh] = useState(0);

  function handleLogin() { setTokenState(getToken()); }
  function handleLogout() { clearToken(); setTokenState(null); }

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<{ advogado: AdvogadoData }>('/api/auth/me'),
      apiFetch<{ saldo: number }>('/api/tokens/saldo'),
    ]).then(([{ advogado: a }, s]) => {
      setAdvogado(a);
      setSaldo(s.saldo);
    }).catch(() => {});
  }, [token]);

  async function handleGerar() {
    if (!confirm('Gerar apresentação por 500 tokens?')) return;
    setGerando(true);
    try {
      const tkn = getToken()!;
      const res = await fetch(apiUrl('/api/tokens/apresentacao'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${tkn}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Erro ao gerar');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'apresentacao-parceriza.pdf';
      a.click();
      URL.revokeObjectURL(url);
      const s2 = await apiFetch<{ saldo: number }>('/api/tokens/saldo');
      setSaldo(s2.saldo);
      setNavRefresh((n) => n + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar PDF');
    } finally {
      setGerando(false);
    }
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  const initials = advogado ? advogado.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '??';
  const semSaldo = saldo !== null && saldo < 500;

  return (
    <>
      <NavBar onLogout={handleLogout} refreshKey={navRefresh} />
      <div className="container" style={{ maxWidth: 680 }}>
        <div className="page-header">
          <h1>Apresentação Profissional</h1>
          <p>Gere um PDF A4 profissional para apresentar seu escritório a clientes e parceiros.</p>
        </div>

        {/* Preview mockup */}
        {advogado && (
          <div className="apresentacao-preview">
            <div className="apres-header">
              <div className="apres-avatar">{initials}</div>
              <div>
                <div className="apres-nome">{advogado.nome}</div>
                <div className="apres-oab">OAB/{advogado.oabUf} nº {advogado.oab}</div>
              </div>
            </div>
            <div className="apres-body">
              {advogado.bio && (
                <div style={{ marginBottom: '.75rem' }}>
                  <div className="apres-section-title">Sobre</div>
                  <div className="apres-bio">{advogado.bio.slice(0, 180)}{advogado.bio.length > 180 ? '…' : ''}</div>
                </div>
              )}
              {advogado.servicos.length > 0 && (
                <div style={{ marginBottom: '.75rem' }}>
                  <div className="apres-section-title">Serviços ({advogado.servicos.length})</div>
                  {advogado.servicos.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ fontSize: '.8rem', padding: '.25rem 0', borderBottom: '1px solid #f3f4f6', color: 'var(--color-gray-700)' }}>
                      <span className="badge badge-area" style={{ fontSize: '.65rem', marginRight: '.35rem' }}>{s.tese.area}</span>
                      {s.titulo}
                    </div>
                  ))}
                  {advogado.servicos.length > 3 && <div style={{ fontSize: '.72rem', color: 'var(--color-gray-400)', marginTop: '.25rem' }}>+{advogado.servicos.length - 3} serviços</div>}
                </div>
              )}
              <div className="apres-section-title">Contato</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-gray-600)' }}>{advogado.email}{advogado.telefone && ` · ${advogado.telefone}`}</div>
            </div>
          </div>
        )}

        {/* Custo e botão */}
        <div className="detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Custo da geração</div>
              <div style={{ fontSize: '.82rem', color: 'var(--color-gray-500)' }}>Debita da sua conta de tokens</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>⚡ 500</div>
              <div style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>
                Seu saldo: {saldo !== null ? saldo.toLocaleString('pt-BR') : '…'}
              </div>
            </div>
          </div>

          {semSaldo && (
            <div className="error-msg" style={{ marginBottom: '1rem' }}>
              Saldo insuficiente. Você precisa de 500 tokens. <a href="/tokens" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Comprar tokens</a>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '.75rem', fontSize: '1rem' }}
            onClick={handleGerar}
            disabled={gerando || semSaldo}
            type="button"
          >
            {gerando ? '⏳ Gerando PDF…' : '📄 Gerar e Baixar Apresentação'}
          </button>

          <div style={{ marginTop: '.75rem', fontSize: '.78rem', color: 'var(--color-gray-400)', textAlign: 'center' }}>
            O PDF será baixado automaticamente após a geração.
          </div>
        </div>

        <div className="detail-card" style={{ marginTop: '1rem' }}>
          <div className="section-title" style={{ marginBottom: '.5rem' }}>O que está incluído no PDF</div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '.875rem', color: 'var(--color-gray-600)', lineHeight: 2 }}>
            <li>Nome completo e número da OAB</li>
            <li>Bio e áreas de atuação</li>
            <li>Lista de serviços oferecidos com valores</li>
            <li>Informações de contato</li>
            <li>Design profissional com identidade Parceriza</li>
          </ul>
        </div>
      </div>
    </>
  );
}
