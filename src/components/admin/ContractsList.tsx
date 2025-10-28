import React from 'react';
import GlobalList from './GlobalList';
import { IconButton, Tooltip, Icon } from '@chakra-ui/react';
import { FiDownload, FiTrash2, FiEdit2 } from 'react-icons/fi';
import type { DriverContract } from '@/schemas/driver-contract';

interface ContractsListProps {
  contracts: DriverContract[];
  onView: (contract: DriverContract) => Promise<void>;
  onDelete: (contract: DriverContract) => Promise<void>;
  viewingId?: string | null;
  deletingId?: string | null;
  t: (key: string, fallback: string) => string;
}

const statusColorScheme: Record<string, string> = {
  pending_signature: 'yellow',
  submitted: 'blue',
  approved: 'green',
  rejected: 'red',
};

const statusLabel: Record<string, string> = {
  pending_signature: 'Pendente Assinatura',
  submitted: 'Assinado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export default function ContractsList({
  contracts,
  onView,
  onDelete,
  viewingId,
  deletingId,
  t,
}: ContractsListProps) {
  return (
    <GlobalList
      items={contracts}
      primaryColumn={{
        key: 'driverName',
        render: (item: DriverContract) => item.driverName || 'Motorista Desconhecido',
      }}
      secondaryColumns={[
        {
          key: 'category',
          render: (item: DriverContract) => item.category || item.contractType,
        },
      ]}
      badges={(contract) => [
        {
          label: t(`contracts.status.${contract.status}`, statusLabel[contract.status] || contract.status),
          colorScheme: statusColorScheme[contract.status] || 'gray',
        },
      ]}
      actions={(contract) => (
        <>
          <Tooltip label={t('contracts.actions.view', 'Visualizar')}>
            <IconButton
              aria-label={t('contracts.actions.view', 'Visualizar')}
              icon={<Icon as={FiDownload} />}
              size="sm"
              colorScheme="blue"
              variant="outline"
              isLoading={viewingId === contract.id}
              onClick={() => onView(contract)}
            />
          </Tooltip>

          <Tooltip label={t('contracts.actions.delete', 'Deletar')}>
            <IconButton
              aria-label={t('contracts.actions.delete', 'Deletar')}
              icon={<Icon as={FiTrash2} />}
              size="sm"
              colorScheme="red"
              variant="outline"
              isLoading={deletingId === contract.id}
              onClick={() => onDelete(contract)}
            />
          </Tooltip>
        </>
      )}
      resultLabel={t('contracts.list.results', 'contratos')}
    />
  );
}
