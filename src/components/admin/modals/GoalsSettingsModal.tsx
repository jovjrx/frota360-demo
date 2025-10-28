import React, { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import StructuredSettingsModal from './StructuredSettingsModal';

interface GoalsConfig {
  rewardPercentage: number;
  minRideCount: number;
  minRevenuePerWeek: number;
  rewardBase: 'repasse' | 'ganhosMenosIVA';
  weeklyBudgetCap: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: GoalsConfig = {
  rewardPercentage: 15,
  minRideCount: 50,
  minRevenuePerWeek: 600,
  rewardBase: 'repasse',
  weeklyBudgetCap: 10000,
};

export default function GoalsSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<GoalsConfig>(DEFAULT_CONFIG);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/goals');
      const data = await res.json();
      if (data?.success && data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      setError('Falha ao carregar configuração');
      toast({ status: 'error', title: 'Erro ao carregar configuração' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Configuração de metas salva com sucesso!' });
        onClose();
      } else {
        throw new Error(data?.error || 'Erro ao salvar');
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'Erro de rede ao salvar';
      setError(errorMsg);
      toast({ status: 'error', title: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: 'Critérios de Elegibilidade',
      description: 'Configure os requisitos mínimos para receber recompensas',
      fields: [
        {
          name: 'minRideCount',
          label: 'Mínimo de Viagens',
          type: 'number' as const,
          value: config.minRideCount,
          onChange: (value: number) =>
            setConfig({ ...config, minRideCount: Math.max(1, value) }),
          min: 1,
          step: 5,
          helperText: 'Número mínimo de viagens na semana para elegibilidade',
        },
        {
          name: 'minRevenuePerWeek',
          label: 'Receita Mínima Semanal (€)',
          type: 'number' as const,
          value: config.minRevenuePerWeek,
          onChange: (value: number) =>
            setConfig({ ...config, minRevenuePerWeek: Math.max(0, value) }),
          min: 0,
          step: 50,
          helperText: 'Receita mínima semanal necessária para elegibilidade',
        },
      ],
    },
    {
      title: 'Configuração de Recompensa',
      description: 'Configure o percentual e base de cálculo das recompensas',
      fields: [
        {
          name: 'rewardPercentage',
          label: 'Percentual de Recompensa (%)',
          type: 'number' as const,
          value: config.rewardPercentage,
          onChange: (value: number) =>
            setConfig({ ...config, rewardPercentage: Math.max(0, Math.min(100, value)) }),
          min: 0,
          max: 100,
          step: 0.5,
          helperText: 'Percentual de recompensa sobre a base de cálculo',
        },
        {
          name: 'rewardBase',
          label: 'Base de Cálculo',
          type: 'select' as const,
          value: config.rewardBase,
          onChange: (value: string) =>
            setConfig({ ...config, rewardBase: value as 'repasse' | 'ganhosMenosIVA' }),
          options: [
            { label: 'Repasse (após despesas)', value: 'repasse' },
            { label: 'Ganhos Menos IVA', value: 'ganhosMenosIVA' },
          ],
          helperText: 'Base sobre a qual o percentual de recompensa é calculado',
        },
        {
          name: 'weeklyBudgetCap',
          label: 'Orçamento Máximo Semanal (€)',
          type: 'number' as const,
          value: config.weeklyBudgetCap,
          onChange: (value: number) =>
            setConfig({ ...config, weeklyBudgetCap: Math.max(0, value) }),
          min: 0,
          step: 100,
          helperText: 'Limite máximo de gastos com recompensas por semana',
        },
      ],
    },
  ];

  return (
    <StructuredSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração de Metas"
      description="Configure os critérios e recompensas de metas semanais"
      isLoading={loading}
      isSaving={saving}
      error={error}
      onSave={save}
      sections={sections}
    />
  );
}

