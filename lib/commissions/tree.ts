import { adminDb } from '@/lib/firebaseAdmin';

export interface CommissionNode {
  id: string;
  level: number;
}

export async function getDirectReferrals(indicatorId: string): Promise<string[]> {
  const snap = await adminDb.collection('drivers').where('referredBy', '==', indicatorId).get();
  return snap.docs.map(d => d.id);
}

export async function getCommissionTree(indicatorId: string, maxLevels: number): Promise<CommissionNode[]> {
  const result: CommissionNode[] = [];
  let currentLevelIds = [indicatorId];
  for (let level = 1; level <= maxLevels; level++) {
    const next: string[] = [];
    for (const id of currentLevelIds) {
      const children = await getDirectReferrals(id);
      for (const child of children) {
        result.push({ id: child, level });
        next.push(child);
      }
    }
    currentLevelIds = next;
    if (currentLevelIds.length === 0) break;
  }
  return result;
}
