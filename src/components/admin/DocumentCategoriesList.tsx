import React from 'react';
import {
  Box,
  VStack,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import type { DocumentCategory } from '@/schemas/document-category';

interface DocumentCategoriesListProps {
  categories: DocumentCategory[];
  onEdit: (category: DocumentCategory) => void;
  onDelete: (category: DocumentCategory) => void;
  editingId: string | null;
  deletingId: string | null;
  t: (key: string, fallback: string) => string;
}

export default function DocumentCategoriesList({
  categories,
  onEdit,
  onDelete,
  editingId,
  deletingId,
  t,
}: DocumentCategoriesListProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'company':
        return t('categories.type.company', 'Empresa');
      case 'affiliate':
        return t('categories.type.affiliate', 'Afiliado');
      case 'renter':
        return t('categories.type.renter', 'Locatário');
      default:
        return type;
    }
  };

  if (categories.length === 0) {
    return (
      <Box textAlign="center" py={8} color="gray.500">
        {t('categories.empty', 'Nenhuma categoria de documento')}
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>{t('categories.column.name', 'Nome')}</Th>
            <Th>{t('categories.column.type', 'Tipo')}</Th>
            <Th>{t('categories.column.description', 'Descrição')}</Th>
            <Th w="100px">{t('common.actions', 'Ações')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {categories.map((category) => (
            <Tr key={category.id} _hover={{ bg: 'gray.50' }}>
              <Td fontWeight="semibold">{category.name}</Td>
              <Td>
                <Badge colorScheme={category.type === 'company' ? 'purple' : category.type === 'affiliate' ? 'blue' : 'orange'}>
                  {getTypeLabel(category.type)}
                </Badge>
              </Td>
              <Td fontSize="sm">{category.description || '-'}</Td>
              <Td>
                <HStack spacing={1}>
                  <Tooltip label={t('categories.actions.edit', 'Editar')}>
                    <IconButton
                      aria-label="edit"
                      icon={<FiEdit />}
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(category)}
                      isLoading={editingId === category.id}
                    />
                  </Tooltip>
                  <Tooltip label={t('categories.actions.delete', 'Deletar')}>
                    <IconButton
                      aria-label="delete"
                      icon={<FiTrash2 />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => onDelete(category)}
                      isLoading={deletingId === category.id}
                    />
                  </Tooltip>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
