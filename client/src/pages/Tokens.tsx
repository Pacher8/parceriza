import { useEffect, useRef, useState } from 'react';
import { NavBar } from '../components/NavBar';

// ── Auth helpers ──────────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
type SaldoData = { saldo: number; nome: string; ganhosMes: number; gastosMes: number; valorReais: string };
type Transacao = { id: string; tipo: string; origem: string; quantidade: number; descricao: string; createdAt: string };
type Saque = { id: string; quantidadeTokens: number; valorReais: string; status: string; pixChave: string; createdAt: string };
type PacoteKey = '100' | '500' | '1000' | '5000';
type Pacote = { tokens: number; valorReais: number; descontoPercent: number };

const ORIGEM_ICON: Record<string, string> = {
  COMPRA: '💰', BONUS: '🎁', PAGAMENTO_SERVICO: '⚡', COMISSAO_PARCERIA: '🤝',
  ANUNCIO: '📢', REEMBOLSO: '📤', AJUSTE: '🔧',
};

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const data = await apiFetch<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(data.token); onLogin();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro'); } finally { setLoading(false); }
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
      </div>
    </>
  );
}

// ── PIX Modal ─────────────────────────────────────────────────────────────────
function PixModal({ data, onClose }: { data: { pixCopiaECola: string; qrCodeBase64: string; valor: number; tokens: number; expiraEm: string }; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false);
  const [segundos, setSegundos] = useState(() => Math.floor((new Date(data.expiraEm).getTime() - Date.now()) / 1000));
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  const urgente = segundos < 120;

  function copiar() {
    navigator.clipboard.writeText(data.pixCopiaECola).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Pagar com PIX</h3>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <div className="pix-modal">
          <div style={{ marginBottom: '.5rem', fontSize: '.9rem', color: 'var(--color-gray-600)' }}>
            R$ {data.valor.toFixed(2).replace('.', ',')} por <strong>{data.tokens} tokens</strong>
          </div>
          {data.qrCodeBase64 ? (
            <img src={`data:image/png;base64,${data.qrCodeBase64}`} alt="QR Code PIX" className="pix-qr" />
          ) : (
            <div className="pix-qr" style={{ background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', color: 'var(--color-gray-400)' }}>
              Gerando QR Code…
            </div>
          )}
          <div className="pix-code">{data.pixCopiaECola || 'Código PIX não disponível'}</div>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: '.75rem' }} onClick={copiar} type="button">
            {copiado ? '✓ Copiado!' : 'Copiar código PIX'}
          </button>
          <div className={`pix-timer ${urgente ? 'urgente' : ''}`}>
            ⏱ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--color-gray-400)', marginTop: '.3rem' }}>
            Os tokens serão creditados automaticamente após o pagamento.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Saque Modal ───────────────────────────────────────────────────────────────
function SaqueModal({ saldo, onClose, onSaque }: { saldo: number; onClose: () => void; onSaque: () => void }) {
  const [qtd, setQtd] = useState(1000);
  const [pix, setPix] = useState('');
  const [enviando, setEnviando] = useState(false);
  const valor = (qtd * 0.10).toFixed(2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setEnviando(true);
    try {
      await apiFetch('/api/tokens/sacar', { method: 'POST', body: JSON.stringify({ quantidadeTokens: qtd, pixChave: pix }) });
      onSaque(); onClose();
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro'); } finally { setEnviando(false); }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Solicitar Saque</h3><button className="modal-close" onClick={onClose} type="button">×</button></div>
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 'var(--radius)', padding: '.75rem', marginBottom: '.75rem', fontSize: '.82rem' }}>
            Saldo disponível: <strong>{saldo.toLocaleString('pt-BR')} tokens</strong> (R$ {(saldo * 0.10).toFixed(2).replace('.', ',')})
          </div>
          <div className="form-group">
            <label>Quantidade de tokens (mín. 1.000)</label>
            <input type="number" min={1000} max={saldo} step={100} value={qtd} onChange={(e) => setQtd(parseInt(e.target.value) || 1000)} required />
          </div>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)', margin: '.5rem 0' }}>
            = R$ {valor.replace('.', ',')}
          </div>
          <div className="form-group">
            <label>Chave PIX</label>
            <input value={pix} onChange={(e) => setPix(e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={enviando || qtd < 1000 || qtd > saldo || !pix}>
            {enviando ? 'Solicitando…' : 'Confirmar saque'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function Tokens() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [saldoData, setSaldoData] = useState<SaldoData | null>(null);
  const [extrato, setExtrato] = useState<Transacao[]>([]);
  const [pacotes, setPacotes] = useState<Record<PacoteKey, Pacote>>({} as Record<PacoteKey, Pacote>);
  const [saques, setSaques] = useState<Saque[]>([]);
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<null | { pixCopiaECola: string; qrCodeBase64: string; valor: number; tokens: number; expiraEm: string }>(null);
  const [comprando, setComprando] = useState<PacoteKey | null>(null);
  const [showSaque, setShowSaque] = useState(false);
  const [navRefresh, setNavRefresh] = useState(0);

  function handleLogin() { setTokenState(getToken()); }
  function handleLogout() { clearToken(); setTokenState(null); }

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<SaldoData>('/api/tokens/saldo'),
      apiFetch<{ transacoes: Transacao[] }>('/api/tokens/extrato'),
      apiFetch<{ pacotes: Record<PacoteKey, Pacote> }>('/api/tokens/pacotes'),
      apiFetch<{ saques: Saque[] }>('/api/tokens/saques'),
    ]).then(([s, e, p, sv]) => {
      setSaldoData(s);
      setExtrato(e.transacoes);
      setPacotes(p.pacotes);
      setSaques(sv.saques);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  async function handleComprar(key: PacoteKey) {
    setComprando(key);
    try {
      const data = await apiFetch<{ pixCopiaECola: string; qrCodeBase64: string; valor: number; tokens: number; expiraEm: string }>('/api/tokens/comprar', { method: 'POST', body: JSON.stringify({ pacote: key }) });
      setPixData(data);
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro ao gerar cobrança'); } finally { setComprando(null); }
  }

  function afterSaque() {
    apiFetch<SaldoData>('/api/tokens/saldo').then(setSaldoData).catch(() => {});
    apiFetch<{ saques: Saque[] }>('/api/tokens/saques').then((d) => setSaques(d.saques)).catch(() => {});
    setNavRefresh((n) => n + 1);
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  const pacoteKeys: PacoteKey[] = ['100', '500', '1000', '5000'];
  const SAQUE_STATUS: Record<string, string> = { SOLICITADO: 'Solicitado', PROCESSANDO: 'Processando', PAGO: 'Pago', CANCELADO: 'Cancelado' };
  const SAQUE_BADGE: Record<string, string> = { SOLICITADO: 'badge-pendente', PROCESSANDO: 'badge-area', PAGO: 'badge-pago', CANCELADO: 'badge-cancelado' };

  return (
    <>
      <NavBar onLogout={handleLogout} refreshKey={navRefresh} />
      <div className="container" style={{ maxWidth: 820 }}>
        {loading && <div className="loading">Carregando…</div>}

        {!loading && saldoData && (
          <>
            {/* Hero */}
            <div className="token-hero">
              <div className="token-hero-label">Seu saldo atual</div>
              <div className="token-hero-saldo">⚡ {saldoData.saldo.toLocaleString('pt-BR')}</div>
              <div className="token-hero-valor">≈ R$ {saldoData.valorReais.replace('.', ',')}</div>
              <div style={{ fontSize: '.8rem', opacity: .7, marginTop: '.4rem' }}>
                +{saldoData.ganhosMes} ganhos · {saldoData.gastosMes} gastos este mês
              </div>
              <div className="token-hero-actions">
                <button className="btn btn-hero" onClick={() => setShowSaque(true)} type="button">📤 Solicitar Saque</button>
              </div>
            </div>

            {/* Pacotes */}
            <div className="section-title">Comprar Tokens</div>
            <div className="pacotes-grid">
              {pacoteKeys.map((key) => {
                const p = pacotes[key];
                if (!p) return null;
                const valorOriginal = (p.tokens * 0.10).toFixed(2);
                return (
                  <div key={key} className={`pacote-card ${key === '1000' ? 'destaque' : ''}`}>
                    {p.descontoPercent > 0 && <div className="pacote-desconto">{p.descontoPercent}% OFF</div>}
                    <div className="pacote-tokens">{p.tokens.toLocaleString('pt-BR')}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>tokens</div>
                    <div className="pacote-valor">R$ {p.valorReais.toFixed(2).replace('.', ',')}</div>
                    {p.descontoPercent > 0 && <div className="pacote-preco-original">de R$ {valorOriginal.replace('.', ',')}</div>}
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '.25rem' }} onClick={() => handleComprar(key)} disabled={comprando === key} type="button">
                      {comprando === key ? 'Gerando…' : 'Comprar'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Extrato */}
            <div className="detail-card">
              <div className="section-title" style={{ marginBottom: '.75rem' }}>Extrato</div>
              {extrato.length === 0 && <div className="empty-state"><p>Nenhuma transação ainda.</p></div>}
              {extrato.map((t) => (
                <div key={t.id} className="extrato-row">
                  <div className={`extrato-icon ${t.tipo === 'CREDITO' ? 'credito' : 'debito'}`}>
                    {ORIGEM_ICON[t.origem] ?? '•'}
                  </div>
                  <div className="extrato-info">
                    <div className="extrato-desc">{t.descricao || t.origem}</div>
                    <div className="extrato-data">{new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className={`extrato-valor ${t.tipo === 'CREDITO' ? 'credito' : 'debito'}`}>
                    {t.tipo === 'CREDITO' ? '+' : '-'}{t.quantidade.toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>

            {/* Saques */}
            {saques.length > 0 && (
              <div className="detail-card" style={{ marginTop: '1rem' }}>
                <div className="section-title" style={{ marginBottom: '.75rem' }}>Saques Solicitados</div>
                {saques.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderBottom: '1px solid var(--color-gray-100)', fontSize: '.875rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.quantidadeTokens.toLocaleString('pt-BR')} tokens</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>{s.pixChave} · {new Date(s.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>R$ {Number(s.valorReais).toFixed(2).replace('.', ',')}</span>
                      <span className={`badge ${SAQUE_BADGE[s.status] ?? 'badge-area'}`}>{SAQUE_STATUS[s.status] ?? s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {pixData && <PixModal data={pixData} onClose={() => setPixData(null)} />}
      {showSaque && saldoData && (
        <SaqueModal saldo={saldoData.saldo} onClose={() => setShowSaque(false)} onSaque={afterSaque} />
      )}
    </>
  );
}
