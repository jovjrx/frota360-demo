import useSWR from 'swr';
import type { ReferralRule } from '@/schemas/referral-rule';

interface ReferralRulesResponse {
  success: true;
  data: ReferralRule[];
}

const fetcher = (url: string) => 
  fetch(url, {
    credentials: 'include'
  }).then(r => r.json());

export function useReferralRulesData() {
  const { data, isLoading, error, mutate } = useSWR<ReferralRulesResponse>(
    '/api/admin/referrals',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    referrals: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

export async function createReferralRuleAPI(rule: Omit<ReferralRule, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/admin/referral-rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar regra de indicação');
  }

  return response.json();
}

export async function updateReferralRuleAPI(id: string, updates: Partial<ReferralRule>) {
  const response = await fetch('/api/admin/referral-rules', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar regra de indicação');
  }

  return response.json();
}

export async function deleteReferralRuleAPI(id: string) {
  const response = await fetch(`/api/admin/referral-rules?id=${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar regra de indicação');
  }

  return response.json();
}
