import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiUsers, FiTrendingUp, FiDollarSign, FiAward } from 'react-icons/fi';

interface ReferralsStatsProps {
  stats: { total: number; earned: number; pending: number; topReferrer: number };
  t: (key: string, fallback: string) => string;
}

export default function ReferralsStats({ stats, t }: ReferralsStatsProps) {
  const items: GlobalStatItem[] = [
    {
      label: t('referrals.stats.total', 'Referências'),
      value: stats.total,
      helpText: t('referrals.stats.totalDesc', 'Total'),
      icon: FiUsers,
      color: 'blue.500',
    },
    {
      label: t('referrals.stats.earned', 'Ganho'),
      value: stats.earned,
      helpText: t('referrals.stats.earnedDesc', 'Comissões'),
      icon: FiTrendingUp,
      color: 'green.500',
    },
    {
      label: t('referrals.stats.pending', 'Pendentes'),
      value: stats.pending,
      helpText: t('referrals.stats.pendingDesc', 'Processamento'),
      icon: FiDollarSign,
      color: 'orange.500',
    },
    {
      label: t('referrals.stats.topReferrer', 'Top'),
      value: stats.topReferrer,
      helpText: t('referrals.stats.topReferrerDesc', 'Melhor referenciador'),
      icon: FiAward,
      color: 'purple.500',
    },
  ];

  return <GlobalStats items={items} />;
}

