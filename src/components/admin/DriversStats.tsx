import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiUsers, FiUserCheck, FiClock, FiUserPlus } from 'react-icons/fi';

interface StatsProps {
  stats: { total: number; active: number; pending: number; affiliates: number; renters: number };
  tc: (key: string, fallback: string) => string;
  t: (key: string, fallback: string) => string;
}

export default function DriversStats({ stats, tc, t }: StatsProps) {
  const items: GlobalStatItem[] = [
    {
      label: t('drivers.stats.total', 'Total'),
      value: stats.total,
      helpText: t('drivers.stats.totalDesc', 'Motoristas'),
      icon: FiUsers,
    },
    {
      label: t('drivers.stats.active', 'Ativos'),
      value: stats.active,
      helpText: t('drivers.stats.activeDesc', 'Trabalhando'),
      icon: FiUserCheck,
      color: 'green.500',
    },
    {
      label: t('drivers.stats.pending', 'Pendentes'),
      value: stats.pending,
      helpText: t('drivers.stats.pendingDesc', 'Aguardando validação'),
      icon: FiClock,
      color: 'orange.500',
    },
    {
      label: t('drivers.stats.affiliates', 'Afiliados'),
      value: stats.affiliates,
      helpText: `${stats.renters} ${t('drivers.stats.renters', 'Locatários')}`,
      icon: FiUserPlus,
      color: 'blue.500',
    },
  ];

  return <GlobalStats items={items} />;
}

