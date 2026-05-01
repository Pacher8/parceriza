import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

type Stats = { totalAdvogados: number; totalJobs: number; totalLeads: number; totalParcerias: number };
type Area = { id: string; nome: string; slug: string; descricao: string | null };
type Job = { id: string; titulo: string; descricao: string | null; tipo: string; area: { nome: string } };

const AREA_ICON: Record<string, string> = {
  tributario: '💰', previdenciario: '🏥', consumidor: '🛒', administrativo: '🏛️',
  societario: '🏢', trabalhista: '👷', ambiental: '🌿', civil: '⚖️',
  paralegal: '📋', imobiliario: '🏠', criminal: '🔒', familia: '👨‍👩‍👧',
};

export function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/ads/stats').then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/areas').then((r) => r.json()).catch(() => ({ areas: [] })),
      fetch('/api/jobs').then((r) => r.json()).catch(() => ({ jobs: [] })),
    ]).then(([s, a, j]) => {
      if (s) setStats(s);
      setAreas((a.areas ?? []).slice(0, 10));
      setJobs((j.jobs ?? []).slice(0, 3));
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-tagline">Plataforma Jurídica Digital</div>
        <h1 className="hero-title">O ecossistema jurídico<br />para advogados modernos</h1>
        <p className="hero-sub">
          Conecte-se com especialistas, automatize seu atendimento com IA,
          monitore processos em tempo real e expanda sua carteira de clientes.
        </p>
        <div className="hero-ctas">
          <Link to="/auth/register" className="btn btn-white" style={{ padding: '.75rem 2rem', fontSize: '1rem' }}>
            Quero ser Parceiro →
          </Link>
          <Link to="/jobs" className="btn btn-outline-white" style={{ padding: '.75rem 2rem', fontSize: '1rem' }}>
            Ver JOBs disponíveis
          </Link>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="stats-section">
          <div className="stats-grid">
            <div>
              <div className="stat-item-value">{stats.totalAdvogados.toLocaleString('pt-BR')}+</div>
              <div className="stat-item-label">Advogados cadastrados</div>
            </div>
            <div>
              <div className="stat-item-value">{stats.totalJobs.toLocaleString('pt-BR')}</div>
              <div className="stat-item-label">JOBs disponíveis</div>
            </div>
            <div>
              <div className="stat-item-value">{stats.totalLeads.toLocaleString('pt-BR')}+</div>
              <div className="stat-item-label">Leads gerados</div>
            </div>
            <div>
              <div className="stat-item-value">{stats.totalParcerias.toLocaleString('pt-BR')}+</div>
              <div className="stat-item-label">Parcerias ativas</div>
            </div>
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section className="como-funciona">
        <div className="section-header">
          <h2>Como funciona</h2>
          <p>Simples, rápido e poderoso — em 3 passos</p>
        </div>
        <div className="como-funciona-grid">
          {[
            { num: '1', icon: '📝', titulo: 'Crie seu perfil', desc: 'Cadastre-se, configure seu agente IA e publique seus serviços na vitrine Parceriza.' },
            { num: '2', icon: '🔗', titulo: 'Conecte-se', desc: 'Encontre oportunidades no marketplace, estabeleça parcerias e capte leads qualificados.' },
            { num: '3', icon: '💰', titulo: 'Cresça', desc: 'Gerencie cobranças, monitore processos e automatize o atendimento com inteligência artificial.' },
          ].map((p) => (
            <div key={p.num} className="passo-card">
              <div className="passo-num">{p.icon}</div>
              <div className="passo-titulo">{p.titulo}</div>
              <div className="passo-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Áreas */}
      {areas.length > 0 && (
        <section className="areas-section">
          <div className="section-header">
            <h2>Áreas de Atuação</h2>
            <p>Especialistas em todas as vertentes do direito brasileiro</p>
          </div>
          <div className="areas-home-grid">
            {areas.map((a) => (
              <Link key={a.id} to={`/jobs?area=${a.slug}`} className="area-home-card">
                <div className="area-home-icon">{AREA_ICON[a.slug] ?? '⚖️'}</div>
                <div className="area-home-nome">{a.nome}</div>
                {a.descricao && <div className="area-home-desc">{a.descricao}</div>}
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/jobs" className="btn btn-outline">Ver todos os JOBs →</Link>
          </div>
        </section>
      )}

      {/* JOBs em destaque */}
      {jobs.length > 0 && (
        <section className="jobs-destaque-section">
          <div className="section-header">
            <h2>JOBs em Destaque</h2>
            <p>Oportunidades com alta demanda no mercado</p>
          </div>
          <div className="jobs-destaque-grid">
            {jobs.map((j) => (
              <div key={j.id} className="job-destaque-card">
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${j.tipo === 'JUDICIAL' ? 'badge-judicial' : j.tipo === 'ADMINISTRATIVO' ? 'badge-administrativo' : 'badge-ambos'}`}>{j.tipo}</span>
                  <span className="badge badge-area">{j.area.nome}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.4rem' }}>{j.titulo}</div>
                {j.descricao && <div style={{ fontSize: '.8rem', color: 'var(--color-gray-600)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.descricao}</div>}
                <div style={{ marginTop: '.75rem' }}>
                  <Link to={`/jobs/${j.id}`} className="btn btn-outline btn-sm">Ver detalhes →</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section style={{ background: 'var(--color-primary)', padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: '0 0 .75rem' }}>Pronto para começar?</h2>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '1rem', marginBottom: '1.5rem' }}>Junte-se a centenas de advogados que já automatizaram seu escritório com a Parceriza.</p>
        <Link to="/agente" className="btn btn-white" style={{ padding: '.75rem 2.5rem', fontSize: '1rem' }}>Criar minha conta grátis →</Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div>
          <Link to="/">Parceriza</Link>
          <Link to="/jobs">Marketplace</Link>
          <Link to="/juridico">Jurídico</Link>
          <Link to="/conquistas">Conquistas</Link>
          <Link to="/tokens">Tokens</Link>
        </div>
        <p>© {new Date().getFullYear()} Parceriza — Plataforma Jurídica Digital. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
