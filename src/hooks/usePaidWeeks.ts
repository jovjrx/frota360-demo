/**
 * HOOK PARA BUSCAR DADOS DE SEMANAS PAGAS
 * 
 * Busca sempre de driverWeeklyRecords com paymentStatus = 'paid'
 * Não reprocessa dados - usa dados já finalizados
 */

import { useEffect, useState } from 'react';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export interface UsePaidWeeksOptions {
  filters?: {
    driverId?: string;
    weekId?: string;
    startDate?: string;
    endDate?: string;
  };
  limit?: number;
  sort?: 'desc' | 'asc';
}

export function usePaidWeeks(options?: UsePaidWeeksOptions) {
  const [data, setData] = useState<DriverWeeklyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPaidWeeks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Sempre filtrar por paymentStatus = 'paid'
      params.append('paymentStatus', 'paid');

      // Aplicar filtros adicionais
      if (options?.filters?.driverId) {
        params.append('driverId', options.filters.driverId);
      }
      if (options?.filters?.weekId) {
        params.append('weekId', options.filters.weekId);
      }
      if (options?.filters?.startDate) {
        params.append('startDate', options.filters.startDate);
      }
      if (options?.filters?.endDate) {
        params.append('endDate', options.filters.endDate);
      }

      // Limit e sort
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      if (options?.sort) {
        params.append('sort', options.sort);
      }

      const response = await fetch(`/api/admin/weeks/paid?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar semanas pagas');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidWeeks();
  }, [options?.filters?.driverId, options?.filters?.weekId, options?.limit]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchPaidWeeks,
  };
}

/**
 * HOOK PARA BUSCAR SEMANAS NÃO PAGAS (PARA PROCESSAMENTO)
 * 
 * Busca semanas criadas mas não pagas
 * Usada em /payments para fazer a fusão de dados com reprocessamento
 */

export interface UseUnpaidWeeksOptions {
  filters?: {
    driverId?: string;
    weekId?: string;
    startDate?: string;
    endDate?: string;
  };
  limit?: number;
  sort?: 'desc' | 'asc';
}

export function useUnpaidWeeks(options?: UseUnpaidWeeksOptions) {
  const [data, setData] = useState<DriverWeeklyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnpaidWeeks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Sempre filtrar por paymentStatus != 'paid'
      params.append('paymentStatus', 'pending');

      // Aplicar filtros adicionais
      if (options?.filters?.driverId) {
        params.append('driverId', options.filters.driverId);
      }
      if (options?.filters?.weekId) {
        params.append('weekId', options.filters.weekId);
      }
      if (options?.filters?.startDate) {
        params.append('startDate', options.filters.startDate);
      }
      if (options?.filters?.endDate) {
        params.append('endDate', options.filters.endDate);
      }

      // Limit e sort
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      if (options?.sort) {
        params.append('sort', options.sort);
      }

      const response = await fetch(`/api/admin/weeks/unpaid?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar semanas não pagas');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidWeeks();
  }, [options?.filters?.driverId, options?.filters?.weekId, options?.limit]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchUnpaidWeeks,
  };
}

