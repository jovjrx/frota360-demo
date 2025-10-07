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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
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
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getTranslation } from '@/lib/translations';

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

export default function DriversPage({ user, translations, locale, initialDrivers }: DriversPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

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
        title: t('error_loading_drivers'),
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
          title: t('driver_updated'),
          status: 'success',
          duration: 2000,
        });
        onClose();
        fetchDrivers(); // Re-fetch drivers to update the list
      } else {
        const error = await response.json();
        toast({
          title: t('error_updating_driver'),
          description: error.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: t('error_updating_driver'),
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
      active: t('status_active'),
      pending: t('status_pending'),
      inactive: t('status_inactive'),
      suspended: t('status_suspended'),
    };
    return (
      <Badge colorScheme={colorMap[status || 'pending'] || 'gray'}>
        {labelMap[status || 'pending'] || status || 'N/A'}
      </Badge>
    );
  };

  const getTypeBadge = (type?: string) => {
    return (
      <Badge colorScheme={type === 'renter' ? 'purple' : 'green'}>
        {type === 'renter' ? t('type_renter') : t('type_affiliate')}
      </Badge>
    );
  };

  const filteredDrivers = drivers; // Data is already filtered by fetchDrivers

  return (
    <AdminLayout
      title={tAdmin('drivers_management_title')}
      subtitle={tAdmin('drivers_management_subtitle')}
      breadcrumbs={[
        { label: tAdmin('drivers_management_title') }
      ]}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="red"
          onClick={() => router.push('/admin/drivers/add')}
        >
          {tAdmin('add_driver')}
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
                    placeholder={t('search_drivers_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </HStack>
              </Box>

              <Box minW="150px">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">{t('all_statuses')}</option>
                  <option value="active">{t('status_active')}</option>
                  <option value="pending">{t('status_pending')}</option>
                  <option value="inactive">{t('status_inactive')}</option>
                  <option value="suspended">{t('status_suspended')}</option>
                </Select>
              </Box>

              <Box minW="150px">
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">{t('all_types')}</option>
                  <option value="affiliate">{t('type_affiliate')}</option>
                  <option value="renter">{t('type_renter')}</option>
                </Select>
              </Box>

              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={fetchDrivers}
                isLoading={isLoading}
              >
                {t('refresh')}
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
                    <Th>{t('name')}</Th>
                    <Th>{t('email')}</Th>
                    <Th>{t('status')}</Th>
                    <Th>{t('type')}</Th>
                    <Th>Uber</Th>
                    <Th>Bolt</Th>
                    <Th>MyPrio</Th>
                    <Th>ViaVerde</Th>
                    <Th>IBAN</Th>
                    <Th>{t('actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredDrivers?.length === 0 ? (
                    <Tr>
                      <Td colSpan={10} textAlign="center" py={8}>
                        <Text color="gray.500">
                          {isLoading ? t('loading') : t('no_drivers_found')}
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
                              <Badge size="xs" colorScheme="green">{t('active')}</Badge>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack spacing={1} align="start">
                            <Text fontSize="xs" fontFamily="mono" color={driver.integrations?.bolt?.enabled ? 'green.600' : 'gray.400'}>
                              {driver.integrations?.bolt?.key || 'N/A'}
                            </Text>
                            {driver.integrations?.bolt?.enabled && (
                              <Badge size="xs" colorScheme="green">{t('active')}</Badge>
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
                              <Badge size="xs" colorScheme="green">{t('active')}</Badge>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack spacing={1} align="start">
                            <Text fontSize="xs" fontFamily="mono" color={driver.integrations?.viaverde?.enabled ? 'green.600' : 'gray.400'}>
                              {driver.integrations?.viaverde?.key || 'N/A'}
                            </Text>
                            {driver.integrations?.viaverde?.enabled && (
                              <Badge size="xs" colorScheme="green">{t('active')}</Badge>
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
                          <Tooltip label={t('edit')}>
                            <IconButton
                              aria-label={t('edit_driver')}
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
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>{tAdmin('edit_driver')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingDriver && (
              <Tabs>
                <TabList>
                  <Tab>
                    <Icon as={FiUser} mr={2} />
                    {t('basic')}
                  </Tab>
                  <Tab>
                    <Icon as={FiCreditCard} mr={2} />
                    {t('integrations')}
                  </Tab>
                  <Tab>
                    <Icon as={FiTruck} mr={2} />
                    {t('vehicle')}
                  </Tab>
                  <Tab>
                    <Icon as={FiDollarSign} mr={2} />
                    {t('banking')}
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Tab Básico */}
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>{t('status')}</FormLabel>
                        <Select
                          value={editingDriver.status || 'pending'}
                          onChange={(e) => updateField('status', e.target.value)}
                        >
                          <option value="pending">{t('status_pending')}</option>
                          <option value="active">{t('status_active')}</option>
                          <option value="inactive">{t('status_inactive')}</option>
                          <option value="suspended">{t('status_suspended')}</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('type')}</FormLabel>
                        <Select
                          value={editingDriver.type || 'affiliate'}
                          onChange={(e) => updateField('type', e.target.value)}
                        >
                          <option value="affiliate">{t('type_affiliate')}</option>
                          <option value="renter">{t('type_renter')}</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('full_name')}</FormLabel>
                        <Input
                          value={editingDriver.fullName || editingDriver.name || ''}
                          onChange={(e) => updateField('fullName', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('email')}</FormLabel>
                        <Input
                          type="email"
                          value={editingDriver.email || ''}
                          onChange={(e) => updateField('email', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('phone')}</FormLabel>
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
                          <Heading size="sm">Uber</Heading>
                          <Switch
                            isChecked={editingDriver.integrations?.uber?.enabled || false}
                            onChange={(e) => updateField('integrations.uber.enabled', e.target.checked)}
                            colorScheme="green"
                          />
                        </HStack>
                        <FormControl>
                          <FormLabel fontSize="sm">{t('driver_uuid')}</FormLabel>
                          <Input
                            placeholder="Ex: 12345678-1234-1234-1234-123456789012"
                            value={editingDriver.integrations?.uber?.key || ''}
                            onChange={(e) => updateField('integrations.uber.key', e.target.value)}
                            isDisabled={!editingDriver.integrations?.uber?.enabled}
                            fontFamily="mono"
                            fontSize="sm"
                          />
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            {t('uber_uuid_description')}
                          </Text>
                        </FormControl>
                      </Box>

                      {/* Bolt */}
                      <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                        <HStack justify="space-between" mb={3}>
                          <Heading size="sm">Bolt</Heading>
                          <Switch
                            isChecked={editingDriver.integrations?.bolt?.enabled || false}
                            onChange={(e) => updateField('integrations.bolt.enabled', e.target.checked)}
                            colorScheme="green"
                          />
                        </HStack>
                        <FormControl>
                          <FormLabel fontSize="sm">{t('driver_email')}</FormLabel>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={editingDriver.integrations?.bolt?.key || ''}
                            onChange={(e) => updateField('integrations.bolt.key', e.target.value)}
                            isDisabled={!editingDriver.integrations?.bolt?.enabled}
                            fontSize="sm"
                          />
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            {t('bolt_email_description')}
                          </Text>
                        </FormControl>
                      </Box>

                      {/* MyPrio */}
                      <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                        <HStack justify="space-between" mb={3}>
                          <Heading size="sm">MyPrio</Heading>
                          <Switch
                            isChecked={editingDriver.integrations?.myprio?.enabled || false}
                            onChange={(e) => updateField('integrations.myprio.enabled', e.target.checked)}
                            colorScheme="green"
                          />
                        </HStack>
                        <FormControl>
                          <FormLabel fontSize="sm">{t('card_number')}</FormLabel>
                          <Input
                            placeholder="Ex: 1234567890123456"
                            value={editingDriver.integrations?.myprio?.key || ''}
                            onChange={(e) => updateField('integrations.myprio.key', e.target.value)}
                            isDisabled={!editingDriver.integrations?.myprio?.enabled}
                            fontFamily="mono"
                            fontSize="sm"
                          />
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            {t('myprio_card_description')}
                          </Text>
                        </FormControl>
                      </Box>

                      {/* ViaVerde */}
                      <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                        <HStack justify="space-between" mb={3}>
                          <Heading size="sm">ViaVerde</Heading>
                          <Switch
                            isChecked={editingDriver.integrations?.viaverde?.enabled || false}
                            onChange={(e) => updateField('integrations.viaverde.enabled', e.target.checked)}
                            colorScheme="green"
                          />
                        </HStack>
                        <FormControl>
                          <FormLabel fontSize="sm">{t('vehicle_plate')}</FormLabel>
                          <Input
                            placeholder="Ex: AB-12-CD"
                            value={editingDriver.integrations?.viaverde?.key || editingDriver.vehicle?.plate || ''}
                            onChange={(e) => updateField('integrations.viaverde.key', e.target.value)}
                            isDisabled={!editingDriver.integrations?.viaverde?.enabled}
                            fontFamily="mono"
                            fontSize="sm"
                          />
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            {t('viaverde_plate_description')}
                          </Text>
                        </FormControl>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Tab Veículo */}
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>{t('vehicle_plate')}</FormLabel>
                        <Input
                          placeholder="Ex: AB-12-CD"
                          value={editingDriver.vehicle?.plate || ''}
                          onChange={(e) => updateField('vehicle.plate', e.target.value)}
                          fontFamily="mono"
                        />
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          {t('vehicle_plate_description')}
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('vehicle_make')}</FormLabel>
                        <Input
                          placeholder="Ex: Toyota"
                          value={editingDriver.vehicle?.make || ''}
                          onChange={(e) => updateField('vehicle.make', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('vehicle_model')}</FormLabel>
                        <Input
                          placeholder="Ex: Prius"
                          value={editingDriver.vehicle?.model || ''}
                          onChange={(e) => updateField('vehicle.model', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('vehicle_year')}</FormLabel>
                        <Input
                          type="number"
                          placeholder="Ex: 2020"
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
                        <FormLabel>IBAN</FormLabel>
                        <Input
                          placeholder="PT50 0000 0000 0000 0000 0000 0"
                          value={editingDriver.banking?.iban || ''}
                          onChange={(e) => updateField('banking.iban', e.target.value)}
                          fontFamily="mono"
                        />
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          {t('iban_description')}
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel>{t('account_holder')}</FormLabel>
                        <Input
                          placeholder={t('account_holder_placeholder')}
                          value={editingDriver.banking?.accountHolder || ''}
                          onChange={(e) => updateField('banking.accountHolder', e.target.value)}
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              {t('save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR<DriversPageProps>(async (context, user) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cookieHeader = context.req.headers.cookie || '';

  try {
    const response = await fetch(`${baseUrl}/api/admin/drivers`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch drivers');
    }

    return {
      props: {
        initialDrivers: data.drivers || [],
      },
    };
  } catch (error) {
    console.error('Error fetching drivers for SSR:', error);
    return {
      props: {
        initialDrivers: [],
      },
    };
  }
});

