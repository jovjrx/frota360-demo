import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { createWeekly } from '@/schemas/weekly';

interface SeedResponse {
  success: boolean;
  message: string;
  weeks?: string[];
}

type ApiResponse = SeedResponse | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar se tem chave de admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🌱 Iniciando seed de 3 semanas...');

    const PLATFORMS = ['uber', 'bolt', 'myprio', 'viaverde'];
    const today = new Date();
    const weeks = [];

    // Gerar 3 semanas (current + 2 anteriores)
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - 7 * i);

      const weekNumber = getWeekNumber(date);
      const year = date.getFullYear();
      const weekId = `${year}-W${String(weekNumber).padStart(2, '0')}`;

      const weekStart = getWeekStart(date);
      const weekEnd = getWeekEnd(date);

      weeks.push({ weekId, weekStart, weekEnd });
    }

    const createdWeeks = [];

    // Criar cada semana
    for (const week of weeks) {
      const batch = adminDb.batch();

      // 1. Criar maestro em "weekly"
      const weekly = createWeekly(week.weekId, week.weekStart, week.weekEnd);
      const weeklyRef = adminDb.collection('weekly').doc(week.weekId);
      batch.set(weeklyRef, weekly, { merge: true });

      // 2. Criar registros vazios em "dataWeekly" para cada plataforma
      for (const platform of PLATFORMS) {
        const docRef = adminDb.collection('dataWeekly').doc();
        batch.set(docRef, {
          weekId: week.weekId,
          platform,
          status: 'empty',
          createdAt: new Date().toISOString(),
          records: [],
        });
      }

      await batch.commit();
      createdWeeks.push(week.weekId);
      console.log(`✅ Semana ${week.weekId} criada`);
    }

    return res.status(200).json({
      success: true,
      message: 'Todas as 3 semanas foram criadas com sucesso!',
      weeks: createdWeeks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[POST /api/admin/seed-weekly]', error);
    return res.status(500).json({ error: message });
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + 6);
  return d.toISOString().split('T')[0];
}
