import React, { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import StructuredSettingsModal from './StructuredSettingsModal';

type AdminFeeBase = 'ganhosBrutos' | 'ganhosMenosIVA' | 'ganhosBrutosMenosDespesas' | 'ganhosMenosIVAMenosDespesas';

interface AdminFeeRuleUI {
  mode: 'percent' | 'fixed';
  value: number;
  base: AdminFeeBase;
}

interface AdminFeeConfig {
  affiliate: AdminFeeRuleUI;
  renter: AdminFeeRuleUI;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: AdminFeeConfig = {
  affiliate: { mode: 'fixed', value: 25, base: 'ganhosMenosIVA' },
  renter: { mode: 'percent', value: 4, base: 'ganhosMenosIVA' },
};

export default function AdminFeeSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AdminFeeConfig>(DEFAULT_CONFIG);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/finance');
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
      const res = await fetch('/api/admin/settings/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Configuração de taxa salva com sucesso!' });
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

  return (
    <StructuredSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração de Taxa Administrativa"
      description="Configure como a taxa administrativa é cobrada dos motoristas"
      isLoading={loading}
      isSaving={saving}
      error={error}
      onSave={save}
      sections={[
        {
          title: 'Afiliado',
          description: 'Regra padrão aplicada aos afiliados (motoristas que não são locatários). Se o motorista tiver regra própria, ela prevalece.',
          fields: [
            {
              name: 'affiliate.mode',
              label: 'Modo de Cobrança',
              type: 'select',
              value: config.affiliate.mode,
              onChange: (value) => setConfig({ ...config, affiliate: { ...config.affiliate, mode: value as 'percent' | 'fixed' } }),
              options: [
                { label: 'Percentual (%)', value: 'percent' },
                { label: 'Valor Fixo (€)', value: 'fixed' },
              ],
              helperText: 'Percentual aplica sobre a base escolhida; Valor fixo ignora a base.',
            },
            {
              name: 'affiliate.value',
              label: 'Valor (%, €)',
              type: 'number',
              value: config.affiliate.value,
              onChange: (value) => setConfig({ ...config, affiliate: { ...config.affiliate, value: Math.max(0, value) } }),
              min: 0,
              step: 0.5,
            },
            {
              name: 'affiliate.base',
              label: 'Base de Cálculo',
              type: 'select',
              value: config.affiliate.base,
              onChange: (value) => setConfig({ ...config, affiliate: { ...config.affiliate, base: value as AdminFeeBase } }),
              options: [
                { label: 'Ganhos Brutos (Uber+Bolt)', value: 'ganhosBrutos' },
                { label: 'Ganhos - IVA', value: 'ganhosMenosIVA' },
                { label: 'Ganhos - Despesas (combustível, portagens, aluguel, financiamento)', value: 'ganhosBrutosMenosDespesas' },
                { label: 'Ganhos - IVA - Despesas', value: 'ganhosMenosIVAMenosDespesas' },
              ],
            },
          ],
        },
        {
          title: 'Locatário',
          description: 'Regra padrão aplicada aos locatários. Se o motorista tiver regra própria, ela prevalece.',
          fields: [
            {
              name: 'renter.mode',
              label: 'Modo de Cobrança',
              type: 'select',
              value: config.renter.mode,
              onChange: (value) => setConfig({ ...config, renter: { ...config.renter, mode: value as 'percent' | 'fixed' } }),
              options: [
                { label: 'Percentual (%)', value: 'percent' },
                { label: 'Valor Fixo (€)', value: 'fixed' },
              ],
              helperText: 'Percentual aplica sobre a base escolhida; Valor fixo ignora a base.',
            },
            {
              name: 'renter.value',
              label: 'Valor (%, €)',
              type: 'number',
              value: config.renter.value,
              onChange: (value) => setConfig({ ...config, renter: { ...config.renter, value: Math.max(0, value) } }),
              min: 0,
              step: 0.5,
            },
            {
              name: 'renter.base',
              label: 'Base de Cálculo',
              type: 'select',
              value: config.renter.base,
              onChange: (value) => setConfig({ ...config, renter: { ...config.renter, base: value as AdminFeeBase } }),
              options: [
                { label: 'Ganhos Brutos (Uber+Bolt)', value: 'ganhosBrutos' },
                { label: 'Ganhos - IVA', value: 'ganhosMenosIVA' },
                { label: 'Ganhos - Despesas (combustível, portagens, aluguel, financiamento)', value: 'ganhosBrutosMenosDespesas' },
                { label: 'Ganhos - IVA - Despesas', value: 'ganhosMenosIVAMenosDespesas' },
              ],
            },
          ],
        },
      ]}
    />
  );
}

