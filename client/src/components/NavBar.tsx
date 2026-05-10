import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken, apiUrl } from '../lib/api';

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

  const navLinks = (
    <>
      <Link to="/jobs" className="nav-link" onClick={close}>Marketplace</Link>
      <Link to="/agente" className="nav-link" onClick={close}>Meu Agente</Link>
      <Link to="/juridico" className="nav-link" onClick={close}>Jurídico</Link>
      <Link to="/conquistas" className="nav-link" onClick={close}>Conquistas</Link>
      {token && <Link to="/ads" className="nav-link" onClick={close}>Meus Anúncios</Link>}
    </>
  );

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">Parcer<span style={{ color: '#f97316' }}>I</span>z<span style={{ color: '#f97316' }}>A</span></Link>

        <div className="nav-links">{navLinks}</div>

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
        {navLinks}
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
