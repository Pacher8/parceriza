import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { apiUrl } from '../lib/api';

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
      fetch(apiUrl('/api/ads/stats')).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(apiUrl('/api/areas')).then((r) => r.json()).catch(() => ({ areas: [] })),
      fetch(apiUrl('/api/jobs')).then((r) => r.json()).catch(() => ({ jobs: [] })),
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
        <h1 className="hero-title">A plataforma que irá<br />revolucionar a sua advocacia</h1>
        <p className="hero-sub">
          Parcerias inteligentes, IA que trabalha por você e processos monitorados em tempo real.
          Tudo que um escritório moderno precisa — em um só lugar.
        </p>
        <div className="hero-ctas">
          <Link to="/register" className="btn btn-primary" style={{ padding: '.85rem 2rem', fontSize: '1rem' }}>
            Quero ser Parceiro →
          </Link>
          <Link to="/jobs" className="btn btn-accent" style={{ padding: '.85rem 2rem', fontSize: '1rem' }}>
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
            { num: '1', icon: '📝', titulo: 'Crie seu perfil', desc: 'Cadastre-se, configure seu agente IA e publique seus serviços na vitrine ParcerIzA.' },
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

      {/* Ecossistema Preddita */}
      <section className="ecosistema-section">
        <div className="section-header">
          <h2>Ecossistema Preddita</h2>
          <p>Soluções jurídicas com inteligência artificial — tudo integrado na ParcerIzA</p>
        </div>
        <div className="ecosistema-grid">
          {/* JOBs Jurídicos */}
          <Link to="/jobs" className="ecosistema-card">
            <div className="ecosistema-icon" style={{ background: '#d1fae5' }}>⚖️</div>
            <div className="ecosistema-title">JOBs Jurídicos</div>
            <div className="ecosistema-desc">Marketplace B2B de serviços jurídicos entre advogados e departamentos jurídicos</div>
            <div className="ecosistema-footer">
              <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>Disponível</span>
              <span className="btn btn-sm btn-outline">Explorar →</span>
            </div>
          </Link>

          {/* Tributár.IA */}
          <Link to="/tributaria" className="ecosistema-card">
            <div className="ecosistema-icon" style={{ background: '#dbeafe' }}>📊</div>
            <div className="ecosistema-title">Tributár.IA</div>
            <div className="ecosistema-desc">Teses tributárias, análise de processos fiscais e recuperação de créditos com IA</div>
            <div className="ecosistema-footer">
              <span className="badge badge-blue">Disponível</span>
              <span className="btn btn-sm" style={{ background: '#1d4ed8', color: '#fff', border: 'none' }}>Acessar →</span>
            </div>
          </Link>

          {/* Penal.IA */}
          <div className="ecosistema-card disabled">
            <div className="ecosistema-icon" style={{ background: '#ede9fe' }}>🛡️</div>
            <div className="ecosistema-title">Penal.IA</div>
            <div className="ecosistema-desc">Análise de processos crime, estratégias penais e defesa com inteligência artificial</div>
            <div className="ecosistema-footer">
              <span className="badge badge-gray-sm">Em breve</span>
            </div>
          </div>

          {/* Trabalhista.IA */}
          <div className="ecosistema-card disabled">
            <div className="ecosistema-icon" style={{ background: '#fef3c7' }}>👥</div>
            <div className="ecosistema-title">Trabalhista.IA</div>
            <div className="ecosistema-desc">Análise trabalhista, cálculos de verbas rescisórias e estratégias com IA</div>
            <div className="ecosistema-footer">
              <span className="badge badge-gray-sm">Em breve</span>
            </div>
          </div>

          {/* Integre */}
          <a href="mailto:contato@preddita.com.br" className="ecosistema-card">
            <div className="ecosistema-icon" style={{ background: '#fff7ed' }}>🔌</div>
            <div className="ecosistema-title">Integre sua solução</div>
            <div className="ecosistema-desc">Parceiros externos podem integrar soluções jurídicas ao hub da Preddita via API</div>
            <div className="ecosistema-footer">
              <span className="badge badge-orange-sm">API aberta</span>
              <span className="btn btn-sm btn-accent">Saiba mais →</span>
            </div>
          </a>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ background: 'var(--color-primary-dark)', padding: '5rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, margin: '0 0 .75rem', letterSpacing: '-0.02em' }}>Pronto para começar?</h2>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '1rem', marginBottom: '1.75rem' }}>Junte-se a centenas de advogados que já automatizaram seu escritório com a ParcerIzA.</p>
        <Link to="/register" className="btn btn-white" style={{ padding: '.85rem 2.5rem', fontSize: '1rem' }}>Criar minha conta grátis →</Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div>
          <Link to="/">Parcer<span style={{ color: '#f97316' }}>I</span>z<span style={{ color: '#f97316' }}>A</span></Link>
          <Link to="/jobs">Marketplace</Link>
          <Link to="/juridico">Jurídico</Link>
          <Link to="/conquistas">Conquistas</Link>
          <Link to="/tokens">Tokens</Link>
        </div>
        <p>© {new Date().getFullYear()} Parcer<span style={{ color: '#f97316' }}>I</span>z<span style={{ color: '#f97316' }}>A</span> — Plataforma Jurídica Digital. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
