import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../middlewares/error.middleware.js';
import type { AgendarInput } from '../schemas/secretaria.schema.js';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

function requireGoogleConfig() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new HttpError(503, 'Google Calendar não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.');
  }
}

function getOAuth2Client() {
  requireGoogleConfig();
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

async function getAuthenticatedClient(advogadoId: string) {
  const config = await prisma.agendaConfig.findUnique({ where: { advogadoId } });
  if (!config?.googleAccessToken) {
    throw new HttpError(401, 'Google Calendar não conectado. Faça a autenticação primeiro.');
  }
  const client = getOAuth2Client();
  client.setCredentials({
    access_token: config.googleAccessToken,
    refresh_token: config.googleRefreshToken ?? undefined,
  });

  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.agendaConfig.update({
        where: { advogadoId },
        data: { googleAccessToken: tokens.access_token },
      });
    }
  });

  return client;
}

export function getAuthUrl(advogadoId: string): string {
  requireGoogleConfig();
  const client = getOAuth2Client();
  const state = jwt.sign({ sub: advogadoId }, env.JWT_SECRET, { expiresIn: '10m' });
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });
}

export async function handleCallback(code: string, state: string): Promise<string> {
  requireGoogleConfig();
  const payload = jwt.verify(state, env.JWT_SECRET) as { sub: string };
  const advogadoId = payload.sub;

  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: client });
  const calList = await calendar.calendarList.get({ calendarId: 'primary' });
  const calendarId = calList.data.id ?? 'primary';

  let config = await prisma.agendaConfig.findUnique({ where: { advogadoId } });
  if (!config) {
    await prisma.agendaConfig.create({
      data: {
        advogadoId,
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleCalendarId: calendarId,
        conectadoEm: new Date(),
      },
    });
  } else {
    await prisma.agendaConfig.update({
      where: { advogadoId },
      data: {
        googleAccessToken: tokens.access_token ?? null,
        googleRefreshToken: tokens.refresh_token ?? config.googleRefreshToken,
        googleCalendarId: calendarId,
        conectadoEm: new Date(),
      },
    });
  }

  return advogadoId;
}

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

type Slot = { dia: string; inicio: string; fim: string; isoInicio: string; isoFim: string };

function gerarSlots(date: Date, horas: { ini: string; fim: string }[]): Slot[] {
  const slots: Slot[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  const diaStr = date.toISOString().slice(0, 10);

  for (const h of horas) {
    const [iniHStr, iniMStr] = h.ini.split(':');
    const [fimHStr, fimMStr] = h.fim.split(':');
    let curMin = Number(iniHStr) * 60 + Number(iniMStr);
    const limMin = Number(fimHStr) * 60 + Number(fimMStr);

    while (curMin + 60 <= limMin) {
      const nextMin = curMin + 60;
      const isoStart = new Date(date);
      isoStart.setHours(Math.floor(curMin / 60), curMin % 60, 0, 0);
      const isoEnd = new Date(date);
      isoEnd.setHours(Math.floor(nextMin / 60), nextMin % 60, 0, 0);
      slots.push({
        dia: diaStr,
        inicio: `${pad(Math.floor(curMin / 60))}:${pad(curMin % 60)}`,
        fim: `${pad(Math.floor(nextMin / 60))}:${pad(nextMin % 60)}`,
        isoInicio: isoStart.toISOString(),
        isoFim: isoEnd.toISOString(),
      });
      curMin = nextMin;
    }
  }
  return slots;
}

const DEFAULT_HORAS: Record<string, { ini: string; fim: string }[]> = {
  seg: [{ ini: '09:00', fim: '12:00' }, { ini: '14:00', fim: '18:00' }],
  ter: [{ ini: '09:00', fim: '12:00' }, { ini: '14:00', fim: '18:00' }],
  qua: [{ ini: '09:00', fim: '12:00' }, { ini: '14:00', fim: '18:00' }],
  qui: [{ ini: '09:00', fim: '12:00' }, { ini: '14:00', fim: '18:00' }],
  sex: [{ ini: '09:00', fim: '12:00' }, { ini: '14:00', fim: '18:00' }],
};
const DAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export async function getDisponibilidade(advogadoId: string) {
  const auth = await getAuthenticatedClient(advogadoId);
  const config = await prisma.agendaConfig.findUnique({ where: { advogadoId } });
  const calendar = google.calendar({ version: 'v3', auth });
  const { start, end } = getWeekBounds();

  const eventsRes = await calendar.events.list({
    calendarId: config?.googleCalendarId ?? 'primary',
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const eventos = (eventsRes.data.items ?? []).map((e) => ({
    id: e.id,
    titulo: e.summary,
    inicio: e.start?.dateTime ?? e.start?.date,
    fim: e.end?.dateTime ?? e.end?.date,
    descricao: e.description,
  }));

  const horasConfig = config?.horariosDisponiveis
    ? (JSON.parse(config.horariosDisponiveis) as Record<string, { ini: string; fim: string }[]>)
    : DEFAULT_HORAS;

  const allSlots: Slot[] = [];
  const { start: weekStart } = getWeekBounds();
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dayKey = DAY_KEYS[day.getDay()] as string;
    const horas = horasConfig[dayKey] ?? [];
    allSlots.push(...gerarSlots(day, horas));
  }

  const slotsLivres = allSlots.filter((slot) => {
    const slotIni = new Date(slot.isoInicio).getTime();
    const slotFim = new Date(slot.isoFim).getTime();
    return !eventos.some((ev) => {
      if (!ev.inicio || !ev.fim) return false;
      const evIni = new Date(ev.inicio).getTime();
      const evFim = new Date(ev.fim).getTime();
      return slotIni < evFim && slotFim > evIni;
    });
  });

  return {
    semana: { inicio: start.toISOString().slice(0, 10), fim: end.toISOString().slice(0, 10) },
    eventos,
    slotsLivres,
  };
}

export async function listarEventos(advogadoId: string) {
  const auth = await getAuthenticatedClient(advogadoId);
  const config = await prisma.agendaConfig.findUnique({ where: { advogadoId } });
  const calendar = google.calendar({ version: 'v3', auth });
  const { start, end } = getWeekBounds();

  const res = await calendar.events.list({
    calendarId: config?.googleCalendarId ?? 'primary',
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items ?? []).map((e) => ({
    id: e.id,
    titulo: e.summary,
    inicio: e.start?.dateTime ?? e.start?.date,
    fim: e.end?.dateTime ?? e.end?.date,
    descricao: e.description,
    local: e.location,
  }));
}

export async function agendar(advogadoId: string, data: AgendarInput) {
  const auth = await getAuthenticatedClient(advogadoId);
  const config = await prisma.agendaConfig.findUnique({ where: { advogadoId } });
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId: config?.googleCalendarId ?? 'primary',
    requestBody: {
      summary: data.titulo,
      description: data.descricao ?? undefined,
      start: { dateTime: data.inicio, timeZone: config?.fusoHorario ?? 'America/Sao_Paulo' },
      end: { dateTime: data.fim, timeZone: config?.fusoHorario ?? 'America/Sao_Paulo' },
    },
  });

  return {
    id: res.data.id,
    titulo: res.data.summary,
    inicio: res.data.start?.dateTime,
    fim: res.data.end?.dateTime,
    link: res.data.htmlLink,
  };
}

export async function getStatus(advogadoId: string) {
  const config = await prisma.agendaConfig.findUnique({
    where: { advogadoId },
    select: { googleAccessToken: true, conectadoEm: true, fusoHorario: true, horariosDisponiveis: true },
  });
  return {
    conectado: !!config?.googleAccessToken,
    conectadoEm: config?.conectadoEm ?? null,
    fusoHorario: config?.fusoHorario ?? 'America/Sao_Paulo',
    horariosDisponiveis: config?.horariosDisponiveis ? JSON.parse(config.horariosDisponiveis) : null,
  };
}
