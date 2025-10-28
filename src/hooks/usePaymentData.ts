/**
 * HOOK CENTRALIZADO PARA BUSCAR DADOS DE PAGAMENTO
 * Usado em componentes de Admin (Weekly, Dashboard) e Driver
 */

import { useEffect, useState } from 'react';
import type { PaymentData } from '@/lib/api/payment-data-service';

interface UsePaymentDataOptions {
  weekId?: string;
  driverId?: string;
  limit?: number;
  autoRefresh?: boolean; // Auto-refresh a cada 5 minutos
}

interface UsePaymentDataResult {
  payments: PaymentData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar dados de pagamento
 */
export function usePaymentData(options: UsePaymentDataOptions = {}): UsePaymentDataResult {
  const {
    weekId,
    driverId,
    limit = 50,
    autoRefresh = false,
  } = options;

  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir query params
      const params = new URLSearchParams();
      if (weekId) params.append('weekId', weekId);
      if (driverId) params.append('driverId', driverId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/admin/weeks/paid?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`);
      }

      const data = await response.json();
      setPayments(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Auto-refresh se habilitado
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchPayments, 5 * 60 * 1000); // 5 minutos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [weekId, driverId, limit, autoRefresh]);

  return {
    payments,
    isLoading,
    error,
    refetch: fetchPayments,
  };
}

/**
 * Hook para buscar um pagamento específico
 */
export function usePaymentForWeek(
  driverId: string,
  weekId: string
): UsePaymentDataResult {
  return usePaymentData({
    driverId,
    weekId,
    limit: 1,
  });
}

/**
 * Hook para buscar todos os pagamentos de uma semana
 */
export function useWeekPayments(weekId: string): UsePaymentDataResult {
  return usePaymentData({
    weekId,
  });
}
