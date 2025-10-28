import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Icon,
  Tooltip,
  useColorModeValue,
  Heading,
} from '@chakra-ui/react';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  isNumeric?: boolean;
  width?: string;
  isSortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableAction<T> {
  label: string;
  icon?: React.ElementType;
  onClick: (row: T) => void;
  colorScheme?: string;
  isDisabled?: (row: T) => boolean;
  showLabel?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  striped?: boolean;
  hover?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'simple' | 'striped' | 'unstyled';
}

export function DataTable<T extends { id?: string; [key: string]: any }>({
  data,
  columns,
  actions,
  onRowClick,
  isLoading = false,
  emptyMessage = 'Nenhum dado encontrado',
  title,
  striped = true,
  hover = true,
  size = 'sm',
  variant = 'striped',
}: DataTableProps<T>) {
  const bgHover = useColorModeValue('gray.50', 'gray.700');
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (data.length === 0 && !isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        p={8}
        textAlign="center"
      >
        <Text color="gray.500">{emptyMessage}</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={0}>
      {title && (
        <Box p={4} borderBottomWidth="1px" borderColor={borderColor}>
          <Heading size="md" color="gray.700">
            {title}
          </Heading>
        </Box>
      )}
      <Box
        bg={cardBg}
        borderRadius={title ? '0 0 lg lg' : 'lg'}
        borderWidth="1px"
        borderColor={borderColor}
        borderTopWidth={title ? '0' : '1px'}
        overflowX="auto"
      >
        <TableContainer>
          <Table size={size} variant={variant}>
            <Thead bg={headerBg}>
              <Tr>
                {columns.map((column, idx) => (
                  <Th
                    key={idx}
                    isNumeric={column.isNumeric}
                    width={column.width}
                    fontSize="xs"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                    color="gray.600"
                  >
                    {column.header}
                  </Th>
                ))}
                {actions && actions.length > 0 && (
                  <Th fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em" color="gray.600">
                    Ações
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row, rowIdx) => (
                <Tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  cursor={onRowClick ? 'pointer' : 'auto'}
                  _hover={hover && onRowClick ? { bg: bgHover } : {}}
                  transition="background-color 0.2s"
                >
                  {columns.map((column, colIdx) => {
                    const value =
                      typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : row[column.accessor as keyof T];

                    return (
                      <Td
                        key={colIdx}
                        isNumeric={column.isNumeric}
                        fontSize="sm"
                        py={3}
                        px={4}
                      >
                        {column.render ? column.render(value, row) : value}
                      </Td>
                    );
                  })}
                  {actions && actions.length > 0 && (
                    <Td py={3} px={4}>
                      <HStack spacing={2} justify="flex-start">
                        {actions.map((action, idx) => (
                          <Tooltip key={idx} label={action.label} placement="top">
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme={action.colorScheme || 'blue'}
                              leftIcon={action.icon ? <Icon as={action.icon} /> : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              isDisabled={action.isDisabled?.(row)}
                            >
                              {action.showLabel ? action.label : ''}
                            </Button>
                          </Tooltip>
                        ))}
                      </HStack>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </VStack>
  );
}
