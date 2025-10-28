import React from 'react';
import { HStack, Box, Icon, Input, Select, Button } from '@chakra-ui/react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';

export interface FilterOption {
  value: string;
  label: string;
}

interface GlobalFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filters?: Array<{
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: FilterOption[];
    maxW?: string;
  }>;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  searchPlaceholder?: string;
  refreshLabel?: string;
}

export default function GlobalFilters({
  searchQuery,
  onSearchChange,
  filters = [],
  onRefresh,
  isLoading = false,
  searchPlaceholder = 'Pesquisar...',
  refreshLabel = 'Atualizar',
}: GlobalFiltersProps) {
  return (
    <HStack spacing={4}>
      <Box flex={1} minW="200px">
        <HStack>
          <Icon as={FiSearch} color="gray.400" />
          <Input
            size="sm"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </HStack>
      </Box>

      {filters.map((filter, idx) => (
        <Select
          key={idx}
          size="sm"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          maxW={filter.maxW || '150px'}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      ))}

      <Button
        size="sm"
        leftIcon={<Icon as={FiRefreshCw} />}
        onClick={onRefresh}
        isLoading={isLoading}
        iconSpacing={0}
      />
    </HStack>
  );
}

