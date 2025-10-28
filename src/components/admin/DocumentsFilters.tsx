import React from 'react';
import GlobalFilters, { FilterOption } from './GlobalFilters';

interface DocumentsFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  t: (key: string, fallback: string) => string;
}

export default function DocumentsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  isLoading,
  t,
}: DocumentsFiltersProps) {
  const statusOptions: FilterOption[] = [
    { value: 'all', label: t('documents.filters.status.all', 'Todos os Status') },
    { value: 'pending', label: t('documents.filters.status.pending', 'Pendentes') },
    { value: 'submitted', label: t('documents.filters.status.submitted', 'Enviadas') },
    { value: 'approved', label: t('documents.filters.status.approved', 'Aprovadas') },
    { value: 'rejected', label: t('documents.filters.status.rejected', 'Rejeitadas') },
  ];

  return (
    <GlobalFilters
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      filters={[
        {
          value: statusFilter || 'all',
          onChange: (val) => onStatusChange(val === 'all' ? '' : val),
          options: statusOptions,
          maxW: '180px',
        },
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      searchPlaceholder={t('documents.filters.searchPlaceholder', 'Pesquisar motorista ou documento...')}
      refreshLabel={t('documents.filters.refresh', 'Atualizar')}
    />
  );
}
