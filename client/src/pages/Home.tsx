import { useEffect, useState } from 'react';

type Health = { status: string; uptime: number; timestamp: string };

export function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main>
      <h1>Parceriza</h1>
      <p>Plataforma em construção.</p>
      <section>
        <h2>API status</h2>
        {error && <p style={{ color: 'crimson' }}>Erro: {error}</p>}
        {health && (
          <pre>{JSON.stringify(health, null, 2)}</pre>
        )}
        {!health && !error && <p>Carregando…</p>}
      </section>
    </main>
  );
}
