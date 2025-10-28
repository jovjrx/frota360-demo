import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  HStack,
  VStack,
  Text,
  Box,
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { CommissionRule } from '@/schemas/commission-rule';

interface CommissionsListProps {
  commissions: CommissionRule[];
  onEdit: (commission: CommissionRule) => void;
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => void;
  translations?: Record<string, any>;
}

export function CommissionsList({
  commissions,
  onEdit,
  onDelete,
  translations,
}: CommissionsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    if (!window.confirm('Tem certeza que deseja deletar esta comissão?')) return;

    try {
      setIsDeleting(id);
      await onDelete(id);
    } finally {
      setIsDeleting(null);
    }
  };

  if (commissions.length === 0) {
    return (
      <Box textAlign="center" py={10} color="gray.500">
        <Text>{translations?.admin?.commissions?.empty || 'Nenhuma regra de comissão configurada'}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th>Tipo</Th>
              <Th>Nível</Th>
              <Th isNumeric>Percentual</Th>
              <Th isNumeric>Valor Fixo</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {commissions.map((commission) => (
              <Tr key={commission.id}>
                <Td fontSize="sm">
                  <Badge colorScheme={commission.type === 'base' ? 'blue' : 'purple'}>
                    {commission.type === 'base' ? 'Base' : 'Recrutamento'}
                  </Badge>
                </Td>
                <Td fontSize="sm">Nível {commission.level}</Td>
                <Td isNumeric fontSize="sm">{commission.percentage}%</Td>
                <Td isNumeric fontSize="sm">
                  {commission.value ? `€${commission.value.toFixed(2)}` : '-'}
                </Td>
                <Td>
                  <Badge colorScheme={commission.ativo ? 'green' : 'gray'}>
                    {commission.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Editar"
                      icon={<FiEdit2 />}
                      size="sm"
                      onClick={() => onEdit(commission)}
                    />
                    {onDelete && (
                      <IconButton
                        aria-label="Deletar"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        isLoading={isDeleting === commission.id}
                        onClick={() => handleDelete(commission.id!)}
                      />
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
}
