import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiFileText, FiCheckCircle } from 'react-icons/fi';
import type { ContractTemplate } from '@/schemas/contract-template';

interface ContractTemplatesStatsProps {
  templates: ContractTemplate[];
  t: (key: string, fallback: string) => string;
}

export default function ContractTemplatesStats({
  templates,
  t,
}: ContractTemplatesStatsProps) {
  const total = templates.length;
  const active = templates.filter((t) => t.isActive).length;

  const items: GlobalStatItem[] = [
    {
      label: t('templates.stats.total', 'Total de Modelos'),
      value: total,
      helpText: t('templates.stats.totalDesc', 'Todos'),
      icon: FiFileText,
      color: 'blue.500',
    },
    {
      label: t('templates.stats.active', 'Modelos Ativos'),
      value: active,
      helpText: t('templates.stats.activeDesc', 'Habilitados'),
      icon: FiCheckCircle,
      color: 'green.500',
    },
  ];

  return <GlobalStats items={items} />;
}
