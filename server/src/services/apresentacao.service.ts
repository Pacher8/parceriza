import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middlewares/error.middleware.js';
import { debitarTokens, verificarSaldo } from './token.service.js';

const CUSTO_TOKENS = 500;

export async function gerarApresentacao(advogadoId: string): Promise<Buffer> {
  const suficiente = await verificarSaldo(advogadoId, CUSTO_TOKENS);
  if (!suficiente) {
    throw new HttpError(402, `Saldo insuficiente. São necessários ${CUSTO_TOKENS} tokens para gerar a apresentação.`);
  }

  const advogado = await prisma.advogado.findUnique({
    where: { id: advogadoId },
    select: {
      nome: true,
      email: true,
      oab: true,
      oabUf: true,
      telefone: true,
      bio: true,
      servicos: {
        where: { ativo: true },
        take: 6,
        include: { tese: { select: { area: true, titulo: true } } },
      },
      agenteConfig: { select: { nome: true } },
    },
  });
  if (!advogado) throw new HttpError(404, 'Advogado não encontrado');

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const chunks: Buffer[] = [];

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Colors ────────────────────────────────────────────────────────────────
    const PRIMARY = '#1d4ed8';
    const GRAY = '#6b7280';
    const LIGHT = '#f3f4f6';

    // ── Header bar ────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 120).fill(PRIMARY);

    // Avatar circle (initials)
    const initials = advogado.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    doc.circle(90, 60, 38).fill('#fff');
    doc.fillColor(PRIMARY).fontSize(20).font('Helvetica-Bold').text(initials, 70, 45, { width: 40, align: 'center' });

    // Name + OAB
    doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text(advogado.nome, 145, 28, { width: 360 });
    doc.fontSize(12).font('Helvetica').text(`OAB/${advogado.oabUf} nº ${advogado.oab}`, 145, 58);
    doc.fontSize(10).text('Advogado(a) · Parceriza', 145, 80);

    // ── Body ──────────────────────────────────────────────────────────────────
    let y = 145;

    // Bio
    if (advogado.bio) {
      doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text('SOBRE', 60, y);
      y += 18;
      doc.fillColor('#374151').fontSize(10).font('Helvetica')
        .text(advogado.bio, 60, y, { width: doc.page.width - 120, align: 'justify' });
      y += doc.heightOfString(advogado.bio, { width: doc.page.width - 120 }) + 20;
    }

    // Divider
    doc.moveTo(60, y).lineTo(doc.page.width - 60, y).strokeColor(LIGHT).lineWidth(1).stroke();
    y += 18;

    // Serviços
    if (advogado.servicos.length > 0) {
      doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text('SERVIÇOS OFERECIDOS', 60, y);
      y += 18;

      for (const s of advogado.servicos) {
        doc.fillColor(GRAY).fontSize(8).font('Helvetica').text(s.tese.area, 60, y);
        doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(s.titulo, 60, y + 10, { width: 380 });
        doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(
          `R$ ${Number(s.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          60, y + 24,
        );
        y += 44;
        if (y > doc.page.height - 120) { doc.addPage(); y = 60; }
      }
      y += 10;
    }

    // Divider
    doc.moveTo(60, y).lineTo(doc.page.width - 60, y).strokeColor(LIGHT).lineWidth(1).stroke();
    y += 18;

    // Contato
    doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text('CONTATO', 60, y);
    y += 18;
    const contatos = [
      advogado.email && `E-mail: ${advogado.email}`,
      advogado.telefone && `Telefone: ${advogado.telefone}`,
    ].filter(Boolean) as string[];
    for (const c of contatos) {
      doc.fillColor('#374151').fontSize(10).font('Helvetica').text(c, 60, y);
      y += 16;
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill('#f9fafb');
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text('Apresentação gerada pela Parceriza — plataforma de networking jurídico', 60, doc.page.height - 30, {
        width: doc.page.width - 120,
        align: 'center',
      });

    doc.end();
  });

  // Debit tokens AFTER successful generation
  await debitarTokens(
    advogadoId,
    CUSTO_TOKENS,
    'PAGAMENTO_SERVICO',
    'Geração de apresentação profissional PDF',
  );

  return pdfBuffer;
}
