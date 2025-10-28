import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiFileText, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import type { DocumentRequestStats } from '@/schemas/document-request';

interface DocumentsStatsProps {
  stats?: DocumentRequestStats;
  t: (key: string, fallback: string) => string;
}

export default function DocumentsStats({ stats, t }: DocumentsStatsProps) {
  const items: GlobalStatItem[] = [
    {
      label: t('documents.stats.total', 'Total de Requisições'),
      value: stats?.total || 0,
      helpText: t('documents.stats.totalDesc', 'Solicitadas'),
      icon: FiFileText,
      color: 'blue.500',
    },
    {
      label: t('documents.stats.pending', 'Pendentes'),
      value: stats?.pending || 0,
      helpText: t('documents.stats.pendingDesc', 'Aguardando ação'),
      icon: FiClock,
      color: 'orange.500',
    },
    {
      label: t('documents.stats.approved', 'Aprovadas'),
      value: stats?.approved || 0,
      helpText: t('documents.stats.approvedDesc', 'Concluídas'),
      icon: FiCheckCircle,
      color: 'green.500',
    },
    {
      label: t('documents.stats.rejected', 'Rejeitadas'),
      value: stats?.rejected || 0,
      helpText: t('documents.stats.rejectedDesc', 'Resubmissão necessária'),
      icon: FiAlertCircle,
      color: 'red.500',
    },
  ];

  return <GlobalStats items={items} />;
}

