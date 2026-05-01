import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

type Oferta = {
  id: string;
  descricaoCustom: string | null;
  valorEstimadoMin: string | null;
  valorEstimadoMax: string | null;
  comissaoPct: number | null;
  destaque: boolean;
  totalLeads: number;
  totalFechados: number;
  advogado: { id: string; nome: string; oab: string; oabUf: string; bio: string | null; avatarUrl: string | null };
};

type Job = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  area: { nome: string; slug: string };
  ofertas: Oferta[];
};

const tipoBadgeClass: Record<string, string> = {
  JUDICIAL: 'badge badge-judicial',
  ADMINISTRATIVO: 'badge badge-administrativo',
  AMBOS: 'badge badge-ambos',
};

const tipoLabel: Record<string, string> = {
  JUDICIAL: 'Judicial',
  ADMINISTRATIVO: 'Administrativo',
  AMBOS: 'Ambos',
};

function initials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatBRL(val: string | null | undefined) {
  if (!val) return null;
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(num);
}

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`)
      .then((r) => (r.ok ? r.json() : r.json().then((b: { error: string }) => Promise.reject(new Error(b.error)))))
      .then((data) => setJob(data.job))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">Parceriza</Link>
        <Link to="/jobs" className="nav-link">Marketplace</Link>
        <Link to="/agente" className="nav-link">Meu Agente</Link>
        <Link to="/secretaria" className="nav-link">Secretaria</Link>
        <Link to="/juridico" className="nav-link">Jurídico</Link>
      </nav>
      <div className="container"><div className="loading">Carregando…</div></div>
    </>
  );

  if (error || !job) return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">Parceriza</Link>
        <Link to="/jobs" className="nav-link">Marketplace</Link>
        <Link to="/agente" className="nav-link">Meu Agente</Link>
        <Link to="/secretaria" className="nav-link">Secretaria</Link>
        <Link to="/juridico" className="nav-link">Jurídico</Link>
      </nav>
      <div className="container">
        <Link to="/jobs" className="back-link">← Voltar ao marketplace</Link>
        <div className="error-msg">{error ?? 'JOB não encontrado.'}</div>
      </div>
    </>
  );

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">Parceriza</Link>
        <Link to="/jobs" className="nav-link">Marketplace</Link>
        <Link to="/agente" className="nav-link">Meu Agente</Link>
        <Link to="/secretaria" className="nav-link">Secretaria</Link>
        <Link to="/juridico" className="nav-link">Jurídico</Link>
      </nav>

      <div className="container">
        <Link to="/jobs" className="back-link">← Voltar ao marketplace</Link>

        <div className="detail-card">
          <div className="detail-meta">
            <span className={tipoBadgeClass[job.tipo] ?? 'badge'}>{tipoLabel[job.tipo] ?? job.tipo}</span>
            <span className="badge badge-area">{job.area.nome}</span>
          </div>
          <h1 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 700 }}>{job.titulo}</h1>
          {job.descricao ? (
            <p className="detail-desc">{job.descricao}</p>
          ) : (
            <p style={{ color: 'var(--color-gray-400)', fontStyle: 'italic' }}>Sem descrição cadastrada.</p>
          )}
        </div>

        <div className="detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Advogados habilitados
              <span style={{ fontWeight: 400, color: 'var(--color-gray-400)', fontSize: '.85rem', marginLeft: '.5rem' }}>
                ({job.ofertas.length})
              </span>
            </h2>
            <Link to="#" className="btn btn-primary btn-sm">Quero me habilitar</Link>
          </div>

          {job.ofertas.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum advogado habilitado ainda</strong>
              <p>Seja o primeiro a ofertar este serviço na plataforma.</p>
            </div>
          ) : (
            <div className="oferta-list">
              {job.ofertas.map((oferta) => (
                <div key={oferta.id} className={`oferta-card${oferta.destaque ? ' destaque' : ''}`}>
                  <div className="oferta-avatar">{initials(oferta.advogado.nome)}</div>
                  <div className="oferta-info">
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="oferta-nome">{oferta.advogado.nome}</span>
                      <span className="badge badge-area" style={{ fontSize: '.7rem' }}>
                        OAB/{oferta.advogado.oabUf} {oferta.advogado.oab}
                      </span>
                      {oferta.destaque && <span className="badge badge-destaque">Destaque</span>}
                    </div>
                    <div className="oferta-sub">
                      {oferta.comissaoPct != null && (
                        <span>Comissão proposta: <strong>{oferta.comissaoPct}%</strong></span>
                      )}
                      {oferta.valorEstimadoMin != null && (
                        <span style={{ marginLeft: oferta.comissaoPct != null ? ' · ' : '' }}>
                          Honorários: <strong>
                            {formatBRL(oferta.valorEstimadoMin)}
                            {oferta.valorEstimadoMax ? ` – ${formatBRL(oferta.valorEstimadoMax)}` : ''}
                          </strong>
                        </span>
                      )}
                    </div>
                    {oferta.descricaoCustom && (
                      <p className="oferta-desc">{oferta.descricaoCustom}</p>
                    )}
                    <div className="oferta-stats">
                      <span className="oferta-stat"><strong>{oferta.totalLeads}</strong> leads recebidos</span>
                      <span className="oferta-stat"><strong>{oferta.totalFechados}</strong> fechamentos</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <button className="btn btn-outline btn-sm">Contato</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
