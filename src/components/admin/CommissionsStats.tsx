import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiDollarSign, FiCheckCircle, FiClock, FiBarChart2 } from 'react-icons/fi';

interface CommissionsStatsProps {
  stats: { total: number; paid: number; pending: number; average: number };
  t: (key: string, fallback: string) => string;
}

export default function CommissionsStats({ stats, t }: CommissionsStatsProps) {
  const items: GlobalStatItem[] = [
    {
      label: t('commissions.stats.total', 'Total'),
      value: stats.total,
      helpText: t('commissions.stats.totalDesc', 'Todas as comissões'),
      icon: FiDollarSign,
      color: 'blue.500',
    },
    {
      label: t('commissions.stats.paid', 'Pagas'),
      value: stats.paid,
      helpText: t('commissions.stats.paidDesc', 'Liquidadas'),
      icon: FiCheckCircle,
      color: 'green.500',
    },
    {
      label: t('commissions.stats.pending', 'Pendentes'),
      value: stats.pending,
      helpText: t('commissions.stats.pendingDesc', 'Processamento'),
      icon: FiClock,
      color: 'orange.500',
    },
    {
      label: t('commissions.stats.average', 'Média'),
      value: stats.average,
      helpText: t('commissions.stats.averageDesc', 'Por motorista'),
      icon: FiBarChart2,
      color: 'purple.500',
    },
  ];

  return <GlobalStats items={items} />;
}

