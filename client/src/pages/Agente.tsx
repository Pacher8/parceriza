import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { getToken, setToken, clearToken, apiFetch } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type AgenteConfig = {
  id: string;
  nome: string;
  personalidade: string | null;
  tomDeVoz: string | null;
  temperatura: number;
  promptSistema: string | null;
  modelo: string;
};

type Mensagem = {
  id: string;
  papel: 'USER' | 'ASSISTANT';
  conteudo: string;
  tokensUsados: number | null;
  createdAt: string;
};

type Conversa = {
  id: string;
  canal: string;
  clienteNome: string | null;
  createdAt: string;
  _count: { mensagens: number };
};

// ── Login form ────────────────────────────────────────────────────────────────

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
      const data = await apiFetch<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
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
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
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

// ── Config tab ────────────────────────────────────────────────────────────────

function ConfigTab({ config, onSave }: { config: AgenteConfig; onSave: (c: AgenteConfig) => void }) {
  const [form, setForm] = useState({ ...config });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await apiFetch<{ config: AgenteConfig }>('/api/agente/config', {
        method: 'PUT',
        body: JSON.stringify({
          nome: form.nome,
          personalidade: form.personalidade || null,
          tomDeVoz: form.tomDeVoz || null,
          temperatura: form.temperatura,
          promptSistema: form.promptSistema || null,
          modelo: form.modelo,
        }),
      });
      onSave(data.config);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-msg">{error}</div>}

      <div className="form-group">
        <label>Nome do agente</label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="form-group">
        <label>Personalidade</label>
        <textarea
          value={form.personalidade ?? ''}
          onChange={(e) => set('personalidade', e.target.value)}
          placeholder="Ex: Atencioso, direto ao ponto, empático com clientes em situação difícil…"
          maxLength={1000}
        />
      </div>

      <div className="form-group">
        <label>Tom de voz</label>
        <textarea
          value={form.tomDeVoz ?? ''}
          onChange={(e) => set('tomDeVoz', e.target.value)}
          placeholder="Ex: Formal mas acessível, evita jargão técnico excessivo…"
          maxLength={500}
          style={{ minHeight: 60 }}
        />
      </div>

      <div className="form-group">
        <label>Temperatura (criatividade): {form.temperatura.toFixed(2)}</label>
        <div className="range-row">
          <span style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>Preciso</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.temperatura}
            onChange={(e) => set('temperatura', parseFloat(e.target.value))}
          />
          <span style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>Criativo</span>
        </div>
      </div>

      <div className="form-group">
        <label>Modelo de IA</label>
        <select value={form.modelo} onChange={(e) => set('modelo', e.target.value)}>
          <option value="CLAUDE_HAIKU">Claude Haiku (rápido, econômico)</option>
          <option value="CLAUDE_SONNET">Claude Sonnet (equilibrado)</option>
          <option value="CLAUDE_OPUS">Claude Opus (mais capaz)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Prompt customizado (instruções adicionais)</label>
        <textarea
          value={form.promptSistema ?? ''}
          onChange={(e) => set('promptSistema', e.target.value)}
          placeholder="Ex: Sempre mencione que oferecemos consulta inicial gratuita. Foque em casos trabalhistas…"
          maxLength={3000}
          style={{ minHeight: 100 }}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar configurações'}
      </button>
    </form>
  );
}

// ── Chat tab ──────────────────────────────────────────────────────────────────

function ChatTab() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ conversas: Conversa[] }>('/api/agente/conversas')
      .then((d) => setConversas(d.conversas))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function carregarConversa(id: string) {
    setConversaId(id);
    setError(null);
    try {
      const d = await apiFetch<{ conversa: { mensagens: Mensagem[] } }>(`/api/agente/conversas/${id}`);
      setMensagens(d.conversa.mensagens);
    } catch {
      setError('Erro ao carregar conversa');
    }
  }

  function novaConversa() {
    setConversaId(null);
    setMensagens([]);
    setError(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const msg = texto.trim();
    if (!msg || enviando) return;
    setTexto('');
    setEnviando(true);
    setError(null);

    const msgUser: Mensagem = {
      id: `tmp-${Date.now()}`,
      papel: 'USER',
      conteudo: msg,
      tokensUsados: null,
      createdAt: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, msgUser]);

    try {
      const data = await apiFetch<{
        resposta: string;
        conversaId: string;
        tokensUsados: number;
      }>('/api/agente/conversar', {
        method: 'POST',
        body: JSON.stringify({ mensagem: msg, conversaId }),
      });

      const isNew = !conversaId;
      setConversaId(data.conversaId);

      const msgAssistant: Mensagem = {
        id: `tmp-${Date.now() + 1}`,
        papel: 'ASSISTANT',
        conteudo: data.resposta,
        tokensUsados: data.tokensUsados,
        createdAt: new Date().toISOString(),
      };
      setMensagens((prev) => [...prev, msgAssistant]);

      if (isNew) {
        setConversas((prev) => [
          {
            id: data.conversaId,
            canal: 'TESTE',
            clienteNome: null,
            createdAt: new Date().toISOString(),
            _count: { mensagens: 2 },
          },
          ...prev,
        ]);
      } else {
        setConversas((prev) =>
          prev.map((c) =>
            c.id === data.conversaId
              ? { ...c, _count: { mensagens: c._count.mensagens + 2 } }
              : c,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      setMensagens((prev) => prev.filter((m) => m.id !== msgUser.id));
    } finally {
      setEnviando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(e as unknown as React.FormEvent);
    }
  }

  return (
    <div>
      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="chat-container">
        <div className="chat-toolbar">
          <select
            value={conversaId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') novaConversa();
              else carregarConversa(v);
            }}
          >
            <option value="">+ Nova conversa</option>
            {conversas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clienteNome
                  ? `${c.clienteNome} — ${new Date(c.createdAt).toLocaleDateString('pt-BR')}`
                  : `Conversa de ${new Date(c.createdAt).toLocaleDateString('pt-BR')} (${c._count.mensagens} msgs)`}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={novaConversa} type="button">
            Nova
          </button>
        </div>

        <div className="chat-messages">
          {mensagens.length === 0 && (
            <div className="chat-empty">
              Envie uma mensagem para iniciar a conversa com o agente.
            </div>
          )}
          {mensagens.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.papel === 'USER' ? 'user' : 'assistant'}`}>
              {m.conteudo}
              {m.papel === 'ASSISTANT' && m.tokensUsados != null && (
                <div className="chat-bubble-meta">{m.tokensUsados} tokens</div>
              )}
            </div>
          ))}
          {enviando && (
            <div className="chat-bubble assistant" style={{ opacity: 0.6 }}>
              Digitando…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={enviar}>
          <textarea
            className="chat-input"
            placeholder="Digite sua mensagem… (Enter para enviar, Shift+Enter para nova linha)"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={enviando}
            rows={1}
          />
          <button
            type="submit"
            className="btn btn-accent"
            disabled={enviando || !texto.trim()}
            style={{ alignSelf: 'flex-end' }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Agente() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [config, setConfig] = useState<AgenteConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [tab, setTab] = useState<'config' | 'chat'>('config');

  useEffect(() => {
    if (!token) return;
    setLoadingConfig(true);
    apiFetch<{ config: AgenteConfig }>('/api/agente/config')
      .then((d) => setConfig(d.config))
      .catch(() => {
        clearToken();
        setTokenState(null);
      })
      .finally(() => setLoadingConfig(false));
  }, [token]);

  function handleLogin() {
    setTokenState(getToken());
  }

  function handleLogout() {
    clearToken();
    setTokenState(null);
    setConfig(null);
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <>
      <NavBar onLogout={handleLogout} />

      <div className="container" style={{ maxWidth: 760 }}>
        <div className="page-header">
          <h1>Meu Agente IA</h1>
          <p>Configure o assistente pessoal e teste sua conversa antes de publicar.</p>
        </div>

        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'config' ? 'active' : ''}`}
            onClick={() => setTab('config')}
            type="button"
          >
            Configurar
          </button>
          <button
            className={`tab-btn ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}
            type="button"
          >
            Testar
          </button>
        </div>

        {loadingConfig && <div className="loading">Carregando…</div>}

        {!loadingConfig && config && tab === 'config' && (
          <div className="detail-card">
            <ConfigTab config={config} onSave={setConfig} />
          </div>
        )}

        {!loadingConfig && tab === 'chat' && <ChatTab />}
      </div>
    </>
  );
}
