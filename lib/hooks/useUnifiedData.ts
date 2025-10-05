/**
 * Hook para consumir dados unificados do admin no client-side
 * 
 * ⚠️ ATENÇÃO: Preferir sempre SSR (getServerSideProps) quando possível!
 * Este hook deve ser usado apenas para:
 * - Recarregamentos sob demanda
 * - Dashboards em tempo real
 * - Atualização após ações (criar, editar, deletar)
 */

import { useState, useEffect, useCallback } from 'react';
import { UnifiedAdminData } from '@/lib/admin/unified-data';

interface UseUnifiedDataOptions {
  preset?: 'dashboard' | 'driver-metrics';
  days?: number;
  startDate?: string;
  endDate?: string;
  include?: string[];
  driverStatus?: 'active' | 'inactive' | 'all';
  vehicleStatus?: 'active' | 'inactive' | 'maintenance' | 'all';
  autoFetch?: boolean; // Default: false (deve ser chamado manualmente)
}

interface UseUnifiedDataReturn {
  data: UnifiedAdminData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar dados unificados do admin
 * 
 * @example
 * // Uso básico - não busca automaticamente
 * const { data, loading, error, refetch } = useUnifiedData({ preset: 'dashboard' });
 * 
 * // Buscar ao clicar em botão
 * <Button onClick={refetch} isLoading={loading}>Atualizar</Button>
 * 
 * // Auto-fetch (evitar!)
 * const { data } = useUnifiedData({ preset: 'dashboard', autoFetch: true });
 */
export function useUnifiedData(options: UseUnifiedDataOptions = {}): UseUnifiedDataReturn {
  const [data, setData] = useState<UnifiedAdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (options.preset) {
        params.append('preset', options.preset);
      }

      if (options.days !== undefined) {
        params.append('days', options.days.toString());
      }

      if (options.startDate) {
        params.append('startDate', options.startDate);
      }

      if (options.endDate) {
        params.append('endDate', options.endDate);
      }

      if (options.include && options.include.length > 0) {
        params.append('include', options.include.join(','));
      }

      if (options.driverStatus) {
        params.append('driverStatus', options.driverStatus);
      }

      if (options.vehicleStatus) {
        params.append('vehicleStatus', options.vehicleStatus);
      }

      const response = await fetch(`/api/admin/data/unified?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      console.error('Error fetching unified data:', err);
    } finally {
      setLoading(false);
    }
  }, [
    options.preset,
    options.days,
    options.startDate,
    options.endDate,
    options.include,
    options.driverStatus,
    options.vehicleStatus,
  ]);

  // Auto-fetch apenas se explicitamente habilitado
  useEffect(() => {
    if (options.autoFetch) {
      fetchData();
    }
  }, [options.autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook simplificado para dashboard
 */
export function useDashboardData(days: number = 30) {
  return useUnifiedData({
    preset: 'dashboard',
    days,
    autoFetch: false, // Nunca auto-fetch, sempre via SSR
  });
}

/**
 * Hook simplificado para métricas de motoristas
 */
export function useDriverMetrics(days: number = 30) {
  return useUnifiedData({
    preset: 'driver-metrics',
    days,
    autoFetch: false,
  });
}
