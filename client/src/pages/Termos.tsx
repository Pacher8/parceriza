import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export function Termos() {
  return (
    <>
      <NavBar />
      <div className="container" style={{ maxWidth: 760, padding: '2rem 1.25rem 4rem' }}>
        <div className="page-header">
          <h1>Termos de Uso</h1>
          <p>Última atualização: maio de 2026</p>
        </div>

        <div style={{ lineHeight: 1.8, color: 'var(--color-gray-700)', fontSize: '.9375rem' }}>

          <Section title="1. Aceitação dos Termos">
            <p>Ao criar uma conta ou utilizar a plataforma Parceriza, você declara que leu, compreendeu e concorda com estes Termos de Uso e com a nossa <Link to="/privacidade" style={{ color: 'var(--color-primary)' }}>Política de Privacidade</Link>. Se não concordar com qualquer disposição, não utilize a plataforma.</p>
          </Section>

          <Section title="2. Descrição da Plataforma">
            <p>A Parceriza é uma plataforma digital B2B voltada exclusivamente a advogados regularmente inscritos na Ordem dos Advogados do Brasil (OAB). A plataforma oferece:</p>
            <ul>
              <li>Marketplace de JOBs jurídicos para parcerias entre advogados;</li>
              <li>Agente de Inteligência Artificial para atendimento e automatização;</li>
              <li>Secretária virtual com módulos de agenda, financeiro e controladoria;</li>
              <li>Retaguarda jurídica com consulta e monitoramento processual;</li>
              <li>Sistema de tokens PCT para engajamento e recompensas;</li>
              <li>Plataforma de anúncios jurídicos segmentados.</li>
            </ul>
          </Section>

          <Section title="3. Elegibilidade e Cadastro">
            <p>Para utilizar a Parceriza, o usuário deve:</p>
            <ul>
              <li>Ser advogado inscrito na OAB, com inscrição ativa;</li>
              <li>Fornecer informações verdadeiras, precisas e atualizadas no cadastro;</li>
              <li>Ter capacidade civil plena para celebrar contratos;</li>
              <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            </ul>
            <p>A Parceriza se reserva o direito de suspender ou encerrar contas que violem estes Termos ou apresentem informações falsas.</p>
          </Section>

          <Section title="4. Condutas Permitidas e Proibidas">
            <p>O usuário compromete-se a utilizar a plataforma em conformidade com o Código de Ética e Disciplina da OAB e com a legislação vigente. É expressamente proibido:</p>
            <ul>
              <li>Captar clientela de forma vedada pelo Estatuto da OAB;</li>
              <li>Realizar publicidade mercantil incompatível com o exercício da advocacia;</li>
              <li>Compartilhar credenciais de acesso com terceiros não autorizados;</li>
              <li>Inserir informações falsas, enganosas ou que violem direitos de terceiros;</li>
              <li>Tentar acessar dados de outros usuários sem autorização;</li>
              <li>Utilizar a plataforma para fins ilícitos ou contrários à ética profissional.</li>
            </ul>
          </Section>

          <Section title="5. Tokens PCT (Parceriza Token)">
            <p>Os tokens PCT são créditos digitais de engajamento interno, sem valor monetário legal. Podem ser obtidos por meio de ações na plataforma (onboarding, avaliações, indicações, serviços) e utilizados para acesso a funcionalidades premium, anúncios e serviços paralegais.</p>
            <p>Os tokens não são transferíveis para terceiros fora da plataforma, não constituem moeda ou ativo financeiro e podem ser ajustados, suspensos ou descontinuados mediante aviso prévio de 30 dias.</p>
          </Section>

          <Section title="6. Marketplace de JOBs e Parcerias">
            <p>A Parceriza atua como intermediária tecnológica entre advogados, não sendo parte nas parcerias ou contratos celebrados. Cabe exclusivamente aos advogados envolvidos negociar, formalizar e executar os acordos de parceria, honorários e comissões, em conformidade com o Estatuto da OAB e legislação aplicável.</p>
            <p>A Parceriza não se responsabiliza por inadimplemento, desentendimentos ou litígios entre os usuários decorrentes de parcerias formadas na plataforma.</p>
          </Section>

          <Section title="7. Inteligência Artificial">
            <p>Os agentes de IA disponibilizados na plataforma são ferramentas de apoio administrativo e informativo. As respostas geradas não constituem consultoria jurídica, parecer ou assessoria legal. O usuário é o único responsável pelas decisões tomadas com base nas informações fornecidas pela IA.</p>
            <p>O uso da IA é sujeito às políticas dos provedores de modelos (Anthropic), incorporadas por referência.</p>
          </Section>

          <Section title="8. Proteção de Dados (LGPD)">
            <p>A Parceriza trata dados pessoais em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD). Os dados coletados são, em sua maioria, <strong>informações públicas disponíveis na internet</strong>, como nome completo, número de inscrição na OAB e estado de inscrição originária, que são dados de acesso público nos cadastros da OAB.</p>
            <p>Dados adicionais fornecidos voluntariamente (e-mail, telefone, áreas de atuação, teses) são tratados com base no consentimento do titular e na execução do contrato de prestação de serviços.</p>
            <p><strong>Não compartilhamos dados pessoais com terceiros</strong> sem o consentimento prévio do titular, exceto quando exigido por lei ou ordem judicial.</p>
            <p>Para detalhes completos sobre coleta, finalidade, base legal e retenção de dados, consulte nossa <Link to="/privacidade" style={{ color: 'var(--color-primary)' }}>Política de Privacidade</Link>.</p>
            <p>O titular dos dados tem direito a:</p>
            <ul>
              <li><strong>Acesso:</strong> confirmar a existência de tratamento e acessar seus dados;</li>
              <li><strong>Correção:</strong> solicitar a atualização de dados incompletos ou incorretos;</li>
              <li><strong>Exclusão:</strong> solicitar a eliminação dos dados desnecessários ou tratados em desconformidade;</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado;</li>
              <li><strong>Revogação do consentimento:</strong> retirar o consentimento a qualquer momento;</li>
              <li><strong>Oposição:</strong> opor-se ao tratamento realizado com base em legítimo interesse.</li>
            </ul>
            <p>Para exercer seus direitos, entre em contato pelo e-mail <a href="mailto:privacidade@parceriza.com.br" style={{ color: 'var(--color-primary)' }}>privacidade@parceriza.com.br</a>.</p>
          </Section>

          <Section title="9. Propriedade Intelectual">
            <p>Todo o conteúdo da plataforma (marca, software, layout, textos, imagens, base de dados) é de propriedade da Parceriza ou licenciado por terceiros. É vedada a reprodução, distribuição ou uso comercial sem autorização prévia e expressa.</p>
            <p>O usuário mantém a propriedade intelectual sobre o conteúdo que inserir na plataforma (perfil, teses, serviços), concedendo à Parceriza licença não exclusiva para exibi-lo aos demais usuários conforme o funcionamento da plataforma.</p>
          </Section>

          <Section title="10. Responsabilidade Limitada">
            <p>A Parceriza não garante que a plataforma estará disponível de forma ininterrupta ou livre de erros. A plataforma é fornecida "no estado em que se encontra", sem garantias de qualquer natureza, expressas ou implícitas.</p>
            <p>Em nenhuma hipótese a Parceriza será responsável por danos indiretos, lucros cessantes, perda de dados ou qualquer outro dano consequencial decorrente do uso ou impossibilidade de uso da plataforma, mesmo que alertada da possibilidade de tais danos.</p>
            <p>A responsabilidade total da Parceriza perante o usuário, em qualquer circunstância, fica limitada ao valor pago pelo usuário à plataforma nos últimos 12 (doze) meses.</p>
          </Section>

          <Section title="11. Modificações dos Termos">
            <p>A Parceriza pode atualizar estes Termos a qualquer momento. Alterações materiais serão comunicadas com antecedência mínima de 15 dias por e-mail ou notificação na plataforma. O uso continuado após a vigência das alterações implica aceitação dos novos termos.</p>
          </Section>

          <Section title="12. Rescisão">
            <p>O usuário pode encerrar sua conta a qualquer momento mediante solicitação ao suporte. A Parceriza pode suspender ou encerrar o acesso do usuário imediatamente, sem aviso prévio, em caso de violação grave destes Termos ou do Código de Ética da OAB.</p>
          </Section>

          <Section title="13. Foro e Legislação Aplicável">
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de <strong>Jaraguá do Sul, Estado de Santa Catarina</strong>, para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
          </Section>

          <Section title="14. Contato">
            <p>Dúvidas sobre estes Termos podem ser encaminhadas para:</p>
            <p>
              <strong>HMP Advocacia &amp; Preddita</strong><br />
              Jaraguá do Sul — SC<br />
              E-mail: <a href="mailto:contato@parceriza.com.br" style={{ color: 'var(--color-primary)' }}>contato@parceriza.com.br</a>
            </p>
          </Section>

        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-gray-100)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/privacidade" className="btn btn-outline btn-sm">Política de Privacidade →</Link>
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
