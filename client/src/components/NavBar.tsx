import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken, apiUrl } from '../lib/api';

interface NavBarProps {
  onLogout?: () => void;
  refreshKey?: number; // bump to re-fetch balance
}

export function NavBar({ onLogout, refreshKey = 0 }: NavBarProps) {
  const token = getToken();
  const [saldo, setSaldo] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { setSaldo(null); return; }
    fetch(apiUrl('/api/tokens/saldo'), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { saldo: number } | null) => d && setSaldo(d.saldo))
      .catch(() => {});
  }, [token, refreshKey]);

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">Parceriza</Link>
      <Link to="/jobs" className="nav-link">Marketplace</Link>
      <Link to="/agente" className="nav-link">Meu Agente</Link>
      <Link to="/juridico" className="nav-link">Jurídico</Link>
      <Link to="/conquistas" className="nav-link">Conquistas</Link>
      {token && <Link to="/ads" className="nav-link">Meus Anúncios</Link>}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        {token && (
          <Link to="/tokens" className="token-badge-nav">
            ⚡ {saldo !== null ? saldo.toLocaleString('pt-BR') : '…'}
          </Link>
        )}
        {onLogout && (
          <button onClick={onLogout} className="btn btn-ghost btn-sm" type="button">Sair</button>
        )}
      </div>
    </nav>
  );
}
