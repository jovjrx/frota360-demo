import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiTrendingUp, FiDollarSign, FiUsers, FiBarChart2 } from 'react-icons/fi';

interface PerformanceStatsProps {
  stats: { totalMetrics: number; revenue: number; activeDrivers: number; avgPerformance: number };
  t: (key: string, fallback: string) => string;
}

export default function PerformanceStats({ stats, t }: PerformanceStatsProps) {
  const items: GlobalStatItem[] = [
    {
      label: t('performance.stats.metrics', 'Métricas'),
      value: stats.totalMetrics,
      helpText: t('performance.stats.metricsDesc', 'Rastreadas'),
      icon: FiBarChart2,
      color: 'blue.500',
    },
    {
      label: t('performance.stats.revenue', 'Receita'),
      value: stats.revenue,
      helpText: t('performance.stats.revenueDesc', 'Período'),
      icon: FiDollarSign,
      color: 'green.500',
    },
    {
      label: t('performance.stats.drivers', 'Motoristas'),
      value: stats.activeDrivers,
      helpText: t('performance.stats.driversDesc', 'Ativos'),
      icon: FiUsers,
      color: 'orange.500',
    },
    {
      label: t('performance.stats.average', 'Média'),
      value: stats.avgPerformance,
      helpText: t('performance.stats.averageDesc', 'Desempenho'),
      icon: FiTrendingUp,
      color: 'purple.500',
    },
  ];

  return <GlobalStats items={items} />;
}

