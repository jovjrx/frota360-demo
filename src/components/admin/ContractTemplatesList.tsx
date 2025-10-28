import React from 'react';
import GlobalList, { GlobalListItem, GlobalListColumn } from './GlobalList';
import { IconButton, Tooltip } from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiDownload } from 'react-icons/fi';
import type { ContractTemplate } from '@/schemas/contract-template';

interface ContractTemplatesListProps {
  templates: ContractTemplate[];
  onEdit: (template: ContractTemplate) => void;
  onDelete: (template: ContractTemplate) => void;
  onDownload: (template: ContractTemplate) => void;
  editingId: string | null;
  deletingId: string | null;
  t: (key: string, fallback: string) => string;
}

export default function ContractTemplatesList({
  templates,
  onEdit,
  onDelete,
  onDownload,
  editingId,
  deletingId,
  t,
}: ContractTemplatesListProps) {
  const items: GlobalListItem[] = templates.map((template) => ({
    id: template.id,
    primaryColumn: template.fileName,
    secondaryColumns: {
      category: template.category || '-',
      type: template.type,
    },
    badges: [
      {
        label: template.isActive
          ? t('templates.status.active', 'Ativo')
          : t('templates.status.inactive', 'Inativo'),
        colorScheme: template.isActive ? 'green' : 'gray',
      },
    ],
  }));

  return (
    <GlobalList
      items={items}
      primaryColumn={{ key: 'file', label: t('templates.column.file', 'Arquivo') }}
      secondaryColumns={[
        { key: 'category', label: t('templates.column.category', 'Categoria') },
        { key: 'type', label: t('templates.column.type', 'Tipo') },
      ]}
      badges={(item) => {
        const template = templates.find((t) => t.id === item.id);
        return template
          ? [
              {
                label: template.isActive
                  ? t('templates.status.active', 'Ativo')
                  : t('templates.status.inactive', 'Inativo'),
                colorScheme: template.isActive ? 'green' : 'gray',
              },
            ]
          : [];
      }}
      actions={(item) => {
        const template = templates.find((t) => t.id === item.id);
        if (!template) return null;
        return (
          <>
            <Tooltip label={t('templates.actions.download', 'Baixar')}>
              <IconButton
                aria-label="download"
                icon={<FiDownload />}
                onClick={() => onDownload(template)}
                size="sm"
              />
            </Tooltip>
            <Tooltip label={t('templates.actions.edit', 'Editar')}>
              <IconButton
                aria-label="edit"
                icon={<FiEdit />}
                onClick={() => onEdit(template)}
                isLoading={editingId === template.id}
                size="sm"
              />
            </Tooltip>
            <Tooltip label={t('templates.actions.delete', 'Deletar')}>
              <IconButton
                aria-label="delete"
                icon={<FiTrash2 />}
                onClick={() => onDelete(template)}
                isLoading={deletingId === template.id}
                colorScheme="red"
                size="sm"
              />
            </Tooltip>
          </>
        );
      }}
      resultLabel={t('templates.empty', 'modelos')}
    />
  );
}
