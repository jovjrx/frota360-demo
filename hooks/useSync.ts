import { useState } from 'react';
import { useToast } from '@chakra-ui/react';

export interface SyncOptions {
  startDate: string;
  endDate: string;
  driverId?: string;
  vehicleId?: string;
  platforms?: string[];
}

export interface SyncResult {
  success: boolean;
  platform: string;
  recordsCreated: number;
  recordsUpdated: number;
  errors: string[];
  duration: number;
}

export interface SyncStats {
  totalPlatforms: number;
  successfulPlatforms: number;
  failedPlatforms: number;
  totalRecordsCreated: number;
  totalRecordsUpdated: number;
  totalErrors: number;
  totalDuration: number;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  results: SyncResult[];
  stats: SyncStats;
}

export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const syncFleet = async (options: SyncOptions): Promise<SyncResponse | null> => {
    setSyncing(true);
    setProgress(0);

    try {
      const response = await fetch('/api/admin/fleet/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sincronização concluída!',
          description: `${data.stats.totalRecordsCreated} registros criados, ${data.stats.totalRecordsUpdated} atualizados`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setProgress(100);
        return data;
      } else {
        toast({
          title: 'Erro na sincronização',
          description: data.error || 'Ocorreu um erro desconhecido',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return null;
      }
    } catch (error: any) {
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Erro ao conectar com o servidor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  const syncDriversWeekly = async (weekStart: string, weekEnd: string, driverId?: string): Promise<any | null> => {
    setSyncing(true);
    setProgress(0);

    try {
      const response = await fetch('/api/admin/drivers-weekly/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weekStart, weekEnd, driverId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sincronização semanal concluída!',
          description: `${data.weeklyRecords.created} registros criados, ${data.weeklyRecords.updated} atualizados`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setProgress(100);
        return data;
      } else {
        toast({
          title: 'Erro na sincronização',
          description: data.error || 'Ocorreu um erro desconhecido',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return null;
      }
    } catch (error: any) {
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Erro ao conectar com o servidor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  const testIntegrations = async (): Promise<any | null> => {
    setSyncing(true);

    try {
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const successCount = data.results.filter((r: any) => r.success).length;
        const totalCount = data.results.length;

        toast({
          title: 'Teste de integrações concluído',
          description: `${successCount}/${totalCount} plataformas conectadas`,
          status: successCount === totalCount ? 'success' : 'warning',
          duration: 5000,
          isClosable: true,
        });
        return data;
      } else {
        toast({
          title: 'Erro ao testar integrações',
          description: data.error || 'Ocorreu um erro desconhecido',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return null;
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao testar integrações',
        description: error.message || 'Erro ao conectar com o servidor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    progress,
    syncFleet,
    syncDriversWeekly,
    testIntegrations,
  };
}
