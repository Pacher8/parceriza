import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken, apiUrl } from '../lib/api';

const LOGO = (
  <>Parcer<span style={{ color: '#f97316' }}>I</span>z<span style={{ color: '#f97316' }}>A</span></>
);

interface NavBarProps {
  onLogout?: () => void;
  refreshKey?: number;
}

export function NavBar({ onLogout, refreshKey = 0 }: NavBarProps) {
  const token = getToken();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) { setSaldo(null); return; }
    fetch(apiUrl('/api/tokens/saldo'), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { saldo: number } | null) => d && setSaldo(d.saldo))
      .catch(() => {});
  }, [token, refreshKey]);

  function close() { setMenuOpen(false); }

  const desktopNav = (
    <>
      <Link to="/jobs" className="nav-link">Marketplace</Link>

      <div className="nav-dropdown-wrapper">
        <span className="nav-link nav-dropdown-trigger">
          Soluções <span className="nav-dropdown-caret">▾</span>
        </span>
        <div className="nav-dropdown">
          <Link to="/jobs" className="nav-dropdown-item">
            <span className="nav-dropdown-icon">⚖️</span>
            <span className="nav-dropdown-label">JOBs Jurídicos</span>
          </Link>
          <Link to="/tributaria" className="nav-dropdown-item">
            <span className="nav-dropdown-icon">📊</span>
            <span className="nav-dropdown-label">Tributár.IA</span>
            <span className="badge badge-blue" style={{ fontSize: '.68rem' }}>Disponível</span>
          </Link>
          <span className="nav-dropdown-item disabled">
            <span className="nav-dropdown-icon">🛡️</span>
            <span className="nav-dropdown-label">Penal.IA</span>
            <span className="badge badge-gray-sm" style={{ fontSize: '.68rem' }}>Em breve</span>
          </span>
          <span className="nav-dropdown-item disabled">
            <span className="nav-dropdown-icon">👥</span>
            <span className="nav-dropdown-label">Trabalhista.IA</span>
            <span className="badge badge-gray-sm" style={{ fontSize: '.68rem' }}>Em breve</span>
          </span>
          <div className="nav-dropdown-sep" />
          <a href="mailto:contato@preddita.com.br" className="nav-dropdown-item">
            <span className="nav-dropdown-icon">🔌</span>
            <span className="nav-dropdown-label">Integre sua solução</span>
          </a>
        </div>
      </div>

      <Link to="/agente" className="nav-link">Meu Agente</Link>
      <Link to="/juridico" className="nav-link">Jurídico</Link>
      <Link to="/conquistas" className="nav-link">Conquistas</Link>
      {token && <Link to="/ads" className="nav-link">Meus Anúncios</Link>}
    </>
  );

  const mobileItems = (
    <>
      <Link to="/jobs" className="nav-link" onClick={close}>Marketplace</Link>
      <span className="nav-mobile-section">Soluções</span>
      <Link to="/jobs" className="nav-link nav-link-sub" onClick={close}>⚖️ JOBs Jurídicos</Link>
      <Link to="/tributaria" className="nav-link nav-link-sub" onClick={close}>
        📊 Tributár.IA <span className="badge badge-blue" style={{ fontSize: '.65rem', marginLeft: '.3rem' }}>Disponível</span>
      </Link>
      <span className="nav-link nav-link-sub disabled">
        🛡️ Penal.IA <span className="badge badge-gray-sm" style={{ fontSize: '.65rem', marginLeft: '.3rem' }}>Em breve</span>
      </span>
      <span className="nav-link nav-link-sub disabled">
        👥 Trabalhista.IA <span className="badge badge-gray-sm" style={{ fontSize: '.65rem', marginLeft: '.3rem' }}>Em breve</span>
      </span>
      <Link to="/agente" className="nav-link" onClick={close}>Meu Agente</Link>
      <Link to="/juridico" className="nav-link" onClick={close}>Jurídico</Link>
      <Link to="/conquistas" className="nav-link" onClick={close}>Conquistas</Link>
      {token && <Link to="/ads" className="nav-link" onClick={close}>Meus Anúncios</Link>}
    </>
  );

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">{LOGO}</Link>

        <div className="nav-links">{desktopNav}</div>

        <div className="nav-end">
          {token && (
            <Link to="/tokens" className="token-badge-nav">
              ⚡ {saldo !== null ? saldo.toLocaleString('pt-BR') : '…'}
            </Link>
          )}
          {onLogout && (
            <button onClick={onLogout} className="btn btn-ghost btn-sm" type="button">Sair</button>
          )}
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
        {mobileItems}
        <div className="nav-mobile-footer">
          {token && (
            <Link to="/tokens" className="token-badge-nav" onClick={close}>
              ⚡ {saldo !== null ? saldo.toLocaleString('pt-BR') : '…'}
            </Link>
          )}
          {onLogout && (
            <button
              onClick={() => { onLogout(); close(); }}
              className="btn btn-ghost btn-sm"
              type="button"
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </>
  );
}
