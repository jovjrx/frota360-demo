import React from 'react';
import GlobalList from './GlobalList';
import { IconButton, Tooltip, Icon } from '@chakra-ui/react';
import { FiSend, FiXCircle, FiCheckCircle, FiEdit } from 'react-icons/fi';

interface Driver {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  status?: string;
  type?: string;
}

interface DriversListProps {
  drivers: Driver[];
  getStatusColor: (s?: string) => string;
  handleSendAccess: (d: Driver) => Promise<void>;
  sendingAccessId: string | null;
  changingStatusId: string | null;
  updateDriverStatus: (d: Driver, status: 'active' | 'inactive' | 'suspended' | 'pending') => Promise<void>;
  handleEdit: (d: Driver) => void;
  t: (key: string, fallback: string) => string;
}

export default function DriversList({
  drivers,
  getStatusColor,
  handleSendAccess,
  sendingAccessId,
  changingStatusId,
  updateDriverStatus,
  handleEdit,
  t,
}: DriversListProps) {
  return (
    <GlobalList
      items={drivers}
      primaryColumn={{
        key: 'fullName',
        render: (item: Driver) => item.fullName || item.name || '',
      }}
      secondaryColumns={[
        {
          key: 'email',
          render: (item: Driver) => item.email || '',
        },
      ]}
      badges={(driver) => [
        {
          label: driver.status === 'active' ? 'Ativo' : 'Inativo',
          colorScheme: getStatusColor(driver.status),
        },
        {
          label: driver.type === 'affiliate' ? 'Afiliado' : 'Locatário',
          colorScheme: driver.type === 'affiliate' ? 'blue' : 'green',
        },
      ]}
      actions={(driver) => (
        <>
          <Tooltip label={t('drivers.list.actions.sendAccess', 'Enviar acesso')}>
            <IconButton
              aria-label={t('drivers.list.actions.sendAccess', 'Enviar acesso')}
              icon={<Icon as={FiSend} />}
              size="sm"
              colorScheme="green"
              variant="outline"
              isLoading={sendingAccessId === driver.id}
              onClick={() => handleSendAccess(driver)}
            />
          </Tooltip>

          {driver.status === 'active' ? (
            <Tooltip label={t('drivers.list.actions.deactivate', 'Desativar motorista')}>
              <IconButton
                aria-label={t('drivers.list.actions.deactivate', 'Desativar motorista')}
                icon={<Icon as={FiXCircle} />}
                size="sm"
                variant="outline"
                colorScheme="red"
                isLoading={changingStatusId === driver.id}
                onClick={() => updateDriverStatus(driver, 'inactive')}
              />
            </Tooltip>
          ) : (
            <Tooltip label={t('drivers.list.actions.activate', 'Ativar motorista')}>
              <IconButton
                aria-label={t('drivers.list.actions.activate', 'Ativar motorista')}
                icon={<Icon as={FiCheckCircle} />}
                size="sm"
                variant="outline"
                colorScheme="green"
                isLoading={changingStatusId === driver.id}
                onClick={() => updateDriverStatus(driver, 'active')}
              />
            </Tooltip>
          )}

          <Tooltip label={t('drivers.list.actions.edit', 'Editar motorista')}>
            <IconButton
              aria-label={t('drivers.list.actions.edit', 'Editar motorista')}
              icon={<Icon as={FiEdit} />}
              size="sm"
              onClick={() => handleEdit(driver)}
            />
          </Tooltip>
        </>
      )}
      resultLabel={t('drivers.list.results', 'motoristas')}
    />
  );
}

