import useSWR from 'swr';
import type { CommissionRule } from '@/schemas/commission-rule';

interface CommissionsResponse {
  success: true;
  data: CommissionRule[];
}

const fetcher = (url: string) => 
  fetch(url, {
    credentials: 'include'
  }).then(r => r.json());

export function useCommissionsData() {
  const { data, isLoading, error, mutate } = useSWR<CommissionsResponse>(
    '/api/admin/commissions',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    commissions: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

export async function createCommissionAPI(commission: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/admin/commissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(commission),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar comissão');
  }

  return response.json();
}

export async function updateCommissionAPI(id: string, updates: Partial<CommissionRule>) {
  const response = await fetch(`/api/admin/commissions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar comissão');
  }

  return response.json();
}

export async function deleteCommissionAPI(id: string) {
  const response = await fetch(`/api/admin/commissions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar comissão');
  }

  return response.json();
}
