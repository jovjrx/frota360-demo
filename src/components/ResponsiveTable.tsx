import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  useBreakpointValue,
  TableContainer,
} from '@chakra-ui/react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  isNumeric?: boolean;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (item: T, index: number) => string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'simple' | 'striped' | 'unstyled';
}

/**
 * Componente de tabela responsiva genérica
 * 
 * Características:
 * - Scroll horizontal em mobile
 * - Colunas podem ser ocultadas em mobile
 * - Suporta renderização customizada de células
 * - Tamanhos e variantes do Chakra UI
 * 
 * @example
 * const columns: Column<Driver>[] = [
 *   { key: 'name', label: 'Nome' },
 *   { key: 'email', label: 'Email', hideOnMobile: true },
 *   { 
 *     key: 'status', 
 *     label: 'Status',
 *     render: (driver) => <Badge>{driver.status}</Badge>
 *   },
 * ];
 * 
 * <ResponsiveTable
 *   columns={columns}
 *   data={drivers}
 *   getRowKey={(driver) => driver.id}
 * />
 */
export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  getRowKey,
  size = 'sm',
  variant = 'simple',
}: ResponsiveTableProps<T>) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Filtrar colunas baseado em mobile
  const visibleColumns = isMobile
    ? columns.filter(col => !col.hideOnMobile)
    : columns;

  return (
    <TableContainer>
      <Box overflowX="auto">
        <Table size={size} variant={variant}>
          <Thead>
            <Tr>
              {visibleColumns.map((column) => (
                <Th key={column.key} isNumeric={column.isNumeric}>
                  {column.label}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.length === 0 ? (
              <Tr>
                <Td colSpan={visibleColumns.length} textAlign="center" color="gray.500">
                  Nenhum registro encontrado
                </Td>
              </Tr>
            ) : (
              data.map((item, index) => (
                <Tr key={getRowKey(item, index)}>
                  {visibleColumns.map((column) => (
                    <Td key={column.key} isNumeric={column.isNumeric}>
                      {column.render
                        ? column.render(item)
                        : item[column.key] ?? '—'}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
    </TableContainer>
  );
}


