import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiTarget, FiCheckCircle, FiClock, FiAward } from 'react-icons/fi';

interface GoalsStatsProps {
  stats: { total: number; completed: number; inProgress: number; rewards: number };
  t: (key: string, fallback: string) => string;
}

export default function GoalsStats({ stats, t }: GoalsStatsProps) {
  const items: GlobalStatItem[] = [
    {
      label: t('goals.stats.total', 'Metas Ativas'),
      value: stats.total,
      helpText: t('goals.stats.totalDesc', 'Total'),
      icon: FiTarget,
      color: 'blue.500',
    },
    {
      label: t('goals.stats.completed', 'Concluídas'),
      value: stats.completed,
      helpText: t('goals.stats.completedDesc', 'Alcançadas'),
      icon: FiCheckCircle,
      color: 'green.500',
    },
    {
      label: t('goals.stats.inProgress', 'Em Progresso'),
      value: stats.inProgress,
      helpText: t('goals.stats.inProgressDesc', 'Cursando'),
      icon: FiClock,
      color: 'orange.500',
    },
    {
      label: t('goals.stats.rewards', 'Recompensas'),
      value: stats.rewards,
      helpText: t('goals.stats.rewardsDesc', 'Distribuídas'),
      icon: FiAward,
      color: 'purple.500',
    },
  ];

  return <GlobalStats items={items} />;
}

