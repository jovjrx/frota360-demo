import React, { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import StructuredSettingsModal from './StructuredSettingsModal';

interface ReferralConfig {
  minWeeklyRevenueForEligibility: number;
  minWeeksToPayBonus: number;
  base: 'repasse' | 'ganhosMenosIVA';
  maxLevels: number;
  levels: Record<number, number>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: ReferralConfig = {
  minWeeklyRevenueForEligibility: 550,
  minWeeksToPayBonus: 4,
  base: 'repasse',
  maxLevels: 3,
  levels: { 1: 0.02, 2: 0.01, 3: 0.005 },
};

export default function ReferralSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ReferralConfig>(DEFAULT_CONFIG);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/referral');
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
      const res = await fetch('/api/admin/settings/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Configuração de indicação salva com sucesso!' });
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

  const updateLevel = (level: number, value: number) => {
    setConfig((prev) => ({
      ...prev,
      levels: { ...prev.levels, [level]: Math.max(0, Math.min(1, value)) },
    }));
  };

  const sections = [
    {
      title: 'Critérios de Elegibilidade',
      description: 'Configure requisitos para que o motorista indicado receba bônus',
      fields: [
        {
          name: 'minWeeklyRevenueForEligibility',
          label: 'Receita Mínima Semanal (€)',
          type: 'number' as const,
          value: config.minWeeklyRevenueForEligibility,
          onChange: (value: number) =>
            setConfig({ ...config, minWeeklyRevenueForEligibility: Math.max(0, value) }),
          min: 0,
          step: 50,
          helperText: 'Receita mínima semanal necessária para elegibilidade de bônus',
        },
        {
          name: 'minWeeksToPayBonus',
          label: 'Semanas Mínimas para Pagamento',
          type: 'number' as const,
          value: config.minWeeksToPayBonus,
          onChange: (value: number) =>
            setConfig({ ...config, minWeeksToPayBonus: Math.max(1, value) }),
          min: 1,
          max: 52,
          step: 1,
          helperText: 'Número mínimo de semanas (pagamentos processados) para liberar bônus de indicação',
        },
      ],
    },
    {
      title: 'Configuração de Cálculo',
      description: 'Configure a base e níveis de bônus',
      fields: [
        {
          name: 'base',
          label: 'Base de Cálculo',
          type: 'select' as const,
          value: config.base,
          onChange: (value: string) =>
            setConfig({ ...config, base: value as 'repasse' | 'ganhosMenosIVA' }),
          options: [
            { label: 'Repasse (após despesas)', value: 'repasse' },
            { label: 'Ganhos Menos IVA', value: 'ganhosMenosIVA' },
          ],
          helperText: 'Base sobre a qual o percentual de bônus é calculado',
        },
        {
          name: 'maxLevels',
          label: 'Máximo de Níveis',
          type: 'number' as const,
          value: config.maxLevels,
          onChange: (value: number) =>
            setConfig({ ...config, maxLevels: Math.max(1, Math.min(10, value)) }),
          min: 1,
          max: 10,
          step: 1,
          helperText: 'Profundidade máxima da árvore de indicações',
        },
      ],
    },
    {
      title: 'Percentuais por Nível',
      description: 'Configure o percentual de bônus para cada nível',
      fields: Array.from({ length: config.maxLevels }, (_, i) => ({
        name: `level_${i + 1}`,
        label: `Nível ${i + 1} (%)`,
        type: 'number' as const,
        value: (config.levels[i + 1] || 0) * 100,
        onChange: (value: number) => updateLevel(i + 1, value / 100),
        min: 0,
        max: 100,
        step: 0.5,
        helperText: `Percentual de bônus para indicações de nível ${i + 1}`,
      })),
    },
  ];

  return (
    <StructuredSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração de Indicação"
      description="Configure os critérios e percentuais de bônus de indicação"
      isLoading={loading}
      isSaving={saving}
      error={error}
      onSave={save}
      sections={sections}
    />
  );
}

