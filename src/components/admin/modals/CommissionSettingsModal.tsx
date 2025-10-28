import React, { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import StructuredSettingsModal from './StructuredSettingsModal';

type BaseOption = 'repasse' | 'ganhosMenosIVA';

interface CommissionConfigDto {
  minWeeklyRevenueForEligibility: number;
  base: BaseOption;
  maxLevels: number;
  levels: Record<number, number>; // decimal percents ex: 0.02
}

const DEFAULT_CFG: CommissionConfigDto = {
  minWeeklyRevenueForEligibility: 550,
  base: 'repasse',
  maxLevels: 3,
  levels: { 1: 0.02, 2: 0.01, 3: 0.005 },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommissionSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cfg, setCfg] = useState<CommissionConfigDto>(DEFAULT_CFG);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/commissions');
      const data = await res.json();
      if (data?.success) setCfg(data.config as CommissionConfigDto);
    } catch (e) {
      setError('Falha ao carregar configuração');
      toast({ status: 'error', title: 'Erro ao carregar configuração' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const onChangeLevel = (level: number, value: number) => {
    setCfg(prev => ({ ...prev, levels: { ...prev.levels, [level]: value } }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...cfg,
        maxLevels: Math.max(1, Math.min(10, cfg.maxLevels)),
        levels: Object.fromEntries(Array.from({ length: Math.max(1, Math.min(10, cfg.maxLevels)) }, (_, i) => {
          const level = i + 1;
          return [String(level), cfg.levels[level] || 0];
        })),
      } as any;
      const res = await fetch('/api/admin/settings/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Configuração de comissões salva com sucesso!' });
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
      description: 'Configure o requisito mínimo de receita semanal',
      fields: [
        {
          name: 'minWeeklyRevenueForEligibility',
          label: 'Receita Mínima Semanal (€)',
          type: 'number' as const,
          value: cfg.minWeeklyRevenueForEligibility,
          onChange: (value: number) =>
            setCfg({ ...cfg, minWeeklyRevenueForEligibility: Math.max(0, value) }),
          min: 0,
          step: 50,
          helperText: 'Receita mínima semanal necessária para elegibilidade de comissão',
        },
        {
          name: 'maxLevels',
          label: 'Máximo de Níveis',
          type: 'number' as const,
          value: cfg.maxLevels,
          onChange: (value: number) =>
            setCfg({ ...cfg, maxLevels: Math.max(1, Math.min(10, value)) }),
          min: 1,
          max: 10,
          step: 1,
          helperText: 'Profundidade máxima da árvore de comissões',
        },
      ],
    },
    {
      title: 'Percentuais por Nível',
      description: 'Configure o percentual de comissão para cada nível de indicação',
      fields: Array.from({ length: cfg.maxLevels }, (_, i) => ({
        name: `level_${i + 1}`,
        label: `Nível ${i + 1} (%)`,
        type: 'number' as const,
        value: (cfg.levels[i + 1] || 0) * 100,
        onChange: (value: number) =>
          onChangeLevel(i + 1, Math.max(0, Math.min(100, value)) / 100),
        min: 0,
        max: 100,
        step: 0.5,
        helperText: `Percentual de comissão para indicações de nível ${i + 1}`,
      })),
    },
  ];

  return (
    <StructuredSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração de Comissões"
      description="Configure os critérios e percentuais de comissão multinível"
      isLoading={loading}
      isSaving={saving}
      error={error}
      onSave={save}
      sections={sections}
    />
  );
}

