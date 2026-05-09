import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simula delay de envio — funcionalidade real a implementar
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setEnviado(true);
  }

  return (
    <>
      <NavBar />
      <div className="login-card">
        <h2>Recuperar senha</h2>

        {!enviado ? (
          <>
            <p style={{ fontSize: '.875rem', color: 'var(--color-gray-500)', marginBottom: '1.25rem' }}>
              Informe o e-mail cadastrado e enviaremos as instruções de recuperação.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Enviando…' : 'Enviar instruções'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📧</div>
            <p style={{ fontSize: '.9375rem', color: 'var(--color-gray-700)', lineHeight: 1.7, marginBottom: '1rem' }}>
              Se o e-mail <strong>{email}</strong> estiver cadastrado,
              você receberá as instruções em breve.
            </p>
            <p style={{ fontSize: '.8rem', color: 'var(--color-gray-500)' }}>
              Não recebeu?{' '}
              <a href="mailto:suporte@parceriza.com.br" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                suporte@parceriza.com.br
              </a>
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.875rem', color: 'var(--color-gray-500)' }}>
          <Link to="/agente" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Voltar ao login</Link>
        </p>
      </div>
    </>
  );
}
