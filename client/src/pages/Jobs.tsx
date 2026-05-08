import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { apiUrl } from '../lib/api';

type AdFeed = { id: string; titulo: string; descricao: string; mediaUrl: string | null; posicionamento: string };
type Area = { nome: string; slug: string };

type Job = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'JUDICIAL' | 'ADMINISTRATIVO' | 'AMBOS';
  area: Area;
  _count: { ofertas: number };
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

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [adsTop, setAdsTop] = useState<AdFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'tabela'>('cards');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(apiUrl('/api/jobs')).then((r) => r.json()),
      fetch(apiUrl('/api/areas')).then((r) => r.json()),
      fetch(apiUrl('/api/ads/feed?posicionamento=BANNER_BUSCA&limite=2')).then((r) => r.json()).catch(() => ({ anuncios: [] })),
    ])
      .then(([jobsData, areasData, adsData]) => {
        setJobs(jobsData.jobs ?? []);
        setAreas(areasData.areas ?? []);
        setAdsTop(adsData.anuncios ?? []);
      })
      .catch(() => setError('Erro ao carregar os dados.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase();
    return jobs.filter((j) => {
      if (filtroArea && j.area.slug !== filtroArea) return false;
      if (filtroTipo && j.tipo !== filtroTipo) return false;
      if (q && !j.titulo.toLowerCase().includes(q) && !j.descricao?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jobs, filtroArea, filtroTipo, busca]);

  return (
    <>
      <NavBar />

      <div className="container">
        <div className="page-header">
          <h1>Marketplace de JOBs Jurídicos</h1>
          <p>Encontre especialistas ou oferte seus serviços em áreas de alta demanda.</p>
        </div>

        <div className="filter-bar">
          <input
            type="search"
            placeholder="Buscar JOB ou descrição…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
            <option value="">Todas as áreas</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>{a.nome}</option>
            ))}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="JUDICIAL">Judicial</option>
            <option value="ADMINISTRATIVO">Administrativo</option>
            <option value="AMBOS">Ambos</option>
          </select>
          <span className="filter-count">{filtered.length} JOB{filtered.length !== 1 ? 's' : ''}</span>
          <div className="view-toggle">
            <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}>Cards</button>
            <button className={view === 'tabela' ? 'active' : ''} onClick={() => setView('tabela')}>Tabela</button>
          </div>
        </div>

        {/* Anúncios Banner Busca */}
        {adsTop.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {adsTop.map((ad) => (
              <div key={ad.id} className="ad-card-sponsored">
                <div className="ad-sponsored-badge">Patrocinado</div>
                {ad.mediaUrl && <img src={ad.mediaUrl} alt={ad.titulo} className="ad-media" />}
                <div className="ad-card-title">{ad.titulo}</div>
                <div className="ad-card-desc">{ad.descricao}</div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}
        {loading && <div className="loading">Carregando JOBs…</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <strong>Nenhum JOB encontrado</strong>
            <p>Tente ajustar os filtros ou{' '}
              <Link to="#" style={{ color: 'var(--color-primary)' }}>sugira um novo JOB</Link>.
            </p>
          </div>
        )}

        {!loading && view === 'cards' && filtered.length > 0 && (
          <div className="job-grid">
            {filtered.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <p className="job-card-title">{job.titulo}</p>
                </div>
                <div className="job-card-meta">
                  <span className={tipoBadgeClass[job.tipo]}>{tipoLabel[job.tipo]}</span>
                  <span className="badge badge-area">{job.area.nome}</span>
                  {job._count.ofertas >= 5 && (
                    <span className="badge badge-destaque">Alta demanda</span>
                  )}
                </div>
                {job.descricao && <p className="job-card-desc">{job.descricao}</p>}
                <div className="job-card-footer">
                  <span className="job-card-offers">
                    {job._count.ofertas} advogado{job._count.ofertas !== 1 ? 's' : ''} habilitado{job._count.ofertas !== 1 ? 's' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">Ver detalhes</Link>
                    <Link to={`/jobs/${job.id}`} className="btn btn-primary btn-sm">Quero ofertar</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && view === 'tabela' && filtered.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>JOB</th>
                  <th>Área</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'center' }}>Advogados habilitados</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id}>
                    <td className="td-title">
                      {job.titulo}
                      {job._count.ofertas >= 5 && (
                        <> <span className="badge badge-destaque" style={{ verticalAlign: 'middle' }}>Alta demanda</span></>
                      )}
                    </td>
                    <td><span className="badge badge-area">{job.area.nome}</span></td>
                    <td><span className={tipoBadgeClass[job.tipo]}>{tipoLabel[job.tipo]}</span></td>
                    <td style={{ textAlign: 'center' }}>{job._count.ofertas}</td>
                    <td>
                      <div className="td-actions">
                        <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">Ver detalhes</Link>
                        <Link to={`/jobs/${job.id}`} className="btn btn-primary btn-sm">Ofertar</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
