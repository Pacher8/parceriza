import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { getToken, apiUrl, apiFetch } from '../lib/api';

type Job = { id: string; titulo: string; descricao: string | null; tipo: string };
type Msg = { papel: 'USER' | 'ASSISTANT'; conteudo: string };

const WELCOME: Msg = {
  papel: 'ASSISTANT',
  conteudo:
    'Olá! Sou o Agente Tributário IA da Parceriza, especialista em direito tributário brasileiro. Posso ajudar com:\n\n• Análise de teses tributárias\n• Recuperação de créditos fiscais (PIS/COFINS, ICMS, IRPJ)\n• Transação tributária e negociação com Fisco\n• Procedimentos administrativos e recursos\n• LC 224/2025 e novas obrigações fiscais\n\nComo posso ajudar hoje?',
};

function TribChat() {
  const token = getToken();
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, enviando]);

  async function enviar() {
    if (!input.trim() || enviando) return;
    const msg = input.trim();
    setInput('');
    setError(null);
    setEnviando(true);
    setMsgs((prev) => [...prev, { papel: 'USER', conteudo: msg }]);

    try {
      const data = await apiFetch<{ resposta: string; conversaId: string }>(
        '/api/agente/conversar',
        { method: 'POST', body: JSON.stringify({ mensagem: msg, conversaId }) },
      );
      setConversaId(data.conversaId);
      setMsgs((prev) => [...prev, { papel: 'ASSISTANT', conteudo: data.resposta }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
      setMsgs((prev) => prev.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="trib-login-gate">
        <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🔒</div>
        <h3>Acesso ao Agente Tributário</h3>
        <p>Faça login para conversar com o Agente Tributário IA e obter análises personalizadas.</p>
        <Link to="/login" className="btn btn-trib" style={{ marginRight: '.75rem' }}>Entrar</Link>
        <Link to="/register" className="btn btn-outline">Criar conta grátis</Link>
      </div>
    );
  }

  return (
    <div className="trib-chat-container">
      <div className="trib-chat-header">
        <div className="trib-chat-avatar">⚖️</div>
        <div>
          <div className="trib-chat-name">Agente Tributário IA</div>
          <div className="trib-chat-status">Especialista em direito tributário brasileiro</div>
        </div>
      </div>

      <div className="trib-chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className={m.papel === 'USER' ? 'trib-bubble-user' : 'trib-bubble-assistant'}>
            {m.conteudo}
          </div>
        ))}
        {enviando && (
          <div className="trib-bubble-assistant" style={{ opacity: .55 }}>Analisando…</div>
        )}
        <div ref={endRef} />
      </div>

      {error && <div className="error-msg" style={{ margin: '.5rem 1rem 0', flexShrink: 0 }}>{error}</div>}

      <div className="trib-chat-input-row">
        <textarea
          className="trib-chat-input"
          placeholder="Pergunte sobre teses tributárias, créditos fiscais, transação tributária…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          rows={1}
        />
        <button
          className="btn btn-trib"
          onClick={enviar}
          disabled={enviando || !input.trim()}
          type="button"
        >
          {enviando ? '…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

export function Tributaria() {
  const [teses, setTeses] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/jobs?area=tributario&limit=10'))
      .then((r) => r.json())
      .then((d: { jobs?: Job[] }) => setTeses(d.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      {/* Header */}
      <header className="trib-header">
        <Link to="/" className="trib-back-pill">← Voltar ao hub</Link>
        <div className="trib-logo">
          <span style={{ color: '#93c5fd' }}>Tributár</span>
          <span style={{ color: '#f97316' }}>.IA</span>
        </div>
        <p className="trib-tagline">Inteligência artificial para o direito tributário</p>
        <span className="trib-powered">⚡ Powered by Claude · Preddita</span>
      </header>

      {/* Teses */}
      <section className="trib-teses-section">
        <div className="section-header">
          <h2 style={{ color: '#1d4ed8' }}>Teses Tributárias</h2>
          <p>JOBs especializados disponíveis no marketplace</p>
        </div>

        {loading && <div className="loading">Carregando teses…</div>}

        {!loading && teses.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma tese tributária encontrada. <Link to="/jobs" style={{ color: '#1d4ed8' }}>Ver todos os JOBs →</Link></p>
          </div>
        )}

        {!loading && teses.length > 0 && (
          <div className="trib-teses-grid">
            {teses.map((t) => (
              <div key={t.id} className="trib-tese-card">
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  <span
                    className="badge"
                    style={t.tipo === 'JUDICIAL'
                      ? { background: '#dbeafe', color: '#1e40af' }
                      : t.tipo === 'ADMINISTRATIVO'
                        ? { background: '#fef9c3', color: '#854d0e' }
                        : { background: '#f3e8ff', color: '#6b21a8' }
                    }
                  >
                    {t.tipo}
                  </span>
                </div>
                <div className="trib-tese-title">{t.titulo}</div>
                {t.descricao && <div className="trib-tese-desc">{t.descricao}</div>}
                <div className="trib-tese-footer">
                  <Link to={`/jobs/${t.id}`} className="btn btn-sm btn-outline">Ver detalhes →</Link>
                  <button
                    className="btn btn-sm btn-trib"
                    type="button"
                    onClick={() => {
                      document.getElementById('trib-agent')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Analisar com IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Agente */}
      <section className="trib-agent-section" id="trib-agent">
        <div className="trib-agent-header">
          <h2>Agente Tributário IA</h2>
          <p>Especialista em direito tributário brasileiro — pergunte sobre teses, créditos e procedimentos</p>
        </div>
        <TribChat />
      </section>

      {/* Footer */}
      <footer className="home-footer" style={{ marginTop: 'auto' }}>
        <div>
          <Link to="/">Parcer<span style={{ color: '#f97316' }}>I</span>z<span style={{ color: '#f97316' }}>A</span></Link>
          <Link to="/jobs">Marketplace</Link>
          <Link to="/tributaria">Tributár.IA</Link>
          <Link to="/juridico">Jurídico</Link>
        </div>
        <p>© {new Date().getFullYear()} ParcerIzA · Preddita — Plataforma Jurídica Digital</p>
      </footer>
    </div>
  );
}
