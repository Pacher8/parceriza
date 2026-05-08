import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export function Privacidade() {
  return (
    <>
      <NavBar />
      <div className="container" style={{ maxWidth: 760, padding: '2rem 1.25rem 4rem' }}>
        <div className="page-header">
          <h1>Política de Privacidade</h1>
          <p>Última atualização: maio de 2026 · Versão 1.0</p>
        </div>

        <div style={{ lineHeight: 1.8, color: 'var(--color-gray-700)', fontSize: '.9375rem' }}>

          <Section title="1. Quem Somos (Controlador)">
            <p>A <strong>Parceriza</strong>, operada pela HMP Advocacia &amp; Preddita, com sede em Jaraguá do Sul — SC, é a controladora dos dados pessoais tratados nesta plataforma, nos termos da Lei nº 13.709/2018 (LGPD).</p>
            <p>Encarregado de Dados (DPO): <a href="mailto:privacidade@parceriza.com.br" style={{ color: 'var(--color-primary)' }}>privacidade@parceriza.com.br</a></p>
          </Section>

          <Section title="2. Dados Coletados e Finalidades">
            <p>Coletamos apenas os dados necessários para a prestação dos serviços. Abaixo, cada categoria com sua finalidade e base legal:</p>

            <Table rows={[
              { categoria: 'Dados cadastrais (nome, OAB, UF, e-mail)', finalidade: 'Criar e manter sua conta; identificar o usuário como advogado habilitado', baseLegal: 'Execução de contrato (art. 7º, V, LGPD)', retencao: 'Durante a vigência da conta + 5 anos após encerramento' },
              { categoria: 'Dados profissionais (áreas de atuação, teses, serviços)', finalidade: 'Exibir seu perfil a outros advogados no marketplace; realizar match de parcerias', baseLegal: 'Consentimento explícito (art. 7º, I, LGPD)', retencao: 'Durante a vigência da conta' },
              { categoria: 'Dados de contato (telefone)', finalidade: 'Comunicação operacional e suporte', baseLegal: 'Consentimento explícito (art. 7º, I, LGPD) — campo opcional', retencao: 'Durante a vigência da conta' },
              { categoria: 'Dados de navegação (IP, logs de acesso, dispositivo)', finalidade: 'Segurança, prevenção a fraudes, diagnóstico técnico', baseLegal: 'Legítimo interesse (art. 7º, IX, LGPD)', retencao: '6 meses (Marco Civil da Internet)' },
              { categoria: 'Conversas com agentes de IA', finalidade: 'Continuidade do atendimento; melhoria do serviço', baseLegal: 'Execução de contrato (art. 7º, V, LGPD)', retencao: '12 meses ou até exclusão pelo usuário' },
              { categoria: 'Dados financeiros (honorários, cobranças via Asaas)', finalidade: 'Gestão financeira do escritório do advogado', baseLegal: 'Execução de contrato (art. 7º, V, LGPD)', retencao: '5 anos (obrigação legal fiscal)' },
            ]} />
          </Section>

          <Section title="3. Dados Públicos">
            <p>Informações como nome completo, número de inscrição na OAB e estado de inscrição originária são <strong>dados de acesso público</strong>, disponíveis nos cadastros oficiais da OAB, e seu tratamento é permitido pela LGPD com base no legítimo interesse e na execução do contrato (art. 7º, V e IX).</p>
            <p>Não realizamos raspagem de dados de terceiros além do que é estritamente necessário para verificação de credenciais profissionais.</p>
          </Section>

          <Section title="4. Compartilhamento de Dados">
            <p><strong>Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins comerciais próprios.</strong></p>
            <p>Podemos compartilhar dados nas seguintes hipóteses, com as salvaguardas adequadas:</p>
            <ul>
              <li><strong>Entre advogados na plataforma:</strong> dados de perfil profissional (nome, OAB, áreas, serviços) são visíveis a outros usuários autenticados para viabilizar parcerias;</li>
              <li><strong>Provedores de serviço (suboperadores):</strong> Anthropic (IA), Asaas (pagamentos), Google (agenda) — contratados com cláusulas de proteção de dados compatíveis com a LGPD;</li>
              <li><strong>Exigência legal:</strong> quando determinado por autoridade competente, ordem judicial ou obrigação legal;</li>
              <li><strong>DataJud/CNJ:</strong> consultas processuais utilizam dados fornecidos pelo próprio usuário; nenhum dado é enviado ao CNJ além do número do processo ou CPF/CNPJ já de posse do advogado.</li>
            </ul>
          </Section>

          <Section title="5. Armazenamento e Segurança">
            <p>Os dados são armazenados em servidores seguros (Railway + PostgreSQL) com criptografia em trânsito (TLS 1.2+) e em repouso. Senhas são armazenadas com hash bcrypt (12 rounds) — nunca em texto plano.</p>
            <p>Adotamos medidas técnicas e organizacionais adequadas para proteger os dados contra acesso não autorizado, alteração, divulgação ou destruição. Em caso de incidente de segurança com potencial impacto ao titular, notificaremos a ANPD e os usuários afetados dentro dos prazos legais.</p>
          </Section>

          <Section title="6. Cookies e Tecnologias Semelhantes">
            <p>A plataforma utiliza <strong>localStorage</strong> para manter a sessão autenticada (token JWT). Não utilizamos cookies de rastreamento de terceiros nem redes de publicidade comportamental.</p>
          </Section>

          <Section title="7. Transferência Internacional de Dados">
            <p>Ao utilizar a IA (Anthropic), dados de conversação podem ser processados em servidores nos Estados Unidos. A Anthropic adere ao Data Privacy Framework e às cláusulas contratuais padrão aprovadas pela Comissão Europeia, garantindo nível de proteção equivalente à LGPD.</p>
            <p>A Parceriza configura o uso da API Anthropic com <strong>Zero Data Retention (ZDR)</strong> para dados sensíveis de clientes, impedindo que as mensagens sejam utilizadas para treinamento de modelos.</p>
          </Section>

          <Section title="8. Prazo de Retenção">
            <p>Mantemos os dados pelo tempo necessário para as finalidades descritas nesta Política ou pelo prazo mínimo exigido por lei. Após o encerramento da conta:</p>
            <ul>
              <li>Dados cadastrais e financeiros: retidos por 5 anos para cumprimento de obrigações legais;</li>
              <li>Dados de navegação: eliminados em até 6 meses;</li>
              <li>Conversas com IA: eliminadas em até 30 dias após o encerramento;</li>
              <li>Dados profissionais e de perfil: eliminados imediatamente após confirmação do encerramento.</li>
            </ul>
          </Section>

          <Section title="9. Direitos do Titular">
            <p>Nos termos dos arts. 17 a 22 da LGPD, você tem direito a:</p>
            <ul>
              <li><strong>Confirmação e acesso:</strong> saber quais dados tratamos e receber cópia;</li>
              <li><strong>Correção:</strong> atualizar dados incompletos, inexatos ou desatualizados;</li>
              <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade;</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado e interoperável (CSV/JSON) para transferência a outro fornecedor;</li>
              <li><strong>Eliminação:</strong> excluir dados tratados com base em consentimento, a qualquer momento;</li>
              <li><strong>Informação sobre compartilhamento:</strong> saber com quem seus dados são compartilhados;</li>
              <li><strong>Revogação do consentimento:</strong> retirar o consentimento sem prejuízo do tratamento realizado anteriormente;</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento realizado com base em legítimo interesse, quando em desconformidade com a lei;</li>
              <li><strong>Revisão de decisões automatizadas:</strong> solicitar revisão humana de decisões tomadas exclusivamente por processos automatizados.</li>
            </ul>
            <p>Para exercer qualquer direito, envie solicitação para <a href="mailto:privacidade@parceriza.com.br" style={{ color: 'var(--color-primary)' }}>privacidade@parceriza.com.br</a>. Responderemos em até 15 dias úteis.</p>
          </Section>

          <Section title="10. Menores de Idade">
            <p>A plataforma é destinada exclusivamente a advogados, profissionais com capacidade civil plena. Não coletamos dados de menores de 18 anos intencionalmente.</p>
          </Section>

          <Section title="11. Alterações desta Política">
            <p>Esta Política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 15 dias. A versão vigente sempre estará disponível em <strong>/privacidade</strong>.</p>
          </Section>

          <Section title="12. Contato e DPO">
            <p>Para dúvidas, exercício de direitos ou reclamações relacionadas ao tratamento de dados pessoais:</p>
            <p>
              <strong>Encarregado de Dados (DPO) — Parceriza</strong><br />
              E-mail: <a href="mailto:privacidade@parceriza.com.br" style={{ color: 'var(--color-primary)' }}>privacidade@parceriza.com.br</a><br />
              Você também pode registrar reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>www.gov.br/anpd</a>
            </p>
          </Section>

        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-gray-100)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/termos" className="btn btn-outline btn-sm">← Termos de Uso</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Criar conta</Link>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '.6rem', paddingBottom: '.4rem', borderBottom: '1px solid var(--color-gray-100)' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>{children}</div>
    </section>
  );
}

type TableRow = { categoria: string; finalidade: string; baseLegal: string; retencao: string };

function Table({ rows }: { rows: TableRow[] }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
        <thead>
          <tr style={{ background: 'var(--color-gray-50)' }}>
            {['Categoria de dado', 'Finalidade', 'Base legal (LGPD)', 'Retenção'].map((h) => (
              <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid var(--color-gray-200)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--color-gray-100)', background: i % 2 === 0 ? '#fff' : 'var(--color-gray-50)' }}>
              <td style={{ padding: '.5rem .75rem', fontWeight: 500 }}>{r.categoria}</td>
              <td style={{ padding: '.5rem .75rem' }}>{r.finalidade}</td>
              <td style={{ padding: '.5rem .75rem' }}>{r.baseLegal}</td>
              <td style={{ padding: '.5rem .75rem', whiteSpace: 'nowrap' }}>{r.retencao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
