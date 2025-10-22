import { adminDb } from '@/lib/firebaseAdmin';
import { getDefault2026Goals, QuarterlyGoal } from '@/schemas/goals';

export interface GoalRecordDto {
  id: string;
  driverId: string; // company-level in MVP
  driverName: string;
  driverType: string;
  year: number;
  quarter: 'Q1'|'Q2'|'Q3'|'Q4';
  target: number;
  current: number;
  status: 'not_started'|'in_progress'|'completed'|'overdue';
  weight: number;
  description: string;
}

export interface GoalsSummaryDto {
  totalGoals: number;
  completedGoals: number;
  overallProgress: number; // average of progresses
  averageProgress: number; // same as overallProgress in MVP
}

function getQuarterLabel(q: number): 'Q1'|'Q2'|'Q3'|'Q4' { return (`Q${q}` as any); }

function getQuarterEndDate(year: number, quarter: number): Date {
  const monthEnd = quarter * 3; // 3,6,9,12
  const lastDay = new Date(year, monthEnd, 0).getDate();
  return new Date(year, monthEnd - 1, lastDay, 23, 59, 59);
}

function now(): Date { return new Date(); }

export async function countActiveDrivers(asOf?: Date): Promise<number> {
  // Optionally filter by createdAt <= asOf
  const snap = await adminDb.collection('drivers').where('status', '==', 'active').get();
  if (!asOf) return snap.size;
  let count = 0;
  for (const d of snap.docs) {
    const data = d.data() as any;
    const createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
    if (!createdAt || createdAt <= asOf) count++;
  }
  return count;
}

export async function buildGoalsForYear(year: number): Promise<{ goals: GoalRecordDto[]; summary: GoalsSummaryDto; }>{
  // Try to read configured targets; fallback to defaults
  let configuredTargets: { [q: number]: number } | null = null;
  try {
    const cfgSnap = await adminDb.doc('settings/goals').get();
    if (cfgSnap.exists) {
      const data = cfgSnap.data() as any;
      const t = data?.targets || {};
      configuredTargets = {
        1: Number(t.Q1 ?? NaN),
        2: Number(t.Q2 ?? NaN),
        3: Number(t.Q3 ?? NaN),
        4: Number(t.Q4 ?? NaN),
      };
    }
  } catch (e) {
    // ignore and use defaults
  }

  // For MVP, use default 2026 targets when not configured
  const defaults = getDefault2026Goals();
  const companyName = 'Conduz.pt';
  const companyId = 'company';

  const goals: GoalRecordDto[] = [];
  const progresses: number[] = [];
  let completedGoals = 0;

  for (const qStr of Object.keys(defaults)) {
    const q = Number(qStr);
    const def: QuarterlyGoal = defaults[q];
    const configured = configuredTargets && Number.isFinite(configuredTargets[q]) ? configuredTargets[q] : undefined;
    const target = configured ?? def.targets.totalDrivers;
    const endDate = getQuarterEndDate(year, q);
    const current = await countActiveDrivers(endDate);
    const progressPct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    let status: GoalRecordDto['status'] = 'not_started';
    if (progressPct >= 100) status = 'completed';
    else if (progressPct > 0) status = 'in_progress';
    // overdue if now past quarter end and not completed
    if (now() > endDate && status !== 'completed') status = 'overdue';

    if (status === 'completed') completedGoals++;
    progresses.push(progressPct);

    goals.push({
      id: `${year}-${getQuarterLabel(q)}`,
      driverId: companyId,
      driverName: companyName,
      driverType: 'company',
      year,
      quarter: getQuarterLabel(q),
      target,
      current,
      status,
      weight: 25,
      description: 'Motoristas ativos',
    });
  }

  const overall = progresses.length > 0 ? (progresses.reduce((a,b)=>a+b,0) / progresses.length) : 0;

  return {
    goals,
    summary: {
      totalGoals: goals.length,
      completedGoals,
      overallProgress: overall,
      averageProgress: overall,
    }
  };
}
