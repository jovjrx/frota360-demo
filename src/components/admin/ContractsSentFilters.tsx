import React, { useMemo } from 'react';
import GlobalFilters, { FilterOption } from './GlobalFilters';

interface ContractsSentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  t: (key: string, fallback: string) => string;
}

export default function ContractsSentFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onRefresh,
  isLoading,
  t,
}: ContractsSentFiltersProps) {
  const statusOptions: FilterOption[] = useMemo(
    () => [
      { value: 'all', label: t('contracts.filter.all', 'Todos') },
      { value: 'pending_signature', label: t('contracts.filter.pending', 'Pendentes Assinatura') },
      { value: 'submitted', label: t('contracts.filter.submitted', 'Assinados') },
      { value: 'approved', label: t('contracts.filter.approved', 'Aprovados') },
      { value: 'rejected', label: t('contracts.filter.rejected', 'Rejeitados') },
    ],
    [t]
  );

  const typeOptions: FilterOption[] = useMemo(
    () => [
      { value: 'all', label: t('contracts.filter.allTypes', 'Todos os Tipos') },
      { value: 'affiliate', label: t('contracts.filter.affiliate', 'Afiliado') },
      { value: 'renter', label: t('contracts.filter.renter', 'Locatário') },
    ],
    [t]
  );

  return (
    <GlobalFilters
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      filters={[
        {
          value: statusFilter,
          onChange: onStatusChange,
          options: statusOptions,
        },
        {
          value: typeFilter,
          onChange: onTypeChange,
          options: typeOptions,
        },
      ]}
      onRefresh={() => onRefresh()}
      isLoading={isLoading}
    />
  );
}
