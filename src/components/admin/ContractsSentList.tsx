import React from 'react';
import GlobalList, { GlobalListColumn } from './GlobalList';
import { IconButton, Tooltip } from '@chakra-ui/react';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import type { DriverContract } from '@/schemas/driver-contract';

interface ContractsSentListProps {
  contracts: DriverContract[];
  onView: (contract: DriverContract) => void;
  onDelete: (contract: DriverContract) => void;
  viewingId: string | null;
  deletingId: string | null;
  t: (key: string, fallback: string) => string;
}

export default function ContractsSentList({
  contracts,
  onView,
  onDelete,
  viewingId,
  deletingId,
  t,
}: ContractsSentListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_signature':
        return 'orange';
      case 'submitted':
        return 'blue';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_signature':
        return t('contracts.status.pending', 'Pendente');
      case 'submitted':
        return t('contracts.status.submitted', 'Assinado');
      case 'approved':
        return t('contracts.status.approved', 'Aprovado');
      case 'rejected':
        return t('contracts.status.rejected', 'Rejeitado');
      default:
        return status;
    }
  };

  const primaryColumn: GlobalListColumn = {
    key: 'driverName',
    label: t('contracts.column.driver', 'Motorista'),
  };

  const secondaryColumns: GlobalListColumn[] = [
    {
      key: 'category',
      label: t('contracts.column.category', 'Categoria'),
      render: (item) => (item as any).category || '-',
    },
    {
      key: 'contractType',
      label: t('contracts.column.type', 'Tipo'),
    },
  ];

  return (
    <GlobalList
      items={contracts}
      primaryColumn={primaryColumn}
      secondaryColumns={secondaryColumns}
      badges={(contract: any) => [
        {
          label: getStatusLabel(contract.status),
          colorScheme: getStatusColor(contract.status),
        },
      ]}
      actions={(contract: any) => (
        <>
          <Tooltip label={t('contracts.actions.view', 'Visualizar')}>
            <IconButton
              aria-label="view"
              icon={<FiDownload />}
              onClick={() => onView(contract)}
              isLoading={viewingId === contract.id}
              size="sm"
            />
          </Tooltip>
          <Tooltip label={t('contracts.actions.delete', 'Deletar')}>
            <IconButton
              aria-label="delete"
              icon={<FiTrash2 />}
              onClick={() => onDelete(contract)}
              isLoading={deletingId === contract.id}
              colorScheme="red"
              size="sm"
            />
          </Tooltip>
        </>
      )}
      resultLabel={t('contracts.empty', 'contratos')}
    />
  );
}
