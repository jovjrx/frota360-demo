import React from 'react';
import GlobalList from './GlobalList';
import { IconButton, Tooltip, Icon } from '@chakra-ui/react';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';
import type { DocumentRequest } from '@/schemas/document-request';

interface DocumentsListProps {
  documents: DocumentRequest[];
  onReview: (doc: DocumentRequest) => void;
  onDelete: (doc: DocumentRequest) => void;
  reviewingId?: string | null;
  deletingId?: string | null;
  t: (key: string, fallback: string) => string;
}

const statusColorScheme: Record<string, string> = {
  pending: 'yellow',
  submitted: 'blue',
  approved: 'green',
  rejected: 'red',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  submitted: 'Enviada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export default function DocumentsList({
  documents,
  onReview,
  onDelete,
  reviewingId,
  deletingId,
  t,
}: DocumentsListProps) {
  return (
    <GlobalList
      items={documents}
      primaryColumn={{
        key: 'driverName',
        render: (item: DocumentRequest) => item.driverName || 'Categoria da Empresa',
      }}
      secondaryColumns={[
        {
          key: 'documentName',
          render: (item: DocumentRequest) => item.documentName || 'Sem nome',
        },
      ]}
      badges={(doc) => [
        {
          label: t(`documents.status.${doc.status}`, statusLabel[doc.status] || doc.status),
          colorScheme: statusColorScheme[doc.status] || 'gray',
        },
      ]}
      actions={(doc) => (
        <>
          {doc.status === 'pending' && (
            <Tooltip label={t('documents.actions.review', 'Revisar')}>
              <IconButton
                aria-label={t('documents.actions.review', 'Revisar')}
                icon={<Icon as={FiEdit2} />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                isLoading={reviewingId === doc.id}
                onClick={() => onReview(doc)}
              />
            </Tooltip>
          )}

          <Tooltip label={t('documents.actions.delete', 'Deletar')}>
            <IconButton
              aria-label={t('documents.actions.delete', 'Deletar')}
              icon={<Icon as={FiTrash2} />}
              size="sm"
              colorScheme="red"
              variant="outline"
              isLoading={deletingId === doc.id}
              onClick={() => onDelete(doc)}
            />
          </Tooltip>
        </>
      )}
      resultLabel={t('documents.list.results', 'requisições')}
    />
  );
}
