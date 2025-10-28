import React from 'react';
import GlobalFilters, { FilterOption } from './GlobalFilters';

interface DriversFiltersProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  fetchDrivers: () => Promise<void>;
  isLoading: boolean;
  tc: (key: string, fallback: string) => string;
  t: (key: string, fallback: string) => string;
}

export default function DriversFilters({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  fetchDrivers,
  isLoading,
  tc,
  t,
}: DriversFiltersProps) {
  const statusOptions: FilterOption[] = [
    { value: 'all', label: t('drivers.list.filters.status.all', 'Todos') },
    { value: 'active', label: tc('status.active', 'Ativo') },
    { value: 'pending', label: tc('status.pending', 'Pendente') },
    { value: 'inactive', label: tc('status.inactive', 'Inativo') },
  ];

  const typeOptions: FilterOption[] = [
    { value: 'all', label: t('drivers.list.filters.type.all', 'Todos') },
    { value: 'affiliate', label: t('drivers.type.affiliate', 'Afiliado') },
    { value: 'renter', label: t('drivers.type.renter', 'Locatário') },
  ];

  return (
    <GlobalFilters
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filters={[
        {
          value: filterStatus,
          onChange: setFilterStatus,
          options: statusOptions,
          maxW: '150px',
        },
        {
          value: filterType,
          onChange: setFilterType,
          options: typeOptions,
          maxW: '150px',
        },
      ]}
      onRefresh={fetchDrivers}
      isLoading={isLoading}
      searchPlaceholder={t('drivers.list.filters.searchPlaceholder', 'Pesquisar...')}
      refreshLabel={t('drivers.list.actions.refresh', 'Atualizar')}
    />
  );
}

