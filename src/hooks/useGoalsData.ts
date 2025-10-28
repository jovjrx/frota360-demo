import useSWR from 'swr';
import type { Goal } from '@/schemas/goal';

export interface GoalsDataResponse {
  goals: Goal[];
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
 * Hook para buscar goals com SWR
 * @returns { goals, isLoading, error, mutate }
 */
export function useGoalsData() {
  const { data, error, isLoading, mutate } = useSWR<GoalsDataResponse>(
    '/api/admin/goals',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onError: (error) => {
        console.error('Erro ao carregar goals:', error);
      },
    }
  );

  return {
    goals: data?.goals || [],
    isLoading: isLoading || !data,
    error,
    mutate,
  };
}

/**
 * Cria nova goal via API
 */
export async function createGoalAPI(goalData: any): Promise<Goal> {
  const response = await fetch('/api/admin/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(goalData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar goal');
  }

  const data = await response.json();
  return data.goal;
}

/**
 * Atualiza goal via API
 */
export async function updateGoalAPI(id: string, goalData: any): Promise<Goal> {
  const response = await fetch('/api/admin/goals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, ...goalData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar goal');
  }

  const data = await response.json();
  return data.goal;
}

/**
 * Deleta goal via API
 */
export async function deleteGoalAPI(id: string): Promise<void> {
  const response = await fetch(`/api/admin/goals?id=${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar goal');
  }
}
