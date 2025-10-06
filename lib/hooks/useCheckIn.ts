import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getLocationByIP } from '@/lib/location';
import { getPortugalTimestamp, addPortugalTime } from '@/lib/timezone';
import { CheckIn, CreateCheckIn } from '@/schemas/checkin';

interface CheckInState {
  isActive: boolean;
  lastCheckin: number | null;
  nextCheckin: number | null;
  checkinCount: number;
  isLoading: boolean;
  error: string | null;
}

export function useCheckIn() {
  const { userData, isDriver } = useAuth();
  const [state, setState] = useState<CheckInState>({
    isActive: false,
    lastCheckin: null,
    nextCheckin: null,
    checkinCount: 0,
    isLoading: false,
    error: null
  });

  const [checkinHistory, setCheckinHistory] = useState<CheckIn[]>([]);

  // Função para fazer check-in
  const doCheckIn = useCallback(async (type: 'automatic' | 'manual' = 'manual') => {
    if (!isDriver || !userData?.driverId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Obter localização (com fallback para Lisboa se falhar)
      let location;
      try {
        location = await getLocationByIP();
      } catch (locationError) {
        console.warn('Erro ao obter localização, usando fallback:', locationError);
        location = {
          city: 'Lisboa',
          country: 'Portugal',
          region: 'Lisboa',
          coordinates: { lat: 38.7223, lng: -9.1393 },
          ip: 'unknown'
        };
      }
      
      // Criar dados do check-in
      const checkInData: CreateCheckIn = {
        driverId: userData.driverId,
        timestamp: getPortugalTimestamp(),
        location,
        type,
        status: state.isActive ? 'active' : 'inactive'
      };

      // Fazer requisição para API
      const response = await fetch('/api/painel/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkInData),
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar check-in');
      }

      const result = await response.json();
      
      // Atualizar estado local
      setState(prev => ({
        ...prev,
        lastCheckin: checkInData.timestamp,
        nextCheckin: state.isActive ? addPortugalTime(5, 'minutes').toMillis() : null,
        checkinCount: prev.checkinCount + 1,
        isLoading: false
      }));

      // Atualizar histórico
      await fetchCheckinHistory();

      return result;
    } catch (error) {
      console.error('Erro ao fazer check-in:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [isDriver, userData?.driverId, state.isActive]);

  // Função para atualizar status ativo/inativo
  const updateStatus = useCallback(async (isActive: boolean) => {
    if (!isDriver || !userData?.driverId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/painel/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status');
      }

      setState(prev => ({
        ...prev,
        isActive,
        nextCheckin: isActive ? addPortugalTime(5, 'minutes').toMillis() : null,
        isLoading: false
      }));

      // Se ativou, fazer check-in automático
      if (isActive) {
        await doCheckIn('automatic');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [isDriver, userData?.driverId, doCheckIn]);

  // Função para obter histórico de check-ins
  const fetchCheckinHistory = useCallback(async () => {
    if (!isDriver || !userData?.driverId) return;

    try {
      const response = await fetch('/api/painel/checkin/history');
      if (!response.ok) {
        throw new Error('Falha ao obter histórico');
      }

      const data = await response.json();
      setCheckinHistory(data.checkins);
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
    }
  }, [isDriver, userData?.driverId]);

  // Check-in automático a cada 5 minutos se estiver ativo
  useEffect(() => {
    if (!state.isActive || !state.nextCheckin) return;

    const interval = setInterval(() => {
      const now = getPortugalTimestamp();
      if (now >= state.nextCheckin!) {
        doCheckIn('automatic');
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [state.isActive, state.nextCheckin, doCheckIn]);

  // Check-in automático ao carregar a página
  useEffect(() => {
    if (isDriver && userData?.driverId) {
      doCheckIn('automatic');
      fetchCheckinHistory();
    }
  }, [isDriver, userData?.driverId, doCheckIn, fetchCheckinHistory]);

  return {
    ...state,
    checkinHistory,
    doCheckIn,
    updateStatus,
    fetchCheckinHistory
  };
}
