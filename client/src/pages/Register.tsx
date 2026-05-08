import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { apiFetch, setToken } from '../lib/api';

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
] as const;

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '', email: '', password: '', confirmPassword: '',
    oab: '', oabUf: '' as typeof UF_LIST[number] | '',
    telefone: '',
  });
  const [termos, setTermos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (!/^\d{4,6}$/.test(form.oab)) {
      setError('Número OAB inválido — somente dígitos (4 a 6 caracteres).');
      return;
    }
    if (!form.oabUf) {
      setError('Selecione o estado da OAB.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          password: form.password,
          oab: form.oab,
          oabUf: form.oabUf,
          telefone: form.telefone || undefined,
        }),
      });
      setToken(data.token);
      navigate('/agente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <NavBar />
      <div className="login-card" style={{ maxWidth: 480 }}>
        <h2>Cadastro</h2>
        <p style={{ fontSize: '.875rem', color: 'var(--color-gray-500)', marginBottom: '1.25rem' }}>
          Plataforma exclusiva para advogados. Tenha seu número OAB em mãos.
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Dr. João da Silva"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="joao@escritorio.adv.br"
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>Confirmar senha</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              placeholder="Repita a senha"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Número OAB</label>
              <input
                type="text"
                value={form.oab}
                onChange={(e) => set('oab', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                inputMode="numeric"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Estado</label>
              <select
                value={form.oabUf}
                onChange={(e) => set('oabUf', e.target.value as typeof UF_LIST[number])}
                required
                style={{ minWidth: 90 }}
              >
                <option value="">UF</option>
                {UF_LIST.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ fontSize: '.75rem', color: 'var(--color-gray-400)', margin: '.25rem 0 1rem' }}>
            Inscrição originária. OABs suplementares podem ser adicionadas no perfil.
          </p>

          <div className="form-group">
            <label>Telefone <span style={{ color: 'var(--color-gray-400)', fontWeight: 400 }}>(opcional)</span></label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => set('telefone', e.target.value)}
              placeholder="(47) 99999-9999"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', margin: '1rem 0 .75rem', fontSize: '.875rem', color: 'var(--color-gray-600)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termos}
              onChange={(e) => setTermos(e.target.checked)}
              style={{ marginTop: '.15rem', flexShrink: 0 }}
              required
            />
            <span>
              Li e aceito os{' '}
              <Link to="/termos" target="_blank" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Termos de Uso</Link>
              {' '}e a{' '}
              <Link to="/privacidade" target="_blank" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Política de Privacidade</Link>
            </span>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !termos}
          >
            {loading ? 'Criando conta…' : 'Criar Conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.875rem', color: 'var(--color-gray-500)' }}>
          Já tem conta?{' '}
          <Link to="/agente" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </>
  );
}
