import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { createWeekly } from '@/schemas/weekly';
import { getWeekDates, getWeekId } from '@/lib/utils/date-helpers';
import { createWeeklyDataSources } from '@/schemas/weekly-data-sources';

interface CreateWeekResponse {
  weekId: string;
  message: string;
}

type ApiResponse = CreateWeekResponse | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // If caller provided weekStart/weekEnd use them, otherwise default to current week
    // Accept multiple field names from the UI or external callers
    // UI uses `startDate`/`endDate`; some scripts may send `weekStart`/`weekEnd` or `weekId`.
    const body = req.body || {};
    const notes = body.notes;
    const bodyWeekStart = body.weekStart || body.startDate || body.start;
    const bodyWeekEnd = body.weekEnd || body.endDate || body.end;
    const bodyWeekId = body.weekId;

    let weekStart: string;
    let weekEnd: string;
    let weekId: string;

    if (bodyWeekId) {
      // If weekId provided use it and compute weekStart/weekEnd
      weekId = bodyWeekId;
      const dates = getWeekDates(bodyWeekId);
      weekStart = dates.start;
      weekEnd = dates.end;
    } else if (bodyWeekStart && bodyWeekEnd) {
      // Use provided dates but normalize to ISO week boundaries (Monday..Sunday)
      // This prevents callers from passing a Sunday (or other day) and accidentally
      // creating/overwriting an adjacent week.
      const parsed = new Date(bodyWeekStart);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid weekStart format. Use YYYY-MM-DD.' });
      }

      // Compute ISO weekId from provided date and derive exact week bounds in UTC
      weekId = getWeekId(parsed);
      const derived = getWeekDates(weekId);
      weekStart = derived.start;
      weekEnd = derived.end;
    } else {
      // Fallback: use current date to determine week
      const today = new Date();
      weekId = getWeekId(today);
      const derived = getWeekDates(weekId);
      weekStart = derived.start;
      weekEnd = derived.end;
    }

    // Integrations disponíveis
    const PLATFORMS = ['uber', 'bolt', 'myprio', 'viaverde'];

    // Proteção: não sobrescrever semana existente
    const weeklyRef = adminDb.collection('weekly').doc(weekId);
    const existing = await weeklyRef.get();
    if (existing.exists) {
      return res.status(409).json({ error: `Semana ${weekId} já existe. Não foi sobrescrita.` });
    }

    // Criar registro maestro em weekly + vazios em dataWeekly
    const batch = adminDb.batch();
    // Pass notes through only if provided (createWeekly will ignore undefined)
    const weekly = createWeekly(weekId, weekStart, weekEnd, req.body?.notes ?? undefined);
    batch.set(weeklyRef, weekly);

    // Criar documento em "weeklyDataSources" com as 4 fontes pendentes
    const weeklyDataSourcesRef = adminDb.collection('weeklyDataSources').doc(weekId);
    const weeklyDataSources = createWeeklyDataSources(weekId, weekStart, weekEnd);
    batch.set(weeklyDataSourcesRef, weeklyDataSources);

    // 2. Criar registros vazios em "dataWeekly" para cada plataforma
    for (const platform of PLATFORMS) {
      const docRef = adminDb.collection('dataWeekly').doc();
      batch.set(docRef, {
        weekId,
        platform,
        status: 'empty',
        createdAt: new Date().toISOString(),
        records: [],
      });
    }

    await batch.commit();

    return res.status(201).json({
      weekId,
      message: `Semana ${weekId} criada com sucesso com 4 integrações vazias`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[POST /api/admin/weekly/create]', error);
    return res.status(500).json({ error: message });
  }
}

// Função para calcular número da semana (ISO 8601)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Função para obter o início da semana (segunda-feira)
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Função para obter o fim da semana (domingo)
function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Domingo
  d.setDate(diff);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}
