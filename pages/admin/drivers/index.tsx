import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Select,
  Input,
  Icon,
  IconButton,
  Tooltip,
  useToast,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  FiEdit,
  FiRefreshCw,
  FiSearch,
  FiPlus,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getDrivers } from '@/lib/admin/adminQueries';
import DriverModal from '@/components/admin/DriverModal';

interface Driver {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  type?: string;
  rentalFee?: number;
  birthDate?: string;
  city?: string;
  integrations?: {
    uber?: {
      key?: string | null;
      enabled?: boolean;
    };
    bolt?: {
      key?: string | null;
      enabled?: boolean;
    };
    myprio?: {
      key?: string | null;
      enabled?: boolean;
    };
    viaverde?: {
      key?: string | null;
      enabled?: boolean;
    };
  };
  banking?: {
    iban?: string | null;
    accountHolder?: string | null;
  };
  vehicle?: {
    plate?: string;
    make?: string;
    model?: string;
    year?: number;
  };
}

interface DriversPageProps extends AdminPageProps {
  initialDrivers: Driver[];
}

export default function DriversPage({
  user,
  locale,
  initialDrivers,
  tCommon,
  tPage,
  translations,
}: DriversPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  
  // Detectar se é mobile para ajustar abas
  const isMobile = useBreakpointValue({ base: true, md: false });

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/drivers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
      }
    } catch (error) {
      toast({
        title: t('drivers.list.toasts.loadError', 'Erro ao carregar motoristas'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDrivers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [filterStatus, filterType, searchQuery]);

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedDriver(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
    setIsEditMode(false);
  };

  const handleSaveDriver = async (driverData: any) => {
    try {
      if (isEditMode && selectedDriver?.id) {
        // Modo edição
        const response = await fetch(`/api/admin/drivers/${selectedDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar motorista');
        }

        toast({
          title: t('drivers.list.toasts.updateSuccess', 'Motorista atualizado'),
          status: 'success',
          duration: 2000,
        });
      } else {
        // Modo criação
        const response = await fetch('/api/admin/drivers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverData),
        });

        if (!response.ok) {
        const error = await response.json();
          throw new Error(error.error || 'Erro ao criar motorista');
        }

        const result = await response.json();
        
        toast({
          title: t('drivers.add.toasts.success.title', 'Motorista criado com sucesso!'),
          description: t('drivers.add.toasts.success.description', 'Uma senha temporária foi gerada para o motorista.'),
          status: 'success',
          duration: 5000,
        });

        return result; // Retorna para mostrar senha temporária
      }

      fetchDrivers(); // Re-fetch drivers to update the list
    } catch (error: any) {
      throw new Error(error.message);
    }
  };


  const getStatusBadge = (status?: string) => {
    const colorMap: Record<string, string> = {
      active: 'green',
      pending: 'yellow',
      inactive: 'gray',
      suspended: 'red',
    };
    const labelMap: Record<string, string> = {
      active: tc('status.active', 'Ativo'),
      pending: tc('status.pending', 'Pendente'),
      inactive: tc('status.inactive', 'Inativo'),
      suspended: tc('status.suspended', 'Suspenso'),
    };

    const currentStatus = status || 'pending';

    return (
      <Badge colorScheme={colorMap[currentStatus] || 'gray'}>
        {labelMap[currentStatus] || currentStatus || 'N/A'}
      </Badge>
    );
  };

  const getTypeBadge = (type?: string) => (
    <Badge colorScheme={type === 'renter' ? 'purple' : 'green'}>
      {type === 'renter'
        ? t('drivers.type.renter', 'Locatário')
        : t('drivers.type.affiliate', 'Afiliado')}
    </Badge>
  );

  const filteredDrivers = drivers; // Data is already filtered by fetchDrivers

  return (
    <AdminLayout
      title={t('drivers.title', 'Controle de Motoristas')}
      subtitle={t('drivers.subtitle', 'Gestão completa dos motoristas ativos')}
      breadcrumbs={[
        { label: t('drivers.title', 'Controle de Motoristas') }
      ]}
      translations={translations}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="red"
          size={'sm'}
          onClick={handleAddNew}
        >
          {t('drivers.addDriver', 'Adicionar Motorista')}
        </Button>
      }
    >


      <Card>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <Box flex={1} minW="250px">
              <HStack>
                <Icon as={FiSearch} color="gray.400" />
                <Input
                  size={'sm'}
                  placeholder={t('drivers.list.filters.searchPlaceholder', 'Pesquisar motoristas...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </HStack>
            </Box>

            <Box minW="150px">
              <Select size={'sm'} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">{t('drivers.list.filters.status.all', 'Todos os status')}</option>
                <option value="active">{tc('status.active', 'Ativo')}</option>
                <option value="pending">{tc('status.pending', 'Pendente')}</option>
                <option value="inactive">{tc('status.inactive', 'Inativo')}</option>
                <option value="suspended">{tc('status.suspended', 'Suspenso')}</option>
              </Select>
            </Box>

            <Box minW="150px">
              <Select size={'sm'} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">{t('drivers.list.filters.type.all', 'Todos os tipos')}</option>
                <option value="affiliate">{t('drivers.type.affiliate', 'Afiliado')}</option>
                <option value="renter">{t('drivers.type.renter', 'Locatário')}</option>
              </Select>
            </Box>

            <Button
              size={'sm'}
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={fetchDrivers}
              isLoading={isLoading}
            >
              {t('drivers.list.actions.refresh', 'Atualizar')}
            </Button>
          </HStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>{t('drivers.table.name', 'Nome')}</Th>
                  <Th>{t('drivers.table.email', 'Email')}</Th>
                  <Th>{t('drivers.table.status', 'Status')}</Th>
                  <Th>{t('drivers.table.type', 'Tipo')}</Th>
                  <Th>Uber</Th>
                  <Th>Bolt</Th>
                  <Th>MyPrio</Th>
                  <Th>ViaVerde</Th>
                  <Th>IBAN</Th>
                  <Th>{t('drivers.table.actions', 'Ações')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDrivers?.length === 0 ? (
                  <Tr>
                    <Td colSpan={10} textAlign="center" py={8}>
                      <Text color="gray.500">
                        {isLoading
                          ? tc('messages.loading', 'A carregar...')
                          : t('drivers.list.empty', 'Nenhum motorista encontrado')}
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredDrivers?.map((driver) => (
                    <Tr key={driver.id}>
                      <Td>
                        <Text fontWeight="medium">{driver.fullName || driver.name || 'N/A'}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{driver.email || 'N/A'}</Text>
                      </Td>
                      <Td>{getStatusBadge(driver.status)}</Td>
                      <Td>{getTypeBadge(driver.type)}</Td>
                      <Td>
                        <VStack spacing={1} align="start">
                          <Text fontSize="xs" fontFamily="mono" color={driver.integrations?.uber?.enabled ? 'green.600' : 'gray.400'}>
                            {driver.integrations?.uber?.key ?
                              `${driver.integrations.uber.key.slice(0, 8)}...` :
                              'N/A'}
                          </Text>
                          {driver.integrations?.uber?.enabled && (
                            <Badge size="xs" colorScheme="green">{tc('status.active', 'Ativo')}</Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack spacing={1} align="start">
                          <Text fontSize="xs" fontFamily="mono" color={driver.integrations?.bolt?.enabled ? 'green.600' : 'gray.400'}>
                            {driver.integrations?.bolt?.key || 'N/A'}
                          </Text>
                          {driver.integrations?.bolt?.enabled && (
                            <Badge size="xs" colorScheme="green">{tc('status.active', 'Ativo')}</Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack spacing={1} align="start">
                          <Text fontSize="xs" fontFamily="mono" color={driver.integrations?.myprio?.enabled ? 'green.600' : 'gray.400'}>
                            {driver.integrations?.myprio?.key ?
                              `...${driver.integrations.myprio.key.slice(-4)}` :
                              'N/A'}
                          </Text>
                          {driver.integrations?.myprio?.enabled && (
                            <Badge size="xs" colorScheme="green">{tc('status.active', 'Ativo')}</Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack spacing={1} align="start">
                          <Text fontSize="xs" fontFamily="mono" color={driver.integrations?.viaverde?.enabled ? 'green.600' : 'gray.400'}>
                            {driver.integrations?.viaverde?.key || 'N/A'}
                          </Text>
                          {driver.integrations?.viaverde?.enabled && (
                            <Badge size="xs" colorScheme="green">{tc('status.active', 'Ativo')}</Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="xs" fontFamily="mono">
                          {driver.banking?.iban ?
                            `${driver.banking.iban.slice(0, 8)}...${driver.banking.iban.slice(-4)}` :
                            'N/A'}
                        </Text>
                      </Td>
                      <Td>
                        <Tooltip label={tc('actions.edit', 'Editar')}>
                          <IconButton
                            aria-label={t('drivers.editDriver', 'Editar Motorista')}
                            icon={<Icon as={FiEdit} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(driver)}
                          />
                        </Tooltip>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      <DriverModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        driver={selectedDriver}
        onSave={handleSaveDriver}
        tCommon={tCommon}
        tPage={tPage}
      />
    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Carregar motoristas diretamente do Firestore
  const drivers = await getDrivers();

  return {
    initialDrivers: drivers,
  };
});

