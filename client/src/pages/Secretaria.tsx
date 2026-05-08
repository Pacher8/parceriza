import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

// ── Auth helpers (same pattern as Agente) ─────────────────────────────────────

function getToken() { return localStorage.getItem('parceriza_token'); }
function setToken(t: string) { localStorage.setItem('parceriza_token', t); }
function clearToken() { localStorage.removeItem('parceriza_token'); }

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Mensagem = { id: string; papel: 'USER' | 'ASSISTANT'; conteudo: string; tokensUsados: number | null; createdAt: string };
type Conversa = { id: string; modulo: string; clienteNome: string | null; createdAt: string; _count: { mensagens: number } };
type Evento = { id: string | null; titulo: string | null; inicio: string | null; fim: string | null; descricao?: string | null };
type Slot = { dia: string; inicio: string; fim: string };
type Cobranca = { id: string; customer: string; value: number; status: string; billingType: string; dueDate: string; description: string | null };
type DocItem = { nome: string; descricao: string; obrigatorio: boolean };
type Documento = { id: string; nome: string; origem: string; status: string; resumoIA: string | null; createdAt: string };

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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </>
  );
}

// ── Chat panel (shared) ───────────────────────────────────────────────────────

function ChatPanel({ modulo }: { modulo: 'AGENDA' | 'FINANCEIRO' | 'CONTROLADORIA' }) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ conversas: Conversa[] }>(`/api/secretaria/conversas?modulo=${modulo}`)
      .then((d) => setConversas(d.conversas))
      .catch(() => {});
  }, [modulo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function carregarConversa(id: string) {
    setConversaId(id);
    setError(null);
    try {
      const d = await apiFetch<{ conversa: { mensagens: Mensagem[] } }>(`/api/secretaria/conversas/${id}`);
      setMensagens(d.conversa.mensagens);
    } catch { setError('Erro ao carregar conversa'); }
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

    const tmpUser: Mensagem = { id: `u-${Date.now()}`, papel: 'USER', conteudo: msg, tokensUsados: null, createdAt: new Date().toISOString() };
    setMensagens((prev) => [...prev, tmpUser]);

    try {
      const data = await apiFetch<{ resposta: string; conversaId: string; tokensUsados: number }>('/api/secretaria/conversar', {
        method: 'POST',
        body: JSON.stringify({ modulo, mensagem: msg, conversaId }),
      });
      const isNew = !conversaId;
      setConversaId(data.conversaId);
      const tmpAssistant: Mensagem = { id: `a-${Date.now()}`, papel: 'ASSISTANT', conteudo: data.resposta, tokensUsados: data.tokensUsados, createdAt: new Date().toISOString() };
      setMensagens((prev) => [...prev, tmpAssistant]);
      if (isNew) {
        setConversas((prev) => [{ id: data.conversaId, modulo, clienteNome: null, createdAt: new Date().toISOString(), _count: { mensagens: 2 } }, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
      setMensagens((prev) => prev.filter((m) => m.id !== tmpUser.id));
    } finally {
      setEnviando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e as unknown as React.FormEvent); }
  }

  return (
    <div className="secretaria-panel" style={{ display: 'flex', flexDirection: 'column', height: 560 }}>
      <div className="secretaria-panel-header">
        <h3>Agente — {modulo === 'AGENDA' ? 'Agenda' : modulo === 'FINANCEIRO' ? 'Financeiro' : 'Controladoria'}</h3>
      </div>
      <div className="chat-toolbar">
        <select value={conversaId ?? ''} onChange={(e) => { const v = e.target.value; v ? carregarConversa(v) : novaConversa(); }}>
          <option value="">+ Nova conversa</option>
          {conversas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.clienteNome ?? `Conversa ${new Date(c.createdAt).toLocaleDateString('pt-BR')}`} ({c._count.mensagens} msgs)
            </option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={novaConversa} type="button">Nova</button>
      </div>
      {error && <div className="error-msg" style={{ margin: '.5rem 1rem 0' }}>{error}</div>}
      <div className="chat-messages" style={{ flex: 1 }}>
        {mensagens.length === 0 && <div className="chat-empty">Envie uma mensagem para a secretária.</div>}
        {mensagens.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.papel === 'USER' ? 'user' : 'assistant'}`}>
            {m.conteudo}
            {m.papel === 'ASSISTANT' && m.tokensUsados != null && (
              <div className="chat-bubble-meta">{m.tokensUsados} tokens</div>
            )}
          </div>
        ))}
        {enviando && <div className="chat-bubble assistant" style={{ opacity: 0.6 }}>Digitando…</div>}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-row" onSubmit={enviar}>
        <textarea
          className="chat-input"
          placeholder="Digite sua mensagem… (Enter para enviar)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={enviando}
          rows={1}
        />
        <button type="submit" className="btn btn-primary" disabled={enviando || !texto.trim()} style={{ alignSelf: 'flex-end' }}>
          Enviar
        </button>
      </form>
    </div>
  );
}

// ── Agenda tab ────────────────────────────────────────────────────────────────

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getWeekDays(): Date[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}

function AgendaTab({ conectado }: { conectado: boolean }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [slotsLivres, setSlotsLivres] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [agendandoId, setAgendandoId] = useState<string | null>(null);

  const weekDays = getWeekDays();
  const hoje = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!conectado) return;
    setLoading(true);
    apiFetch<{ eventos: Evento[]; slotsLivres: Slot[] }>('/api/secretaria/agenda/disponibilidade')
      .then((d) => { setEventos(d.eventos); setSlotsLivres(d.slotsLivres); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conectado]);

  async function conectarGoogle() {
    try {
      const { url } = await apiFetch<{ url: string }>('/api/secretaria/agenda/auth-url');
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao obter URL');
    }
  }

  async function agendarSlot(slot: Slot) {
    const titulo = prompt('Título do compromisso:');
    if (!titulo) return;
    setAgendandoId(`${slot.dia}-${slot.inicio}`);
    try {
      const inicio = new Date(`${slot.dia}T${slot.inicio}:00`).toISOString();
      const fim = new Date(`${slot.dia}T${slot.fim}:00`).toISOString();
      await apiFetch('/api/secretaria/agenda/agendar', {
        method: 'POST',
        body: JSON.stringify({ titulo, inicio, fim }),
      });
      const d = await apiFetch<{ eventos: Evento[]; slotsLivres: Slot[] }>('/api/secretaria/agenda/disponibilidade');
      setEventos(d.eventos);
      setSlotsLivres(d.slotsLivres);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao agendar');
    } finally {
      setAgendandoId(null);
    }
  }

  return (
    <div className="secretaria-layout">
      <div>
        {!conectado && (
          <div className="connect-banner">
            <p>Conecte o Google Calendar para visualizar e gerenciar sua agenda.</p>
            <button className="btn btn-primary" onClick={conectarGoogle} type="button">
              Conectar Google Calendar
            </button>
          </div>
        )}
        <div className="secretaria-panel">
          <div className="secretaria-panel-header">
            <h3>Agenda da Semana</h3>
            {conectado && !loading && (
              <span style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>
                {slotsLivres.length} slots livres
              </span>
            )}
          </div>
          <div className="secretaria-panel-body">
            {loading && <div className="loading">Carregando agenda…</div>}
            {!loading && (
              <div className="week-grid">
                {weekDays.map((day) => {
                  const diaStr = day.toISOString().slice(0, 10);
                  const isToday = diaStr === hoje;
                  const dayEventos = eventos.filter((e) => e.inicio?.slice(0, 10) === diaStr);
                  const daySlots = slotsLivres.filter((s) => s.dia === diaStr);
                  return (
                    <div key={diaStr} className="week-col">
                      <div className={`week-col-header ${isToday ? 'today' : ''}`}>
                        <div>{DAYS_PT[day.getDay()]}</div>
                        <div style={{ fontWeight: 400, fontSize: '.65rem' }}>{day.getDate()}/{day.getMonth() + 1}</div>
                      </div>
                      {dayEventos.map((ev, i) => (
                        <div key={ev.id ?? i} className="week-event" title={ev.titulo ?? ''}>
                          <div>{ev.inicio?.slice(11, 16)}</div>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.titulo}</div>
                        </div>
                      ))}
                      {daySlots.slice(0, 4).map((slot) => (
                        <button
                          key={slot.inicio}
                          className="week-slot"
                          style={{ border: 'none', cursor: 'pointer', width: '100%' }}
                          onClick={() => agendarSlot(slot)}
                          disabled={agendandoId === `${slot.dia}-${slot.inicio}`}
                          title={`Agendar ${slot.inicio}–${slot.fim}`}
                          type="button"
                        >
                          {slot.inicio}
                        </button>
                      ))}
                      {dayEventos.length === 0 && daySlots.length === 0 && (
                        <div className="week-empty">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatPanel modulo="AGENDA" />
    </div>
  );
}

// ── Financeiro tab ────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: 'badge-pago',
  RECEIVED: 'badge-pago',
  PENDING: 'badge-pendente',
  OVERDUE: 'badge-vencido',
  CANCELLED: 'badge-cancelado',
};
const STATUS_PT: Record<string, string> = {
  CONFIRMED: 'Pago', RECEIVED: 'Pago', PENDING: 'Pendente', OVERDUE: 'Vencido', CANCELLED: 'Cancelado',
};

function FinanceiroTab() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [honorarios, setHonorarios] = useState<{ descricao: string; valor: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clienteId: '', valor: '', vencimento: '', descricao: '', tipo: 'PIX' });
  const [novoClienteForm, setNovoClienteForm] = useState({ nome: '', cpfCnpj: '', email: '' });
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [, setClienteId] = useState('');
  const [subTab, setSubTab] = useState<'cobrancas' | 'novo-cliente'>('cobrancas');

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Cobranca[] }>('/api/secretaria/financeiro/cobrancas').catch(() => ({ data: [] })),
      apiFetch<{ tabela: { descricao: string; valor: number }[] }>('/api/secretaria/financeiro/honorarios').catch(() => ({ tabela: [] })),
    ]).then(([c, h]) => {
      setCobrancas(c.data ?? []);
      setHonorarios(h.tabela ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCriarCliente(e: React.FormEvent) {
    e.preventDefault();
    setCriandoCliente(true);
    try {
      const res = await apiFetch<{ cliente: { id: string; name: string } }>('/api/secretaria/financeiro/cliente', {
        method: 'POST',
        body: JSON.stringify({ nome: novoClienteForm.nome, cpfCnpj: novoClienteForm.cpfCnpj, email: novoClienteForm.email || null }),
      });
      setClienteId(res.cliente.id);
      setForm((f) => ({ ...f, clienteId: res.cliente.id }));
      setSubTab('cobrancas');
      setShowForm(true);
      alert(`Cliente criado! ID Asaas: ${res.cliente.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar cliente');
    } finally {
      setCriandoCliente(false);
    }
  }

  async function handleGerarCobranca(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/api/secretaria/financeiro/cobranca', {
        method: 'POST',
        body: JSON.stringify({
          clienteAsaasId: form.clienteId,
          valor: parseFloat(form.valor),
          vencimento: form.vencimento,
          descricao: form.descricao || null,
          tipo: form.tipo,
        }),
      });
      const c = await apiFetch<{ data: Cobranca[] }>('/api/secretaria/financeiro/cobrancas');
      setCobrancas(c.data ?? []);
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar cobrança');
    }
  }

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="secretaria-layout">
      <div>
        {honorarios.length > 0 && (
          <div className="secretaria-panel" style={{ marginBottom: '1rem' }}>
            <div className="secretaria-panel-header"><h3>Tabela de Honorários</h3></div>
            <div className="secretaria-panel-body">
              {honorarios.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid var(--color-gray-100)', fontSize: '.875rem' }}>
                  <span>{h.descricao}</span>
                  <strong>{formatBRL(h.valor)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="secretaria-panel">
          <div className="secretaria-panel-header">
            <h3>Cobranças</h3>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSubTab('novo-cliente'); setShowForm(false); }} type="button">+ Cliente</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setSubTab('cobrancas'); }} type="button">+ Cobrança</button>
            </div>
          </div>
          <div className="secretaria-panel-body">
            {subTab === 'novo-cliente' && (
              <form onSubmit={handleCriarCliente} style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '.75rem', fontSize: '.875rem' }}>Novo cliente no Asaas</div>
                <div className="form-group">
                  <label>Nome</label>
                  <input value={novoClienteForm.nome} onChange={(e) => setNovoClienteForm((f) => ({ ...f, nome: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>CPF/CNPJ</label>
                  <input value={novoClienteForm.cpfCnpj} onChange={(e) => setNovoClienteForm((f) => ({ ...f, cpfCnpj: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>E-mail (opcional)</label>
                  <input type="email" value={novoClienteForm.email} onChange={(e) => setNovoClienteForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={criandoCliente}>{criandoCliente ? 'Criando…' : 'Criar cliente'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSubTab('cobrancas')}>Cancelar</button>
                </div>
              </form>
            )}

            {showForm && subTab === 'cobrancas' && (
              <form onSubmit={handleGerarCobranca} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-gray-50)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontWeight: 600, marginBottom: '.75rem', fontSize: '.875rem' }}>Gerar cobrança</div>
                <div className="form-group">
                  <label>ID do cliente Asaas</label>
                  <input value={form.clienteId} onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))} placeholder="cus_..." required />
                </div>
                <div className="form-group">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Vencimento</label>
                  <input type="date" value={form.vencimento} onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <input value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm">Gerar</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
                </div>
              </form>
            )}

            {loading && <div className="loading">Carregando…</div>}
            {!loading && cobrancas.length === 0 && <div className="empty-state">Nenhuma cobrança encontrada.</div>}
            {!loading && cobrancas.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="charges-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Vencimento</th>
                      <th>Tipo</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cobrancas.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontSize: '.78rem', color: 'var(--color-gray-500)' }}>{c.customer.slice(0, 12)}…</td>
                        <td style={{ fontWeight: 600 }}>{formatBRL(c.value)}</td>
                        <td>{new Date(c.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                        <td>{c.billingType}</td>
                        <td><span className={`badge ${STATUS_CLASS[c.status] ?? 'badge-area'}`}>{STATUS_PT[c.status] ?? c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatPanel modulo="FINANCEIRO" />
    </div>
  );
}

// ── Controladoria tab ─────────────────────────────────────────────────────────

const DOC_STATUS_ICON: Record<string, string> = {
  RECEBIDO: '✅',
  PROCESSANDO: '⏳',
  PROCESSADO: '✔️',
  ERRO: '❌',
};

function ControladoriaTab() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<DocItem[] | null>(null);
  const [checklistCliente, setChecklistCliente] = useState('');
  const [solicitandoForm, setSolicitandoForm] = useState({ tipoCaso: '', clienteNome: '', descricao: '' });
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    apiFetch<{ documentos: Documento[] }>('/api/secretaria/controladoria/documentos')
      .then((d) => setDocumentos(d.documentos))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSolicitarDocs(e: React.FormEvent) {
    e.preventDefault();
    setSolicitando(true);
    setChecklist(null);
    try {
      const res = await apiFetch<{ documentos: DocItem[]; clienteNome: string }>('/api/secretaria/controladoria/solicitar-docs', {
        method: 'POST',
        body: JSON.stringify(solicitandoForm),
      });
      setChecklist(res.documentos);
      setChecklistCliente(res.clienteNome);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao solicitar documentos');
    } finally {
      setSolicitando(false);
    }
  }

  async function atualizarStatus(id: string, status: string) {
    try {
      await apiFetch(`/api/secretaria/controladoria/documentos/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setDocumentos((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    } catch { /* silent */ }
  }

  return (
    <div className="secretaria-layout">
      <div>
        <div className="secretaria-panel" style={{ marginBottom: '1rem' }}>
          <div className="secretaria-panel-header"><h3>Solicitar Checklist de Documentos</h3></div>
          <div className="secretaria-panel-body">
            <form onSubmit={handleSolicitarDocs}>
              <div className="form-group">
                <label>Tipo de caso</label>
                <input
                  value={solicitandoForm.tipoCaso}
                  onChange={(e) => setSolicitandoForm((f) => ({ ...f, tipoCaso: e.target.value }))}
                  placeholder="Ex: Reclamação trabalhista, Divórcio litigioso…"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nome do cliente</label>
                <input
                  value={solicitandoForm.clienteNome}
                  onChange={(e) => setSolicitandoForm((f) => ({ ...f, clienteNome: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descrição adicional (opcional)</label>
                <textarea
                  value={solicitandoForm.descricao}
                  onChange={(e) => setSolicitandoForm((f) => ({ ...f, descricao: e.target.value }))}
                  style={{ minHeight: 60 }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={solicitando}>
                {solicitando ? 'Gerando checklist…' : 'Gerar checklist com IA'}
              </button>
            </form>

            {checklist && checklist.length > 0 && (
              <div className="checklist-result">
                <div style={{ fontWeight: 600, marginBottom: '.5rem', fontSize: '.875rem' }}>
                  Documentos necessários — {checklistCliente}
                </div>
                {checklist.map((doc, i) => (
                  <div key={i} className="checklist-item">
                    <span>{doc.obrigatorio ? '🔴' : '🟡'}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{doc.nome}</div>
                      {doc.descricao && <div style={{ fontSize: '.75rem', color: 'var(--color-gray-500)' }}>{doc.descricao}</div>}
                    </div>
                    {doc.obrigatorio && <span className="checklist-obrigatorio">Obrigatório</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="secretaria-panel">
          <div className="secretaria-panel-header">
            <h3>Documentos Recebidos</h3>
            <span style={{ fontSize: '.75rem', color: 'var(--color-gray-400)' }}>{documentos.length} docs</span>
          </div>
          <div className="secretaria-panel-body">
            {loading && <div className="loading">Carregando…</div>}
            {!loading && documentos.length === 0 && (
              <div className="empty-state">
                <p>Nenhum documento recebido ainda.</p>
              </div>
            )}
            {documentos.map((doc) => (
              <div key={doc.id} className="doc-item">
                <span className="doc-status-icon">{DOC_STATUS_ICON[doc.status] ?? '📄'}</span>
                <div className="doc-info">
                  <div className="doc-nome">{doc.nome}</div>
                  <div className="doc-meta">
                    {doc.origem} · {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    {doc.resumoIA && ` · ${doc.resumoIA.slice(0, 60)}…`}
                  </div>
                </div>
                <select
                  value={doc.status}
                  onChange={(e) => atualizarStatus(doc.id, e.target.value)}
                  style={{ fontSize: '.75rem', padding: '.2rem .4rem', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius)' }}
                >
                  <option value="RECEBIDO">Recebido</option>
                  <option value="PROCESSANDO">Processando</option>
                  <option value="PROCESSADO">Processado</option>
                  <option value="ERRO">Erro</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ChatPanel modulo="CONTROLADORIA" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabId = 'agenda' | 'financeiro' | 'controladoria';

export function Secretaria() {
  const [searchParams] = useSearchParams();
  const [token, setTokenState] = useState<string | null>(getToken);
  const [tab, setTab] = useState<TabId>((searchParams.get('tab') as TabId) ?? 'agenda');
  const [agendaStatus, setAgendaStatus] = useState<{ conectado: boolean } | null>(null);
  const [, setLoadingStatus] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingStatus(true);
    apiFetch<{ conectado: boolean }>('/api/secretaria/agenda/status')
      .then(setAgendaStatus)
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [token]);

  // After Google OAuth redirect
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setAgendaStatus({ conectado: true });
    }
  }, [searchParams]);

  function handleLogin() { setTokenState(getToken()); }
  function handleLogout() { clearToken(); setTokenState(null); setAgendaStatus(null); }

  if (!token) return <LoginForm onLogin={handleLogin} />;

  return (
    <>
      <NavBar onLogout={handleLogout} />

      <div className="container">
        <div className="page-header">
          <h1>Secretária Virtual</h1>
          <p>Três agentes especializados para agenda, cobranças e documentos.</p>
        </div>

        <div className="tabs">
          {(['agenda', 'financeiro', 'controladoria'] as TabId[]).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} type="button">
              {t === 'agenda' ? '📅 Agenda' : t === 'financeiro' ? '💰 Financeiro' : '📂 Controladoria'}
            </button>
          ))}
        </div>

        {tab === 'agenda' && (
          <AgendaTab conectado={agendaStatus?.conectado ?? false} />
        )}
        {tab === 'financeiro' && <FinanceiroTab />}
        {tab === 'controladoria' && <ControladoriaTab />}
      </div>
    </>
  );
}
