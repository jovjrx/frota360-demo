import useSWR from 'swr';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import type { WeeklyNormalizedData } from '@/schemas/data-weekly';
import type { Weekly } from '@/schemas/weekly';

export interface WeeklyStats {
  total: number;
  pending: number;
  paid: number;
  bonusCount: number;
  totalAmount: number;
  totalBonus: number;
}

export interface WeekOption {
  weekId: string;
  label: string;
  status?: string;
  start?: string;
  end?: string;
}

export interface WeeklyDataResponse {
  weeks: WeekOption[];
  records: DriverWeeklyRecord[];
  weeklyData?: WeeklyNormalizedData[];
  weeklyMaestro?: Weekly; // ✅ Maestro com status das integrações
  stats: WeeklyStats;
}

type FetchError = Error & { status?: number };

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    const error: FetchError = new Error('Failed to fetch');
    error.status = response.status;
    throw error;
  }
  return response.json();
};

/**
 * Hook para buscar dados de pagamentos, dados brutos E maestro de uma semana específica
 * Busca: driverPayments + dataWeekly + weekly (maestro) via SWR
 * 
 * @param weekId - ID da semana (ex: "2025-W43")
 * @returns { data, isLoading, error, mutate }
 */
export function useWeeklyData(weekId?: string) {
  const { data, error, isLoading, mutate } = useSWR<WeeklyDataResponse>(
    weekId ? `/api/admin/weekly/records?weekId=${weekId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Evita duplicação em 60s
      onError: (error) => {
        console.error('Erro ao carregar dados da semana:', error);
      },
    }
  );

  return {
    data: data || {
      weeks: [],
      records: [],
      weeklyData: [],
      weeklyMaestro: undefined,
      stats: {
        total: 0,
        pending: 0,
        paid: 0,
        bonusCount: 0,
        totalAmount: 0,
        totalBonus: 0,
      },
    },
    isLoading: isLoading || !data,
    error,
    mutate, // Usar para revalidar após POST
  };
}

/**
 * Hook para apenas carregar lista de semanas disponíveis (do maestro)
 */
export function useWeekOptions() {
  const { data, isLoading, error } = useSWR<{ weeks: WeekOption[] }>(
    '/api/admin/weekly/records',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    weeks: data?.weeks || [],
    isLoading,
    error,
  };
}
