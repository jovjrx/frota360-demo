import React from 'react';
import {
  Card,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  HStack,
  Button,
  IconButton,
  Text,
} from '@chakra-ui/react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: {
    render: (row: any) => React.ReactNode;
  };
  emptyMessage?: string;
}

export function DataTable({ columns, data, actions, emptyMessage = 'Nenhum dado encontrado' }: DataTableProps) {
  const bgColor = 'white';
  const borderColor = 'gray.100';
  const headerBg = 'gray.50';

  if (data.length === 0) {
    return (
      <Card p={8} bg={bgColor} borderRadius="xl" border="1px" borderColor={borderColor}>
        <HStack justify="center">
          <Text color="gray.500">{emptyMessage}</Text>
        </HStack>
      </Card>
    );
  }

  return (
    <Card borderRadius="xl" boxShadow="sm" border="1px" borderColor={borderColor} overflow="hidden">
      <TableContainer>
        <Table variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              {columns.map((column) => (
                <Th
                  key={column.key}
                  fontWeight="semibold"
                  color="gray.700"
                  textAlign={column.align || 'left'}
                  py={4}
                >
                  {column.label}
                </Th>
              ))}
              {actions && (
                <Th fontWeight="semibold" color="gray.700" textAlign="center" py={4}>
                  Ações
                </Th>
              )}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, index) => (
              <Tr
                key={index}
                _hover={{ bg: 'gray.50' }}
                transition="background-color 0.2s"
              >
                {columns.map((column) => (
                  <Td key={column.key} textAlign={column.align || 'left'}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </Td>
                ))}
                {actions && (
                  <Td textAlign="center">
                    {actions.render(row)}
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Card>
  );
}
