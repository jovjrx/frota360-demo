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
  FormControl,
  FormLabel,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiEdit,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiCreditCard,
  FiTruck,
  FiDollarSign,
  FiPlus,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getDrivers } from '@/lib/admin/adminQueries';
import StructuredModal from '@/components/admin/StructuredModal';

interface Driver {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  type?: string;
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
}: DriversPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

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
    setEditingDriver(driver);
    onOpen();
  };

  const handleSave = async () => {
    if (!editingDriver) return;

    try {
      const response = await fetch(`/api/admin/drivers/${editingDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDriver),
      });

      if (response.ok) {
        toast({
          title: t('drivers.list.toasts.updateSuccess', 'Motorista atualizado'),
          status: 'success',
          duration: 2000,
        });
        onClose();
        fetchDrivers(); // Re-fetch drivers to update the list
      } else {
        const error = await response.json();
        toast({
          title: t('drivers.list.toasts.updateError', 'Erro ao atualizar motorista'),
          description: error.error || t('drivers.list.toasts.updateErrorDescription', 'Não foi possível atualizar os dados do motorista.'),
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: t('drivers.list.toasts.updateError', 'Erro ao atualizar motorista'),
        status: 'error',
        duration: 3000,
      });
    }
  };

  const updateField = (path: string, value: any) => {
    if (!editingDriver) return;

    const pathParts = path.split('.');
    const updated = JSON.parse(JSON.stringify(editingDriver));
    
    let current: any = updated;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const key = pathParts[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    setEditingDriver(updated);
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
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="red"
          onClick={() => router.push('/admin/drivers/add')}
        >
          {t('drivers.addDriver', 'Adicionar Motorista')}
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        {/* Filtros */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <Box flex={1} minW="250px">
                <HStack>
                  <Icon as={FiSearch} color="gray.400" />
                  <Input
                    placeholder={t('drivers.list.filters.searchPlaceholder', 'Pesquisar motoristas...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </HStack>
              </Box>

              <Box minW="150px">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">{t('drivers.list.filters.status.all', 'Todos os status')}</option>
                  <option value="active">{tc('status.active', 'Ativo')}</option>
                  <option value="pending">{tc('status.pending', 'Pendente')}</option>
                  <option value="inactive">{tc('status.inactive', 'Inativo')}</option>
                  <option value="suspended">{tc('status.suspended', 'Suspenso')}</option>
                </Select>
              </Box>

              <Box minW="150px">
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">{t('drivers.list.filters.type.all', 'Todos os tipos')}</option>
                  <option value="affiliate">{t('drivers.type.affiliate', 'Afiliado')}</option>
                  <option value="renter">{t('drivers.type.renter', 'Locatário')}</option>
                </Select>
              </Box>

              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={fetchDrivers}
                isLoading={isLoading}
              >
                {t('drivers.list.actions.refresh', 'Atualizar')}
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Tabela de Motoristas */}
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
      </VStack>

      {/* Modal de Edição */}
      <StructuredModal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        title={t('drivers.editDriver', 'Editar Motorista')}
        footer={(
          <HStack spacing={3} justify="flex-end" w="full">
            <Button variant="ghost" onClick={onClose}>
              {tc('actions.cancel', 'Cancelar')}
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              {tc('actions.save', 'Guardar')}
            </Button>
          </HStack>
        )}
      >
        {editingDriver && (
          <Tabs>
            <TabList>
              <Tab>
                <Icon as={FiUser} mr={2} />
                {t('drivers.tabs.basic', 'Dados básicos')}
              </Tab>
              <Tab>
                <Icon as={FiCreditCard} mr={2} />
                {t('drivers.tabs.integrations', 'Integrações')}
              </Tab>
              <Tab>
                <Icon as={FiTruck} mr={2} />
                {t('drivers.tabs.vehicle', 'Veículo')}
              </Tab>
              <Tab>
                <Icon as={FiDollarSign} mr={2} />
                {t('drivers.tabs.banking', 'Dados bancários')}
              </Tab>
            </TabList>

            <TabPanels>
              {/* Tab Básico */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('drivers.form.status.label', 'Status')}</FormLabel>
                    <Select
                      value={editingDriver.status || 'pending'}
                      onChange={(e) => updateField('status', e.target.value)}
                    >
                      <option value="pending">{tc('status.pending', 'Pendente')}</option>
                      <option value="active">{tc('status.active', 'Ativo')}</option>
                      <option value="inactive">{tc('status.inactive', 'Inativo')}</option>
                      <option value="suspended">{tc('status.suspended', 'Suspenso')}</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.form.type.label', 'Tipo')}</FormLabel>
                    <Select
                      value={editingDriver.type || 'affiliate'}
                      onChange={(e) => updateField('type', e.target.value)}
                    >
                      <option value="affiliate">{t('drivers.type.affiliate', 'Afiliado')}</option>
                      <option value="renter">{t('drivers.type.renter', 'Locatário')}</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.form.fullName.label', 'Nome completo')}</FormLabel>
                    <Input
                      value={editingDriver.fullName || editingDriver.name || ''}
                      onChange={(e) => updateField('fullName', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.form.email.label', 'Email')}</FormLabel>
                    <Input
                      type="email"
                      value={editingDriver.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.form.phone.label', 'Telefone')}</FormLabel>
                    <Input
                      value={editingDriver.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </TabPanel>

              {/* Tab Integrações */}
              <TabPanel>
                <VStack spacing={4}>
                  {/* Uber */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.uber.title', 'Uber')}</Heading>
                      <Switch
                        isChecked={editingDriver.integrations?.uber?.enabled || false}
                        onChange={(e) => updateField('integrations.uber.enabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.uber.keyLabel', 'UUID do motorista')}</FormLabel>
                      <Input
                        placeholder={t('drivers.integrations.uber.placeholder', 'Ex: 12345678-1234-1234-1234-123456789012')}
                        value={editingDriver.integrations?.uber?.key || ''}
                        onChange={(e) => updateField('integrations.uber.key', e.target.value)}
                        isDisabled={!editingDriver.integrations?.uber?.enabled}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.uber.description', 'Identificador do motorista utilizado nas exportações da Uber.')}
                      </Text>
                    </FormControl>
                  </Box>

                  {/* Bolt */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.bolt.title', 'Bolt')}</Heading>
                      <Switch
                        isChecked={editingDriver.integrations?.bolt?.enabled || false}
                        onChange={(e) => updateField('integrations.bolt.enabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.bolt.keyLabel', 'Email associado')}</FormLabel>
                      <Input
                        type="email"
                        placeholder={t('drivers.integrations.bolt.placeholder', 'email@exemplo.com')}
                        value={editingDriver.integrations?.bolt?.key || ''}
                        onChange={(e) => updateField('integrations.bolt.key', e.target.value)}
                        isDisabled={!editingDriver.integrations?.bolt?.enabled}
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.bolt.description', 'Email utilizado para autenticar a integração com a Bolt.')}
                      </Text>
                    </FormControl>
                  </Box>

                  {/* MyPrio */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.myprio.title', 'MyPrio')}</Heading>
                      <Switch
                        isChecked={editingDriver.integrations?.myprio?.enabled || false}
                        onChange={(e) => updateField('integrations.myprio.enabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.myprio.keyLabel', 'Número do cartão')}</FormLabel>
                      <Input
                        placeholder={t('drivers.integrations.myprio.placeholder', 'Ex: 1234567890123456')}
                        value={editingDriver.integrations?.myprio?.key || ''}
                        onChange={(e) => updateField('integrations.myprio.key', e.target.value)}
                        isDisabled={!editingDriver.integrations?.myprio?.enabled}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.myprio.description', 'Número do cartão para abastecimentos PRIO.')}
                      </Text>
                    </FormControl>
                  </Box>

                  {/* ViaVerde */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.viaverde.title', 'ViaVerde')}</Heading>
                      <Switch
                        isChecked={editingDriver.integrations?.viaverde?.enabled || false}
                        onChange={(e) => updateField('integrations.viaverde.enabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.viaverde.keyLabel', 'Matrícula vinculada')}</FormLabel>
                      <Input
                        placeholder={t('drivers.integrations.viaverde.placeholder', 'Ex: AB-12-CD')}
                        value={editingDriver.integrations?.viaverde?.key || editingDriver.vehicle?.plate || ''}
                        onChange={(e) => updateField('integrations.viaverde.key', e.target.value)}
                        isDisabled={!editingDriver.integrations?.viaverde?.enabled}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.viaverde.description', 'Matrícula utilizada para associar transações de portagens.')}
                      </Text>
                    </FormControl>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Tab Veículo */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('drivers.vehicle.plate.label', 'Matrícula')}</FormLabel>
                    <Input
                      placeholder={t('drivers.vehicle.plate.placeholder', 'Ex: AB-12-CD')}
                      value={editingDriver.vehicle?.plate || ''}
                      onChange={(e) => updateField('vehicle.plate', e.target.value)}
                      fontFamily="mono"
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {t('drivers.vehicle.plate.description', 'Utilizado para associações com ViaVerde e controle de frota.')}
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.vehicle.make.label', 'Marca')}</FormLabel>
                    <Input
                      placeholder={t('drivers.vehicle.make.placeholder', 'Ex: Toyota')}
                      value={editingDriver.vehicle?.make || ''}
                      onChange={(e) => updateField('vehicle.make', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.vehicle.model.label', 'Modelo')}</FormLabel>
                    <Input
                      placeholder={t('drivers.vehicle.model.placeholder', 'Ex: Prius')}
                      value={editingDriver.vehicle?.model || ''}
                      onChange={(e) => updateField('vehicle.model', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.vehicle.year.label', 'Ano')}</FormLabel>
                    <Input
                      type="number"
                      placeholder={t('drivers.vehicle.year.placeholder', 'Ex: 2020')}
                      value={editingDriver.vehicle?.year || ''}
                      onChange={(e) => updateField('vehicle.year', parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                </VStack>
              </TabPanel>

              {/* Tab Bancário */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('drivers.bank.iban.label', 'IBAN')}</FormLabel>
                    <Input
                      placeholder={t('drivers.bank.iban.placeholder', 'PT50 0000 0000 0000 0000 0000 0')}
                      value={editingDriver.banking?.iban || ''}
                      onChange={(e) => updateField('banking.iban', e.target.value)}
                      fontFamily="mono"
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {t('drivers.bank.iban.description', 'Utilizado para pagamentos e repasses semanais.')}
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.bank.accountHolder.label', 'Titular da conta')}</FormLabel>
                    <Input
                      placeholder={t('drivers.bank.accountHolder.placeholder', 'Nome completo do titular')}
                      value={editingDriver.banking?.accountHolder || ''}
                      onChange={(e) => updateField('banking.accountHolder', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </StructuredModal>
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

