import React from 'react';
import GlobalStats, { GlobalStatItem } from './GlobalStats';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import type { DriverContract } from '@/schemas/driver-contract';

interface ContractsSentStatsProps {
  contracts: DriverContract[];
  t: (key: string, fallback: string) => string;
}

export default function ContractsSentStats({
  contracts,
  t,
}: ContractsSentStatsProps) {
  const total = contracts.length;
  const pending = contracts.filter((c) => c.status === 'pending_signature').length;
  const submitted = contracts.filter((c) => c.status === 'submitted').length;
  const approved = contracts.filter((c) => c.status === 'approved').length;

  const items: GlobalStatItem[] = [
    {
      label: t('contracts.stats.total', 'Total Enviados'),
      value: total,
      helpText: t('contracts.stats.totalDesc', 'Todos'),
      icon: FiFileText,
      color: 'blue.500',
    },
    {
      label: t('contracts.stats.pending', 'Pendentes Assinatura'),
      value: pending,
      helpText: t('contracts.stats.pendingDesc', 'Aguardando motorista'),
      icon: FiClock,
      color: 'orange.500',
    },
    {
      label: t('contracts.stats.submitted', 'Assinados'),
      value: submitted,
      helpText: t('contracts.stats.submittedDesc', 'Pendente aprovação'),
      icon: FiFileText,
      color: 'blue.500',
    },
    {
      label: t('contracts.stats.approved', 'Aprovados'),
      value: approved,
      helpText: t('contracts.stats.approvedDesc', 'Aprovados'),
      icon: FiCheckCircle,
      color: 'green.500',
    },
  ];

  return <GlobalStats items={items} />;
}
