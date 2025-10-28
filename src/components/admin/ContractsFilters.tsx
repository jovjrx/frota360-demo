import React from 'react';
import GlobalFilters, { FilterOption } from './GlobalFilters';
import type { DriverContract } from '@/schemas/driver-contract';

interface ContractsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  t: (key: string, fallback: string) => string;
}

export default function ContractsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  isLoading = false,
  t,
}: ContractsFiltersProps) {
  const statusOptions: FilterOption[] = [
    { value: 'all', label: t('contracts.filters.allStatuses', 'Todos os Status') },
    { value: 'pending_signature', label: t('contracts.filters.status.pending', 'Pendentes Assinatura') },
    { value: 'submitted', label: t('contracts.filters.status.submitted', 'Assinados') },
    { value: 'approved', label: t('contracts.filters.status.approved', 'Aprovados') },
    { value: 'rejected', label: t('contracts.filters.status.rejected', 'Rejeitados') },
  ];

  return (
    <GlobalFilters
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('contracts.filters.search', 'Pesquisar motorista ou contrato...')}
      filters={[
        {
          label: t('contracts.filters.statusLabel', 'Status'),
          value: statusFilter,
          onChange: onStatusChange,
          options: statusOptions,
        },
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
    />
  );
}
