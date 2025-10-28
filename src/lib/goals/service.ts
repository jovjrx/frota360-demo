import { adminDb } from '@/lib/firebaseAdmin';

export interface RewardConfig {
  criterio: 'ganho' | 'viagens';
  tipo: 'valor' | 'percentual';
  valor: number;
  nivel: number;
  descricao: string;
  dataInicio?: number;
}

export interface DriverGoalStatus {
  id: string;
  descricao: string;
  criterio: 'ganho' | 'viagens';
  tipo: 'valor' | 'percentual';
  valor: number;
  nivel: number;
  atingido: boolean;
  valorGanho: number;
  valorBase: number;
  dataInicio?: number | string;
}

// Função para buscar as metas/recompensas ativas
export async function getActiveRewards(): Promise<RewardConfig[]> {
  const snap = await adminDb.doc('settings/goals').get();
  if (!snap.exists) return [];
  const data = snap.data() as any;
  return Array.isArray(data.rewards) ? data.rewards : [];
}

// Função principal: calcula status das metas para um motorista em uma semana
// params: driverId, nome, ganhosBrutos, viagens, dataSemana (timestamp)
export async function computeDriverGoals(
  driverId: string,
  driverName: string,
  ganhosBrutos: number,
  viagens: number,
  dataSemana: number
): Promise<DriverGoalStatus[]> {
  const rewards = await getActiveRewards();
  return rewards
    .filter(r => !r.dataInicio || dataSemana >= r.dataInicio)
    .map((r, idx) => {
      let atingido = false;
      let valorBase = 0;
      if (r.criterio === 'ganho') valorBase = ganhosBrutos;
      if (r.criterio === 'viagens') valorBase = viagens;
      if (valorBase >= r.valor) atingido = true;
      let valorGanho = 0;
      if (atingido) {
        valorGanho = r.tipo === 'valor' ? r.valor : (r.tipo === 'percentual' ? (ganhosBrutos * (r.valor / 100)) : 0);
      }
      return {
        id: `reward-${idx}`,
        descricao: r.descricao,
        criterio: r.criterio,
        tipo: r.tipo,
        valor: r.valor,
        nivel: r.nivel,
        atingido,
        valorGanho,
        valorBase,
        dataInicio: r.dataInicio,
      };
    });
}

