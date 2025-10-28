import useSWR from 'swr';
import type { CommissionRule } from '@/schemas/commission-rule';

interface CommissionRulesResponse {
  success: true;
  data: CommissionRule[];
}

const fetcher = (url: string) => 
  fetch(url, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
  }).then(r => r.json());

export function useCommissionRulesData() {
  const { data, isLoading, error, mutate } = useSWR<CommissionRulesResponse>(
    '/api/admin/commission-rules',
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

export async function createCommissionRuleAPI(rule: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/admin/commission-rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar regra de comissão');
  }

  return response.json();
}

export async function updateCommissionRuleAPI(id: string, updates: Partial<CommissionRule>) {
  const response = await fetch('/api/admin/commission-rules', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar regra de comissão');
  }

  return response.json();
}

export async function deleteCommissionRuleAPI(id: string) {
  const response = await fetch(`/api/admin/commission-rules?id=${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar regra de comissão');
  }

  return response.json();
}
