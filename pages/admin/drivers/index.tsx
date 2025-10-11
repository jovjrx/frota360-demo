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
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiEdit,
  FiRefreshCw,
  FiSearch,
  FiPlus,
  FiUsers,
  FiUserCheck,
  FiClock,
  FiUserPlus,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiPhone,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getDrivers, getRequests, getRequestsStats } from '@/lib/admin/adminQueries';
import DriverModal from '@/components/admin/DriverModal';
import useSWR, { SWRConfig } from 'swr';
import StructuredModal from '@/components/admin/StructuredModal';

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

interface DriverRequest {
  id: string;
  fullName: string;
  birthDate?: string;
  email: string;
  phone: string;
  city?: string;
  nif?: string;
  licenseNumber?: string;
  type: 'affiliate' | 'renter';
  vehicle?: {
    make: string;
    model: string;
    year: number;
    plate: string;
  };
  status: 'pending' | 'evaluation' | 'approved' | 'rejected';
  createdAt: string;
  notes?: string;
  rejectionReason?: string;
}

interface DriversPageProps extends AdminPageProps {
  initialDrivers: Driver[];
  initialRequests: DriverRequest[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function DriversPageContent({
  user,
  locale,
  initialDrivers,
  initialRequests,
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
  
  // Solicitações pendentes
  const { data: requestsData, mutate: mutateRequests } = useSWR<{ requests: DriverRequest[] }>(
    '/api/admin/requests?status=pending',
    fetcher
  );
  const pendingRequests = requestsData?.requests || [];
  
  // Modais de aprovação/rejeição
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(null);
  const { isOpen: isApproveModalOpen, onOpen: onApproveModalOpen, onClose: onApproveModalClose } = useDisclosure();
  const { isOpen: isRejectModalOpen, onOpen: onRejectModalOpen, onClose: onRejectModalClose } = useDisclosure();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  
  // Detectar se é mobile para ajustar abas
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter(d => d.status === 'active').length;
    const pending = drivers.filter(d => d.status === 'pending').length;
    const affiliates = drivers.filter(d => d.type === 'affiliate').length;
    const renters = drivers.filter(d => d.type === 'renter').length;
    const pendingRequestsCount = pendingRequests.length;

    return { total, active, pending, affiliates, renters, pendingRequestsCount };
  }, [drivers, pendingRequests]);

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
    // Só fazer fetch se houver filtros ativos ou busca
    // Caso contrário, usar os dados do SSR
    if (filterStatus !== 'all' || filterType !== 'all' || searchQuery) {
    const delayDebounceFn = setTimeout(() => {
      fetchDrivers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    }
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

  // Funções para solicitações
  const handleApproveRequest = (request: DriverRequest) => {
    setSelectedRequest(request);
    onApproveModalOpen();
  };

  const handleRejectRequest = (request: DriverRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    onRejectModalOpen();
  };

  const handleMarkContact = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/requests/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'evaluation' }),
      });

      if (response.ok) {
        toast({
          title: t('requests.contact.success', 'Status atualizado'),
          description: t('requests.contact.description', 'Solicitação marcada como "em avaliação"'),
          status: 'success',
          duration: 2000,
        });
        mutateRequests();
      }
    } catch (error) {
      toast({
        title: t('requests.contact.error', 'Erro ao atualizar'),
        status: 'error',
        duration: 3000,
      });
    }
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    
    setIsApproving(true);
    try {
      const response = await fetch('/api/admin/requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: selectedRequest.id }),
      });

      if (response.ok) {
        toast({
          title: t('requests.approve.success', 'Solicitação aprovada!'),
          description: t('requests.approve.description', 'Motorista criado com sucesso'),
          status: 'success',
          duration: 3000,
        });
        onApproveModalClose();
        mutateRequests();
        fetchDrivers(); // Atualizar lista de motoristas
      } else {
        throw new Error('Erro ao aprovar');
      }
    } catch (error) {
      toast({
        title: t('requests.approve.error', 'Erro ao aprovar'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason) {
      toast({
        title: t('requests.reject.reasonRequired', 'Motivo é obrigatório'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setIsApproving(true);
    try {
      const response = await fetch('/api/admin/requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: selectedRequest.id,
          rejectionReason,
        }),
      });

      if (response.ok) {
        toast({
          title: t('requests.reject.success', 'Solicitação rejeitada'),
          status: 'success',
          duration: 2000,
        });
        onRejectModalClose();
        mutateRequests();
      } else {
        throw new Error('Erro ao rejeitar');
      }
    } catch (error) {
      toast({
        title: t('requests.reject.error', 'Erro ao rejeitar'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsApproving(false);
    }
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
      <VStack spacing={6} align="stretch">
        {/* Estatísticas */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiUsers} mr={2} />
                    {t('drivers.stats.total', 'Total')}
                  </StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                  <StatHelpText>{t('drivers.stats.totalDesc', 'Motoristas')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiUserCheck} mr={2} />
                    {t('drivers.stats.active', 'Ativos')}
                  </StatLabel>
                  <StatNumber color="green.500">{stats.active}</StatNumber>
                  <StatHelpText>{t('drivers.stats.activeDesc', 'Trabalhando')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiClock} mr={2} />
                    {t('drivers.stats.pending', 'Pendentes')}
                  </StatLabel>
                  <StatNumber color="orange.500">{stats.pending}</StatNumber>
                  <StatHelpText>{t('drivers.stats.pendingDesc', 'Aguardando')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel display="flex" alignItems="center">
                    <Icon as={FiUserPlus} mr={2} />
                    {t('drivers.stats.affiliates', 'Afiliados')}
                  </StatLabel>
                  <StatNumber color="blue.500">{stats.affiliates}</StatNumber>
                  <StatHelpText>{stats.renters} {t('drivers.stats.renters', 'Locatários')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        <Divider />

        {/* Solicitações Pendentes */}
        {pendingRequests.length > 0 && (
          <Card borderLeft="4px" borderLeftColor="orange.400">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" display="flex" alignItems="center">
                  <Icon as={FiAlertCircle} mr={2} color="orange.500" />
                  {t('drivers.requests.title', 'Solicitações Pendentes')}
                  <Badge ml={2} colorScheme="orange">{pendingRequests.length}</Badge>
                </Heading>
                
                <Text color="gray.600" fontSize="sm">
                  {t('drivers.requests.description', 'Candidaturas que aguardam aprovação para se tornarem motoristas.')}
                </Text>

                <VStack spacing={3} align="stretch">
                  {pendingRequests.map((req) => (
                    <Box
                      key={req.id}
                      p={4}
                      bg="orange.50"
                      borderRadius="md"
                      borderWidth={1}
                      borderColor="orange.200"
                    >
                      <HStack justify="space-between" wrap="wrap" spacing={4}>
                        <VStack align="start" spacing={1} flex="1">
                          <Text fontWeight="bold">{req.fullName}</Text>
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme={req.type === 'affiliate' ? 'blue' : 'purple'}>
                              {req.type === 'affiliate' ? t('drivers.type.affiliate', 'Afiliado') : t('drivers.type.renter', 'Locatário')}
                            </Badge>
                            <Text fontSize="sm" color="gray.600">{req.email}</Text>
                            <Text fontSize="sm" color="gray.600">{req.phone}</Text>
                            {req.city && <Text fontSize="sm" color="gray.600">📍 {req.city}</Text>}
                          </HStack>
                          {req.vehicle && (
                            <Text fontSize="sm" color="gray.600">
                              🚗 {req.vehicle.make} {req.vehicle.model} ({req.vehicle.year}) - {req.vehicle.plate}
                            </Text>
                          )}
                        </VStack>
                        
                        <HStack spacing={2}>
                          <Tooltip label={t('requests.actions.approve', 'Aprovar solicitação')}>
                            <IconButton
                              aria-label="Aprovar"
                              icon={<Icon as={FiCheckCircle} />}
                              colorScheme="green"
                              size="sm"
                              onClick={() => handleApproveRequest(req)}
                            />
                          </Tooltip>
                          
                          <Tooltip label={t('requests.actions.contact', 'Marcar contato feito')}>
                            <IconButton
                              aria-label="Contato"
                              icon={<Icon as={FiPhone} />}
                              colorScheme="blue"
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkContact(req.id)}
                            />
                          </Tooltip>
                          
                          <Tooltip label={t('requests.actions.reject', 'Rejeitar solicitação')}>
                            <IconButton
                              aria-label="Rejeitar"
                              icon={<Icon as={FiXCircle} />}
                              colorScheme="red"
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(req)}
                            />
                          </Tooltip>
                        </HStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        <Divider />

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

      {/* Modal de Aprovação */}
      <StructuredModal
        isOpen={isApproveModalOpen}
        onClose={onApproveModalClose}
        title={t('requests.approve.title', 'Aprovar Solicitação')}
        size="md"
        footer={(
          <HStack spacing={3} justify="flex-end" w="full">
            <Button variant="ghost" onClick={onApproveModalClose}>
              {tc('actions.cancel', 'Cancelar')}
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmApprove}
              isLoading={isApproving}
            >
              {tc('actions.approve', 'Aprovar')}
            </Button>
          </HStack>
        )}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Text>
              {t('requests.approve.confirm', 'Tem certeza que deseja aprovar a solicitação de')} <strong>{selectedRequest.fullName}</strong>?
            </Text>
            <Box p={4} bg="blue.50" borderRadius="md">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm"><strong>Email:</strong> {selectedRequest.email}</Text>
                <Text fontSize="sm"><strong>Telefone:</strong> {selectedRequest.phone}</Text>
                <Text fontSize="sm"><strong>Cidade:</strong> {selectedRequest.city}</Text>
                {selectedRequest.nif && <Text fontSize="sm"><strong>NIF:</strong> {selectedRequest.nif}</Text>}
                <Text fontSize="sm"><strong>Tipo:</strong> {selectedRequest.type === 'affiliate' ? 'Afiliado' : 'Locatário'}</Text>
                </VStack>
                  </Box>
            <Text fontSize="sm" color="gray.600">
              {t('requests.approve.note', 'Um motorista será criado automaticamente e receberá uma senha temporária por email.')}
                      </Text>
          </VStack>
        )}
      </StructuredModal>

      {/* Modal de Rejeição */}
      <StructuredModal
        isOpen={isRejectModalOpen}
        onClose={onRejectModalClose}
        title={t('requests.reject.title', 'Rejeitar Solicitação')}
        size="md"
        footer={(
          <HStack spacing={3} justify="flex-end" w="full">
            <Button variant="ghost" onClick={onRejectModalClose}>
              {tc('actions.cancel', 'Cancelar')}
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmReject}
              isLoading={isApproving}
            >
              {tc('actions.reject', 'Rejeitar')}
            </Button>
                    </HStack>
        )}
      >
        {selectedRequest && (
          <VStack spacing={4} align="stretch">
            <Text>
              {t('requests.reject.confirm', 'Deseja rejeitar a solicitação de')} <strong>{selectedRequest.fullName}</strong>?
                      </Text>
            <Textarea
              placeholder={t('requests.reject.reasonPlaceholder', 'Motivo da rejeição...')}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <Text fontSize="sm" color="red.600">
              {t('requests.reject.note', 'O candidato receberá um email com o motivo da rejeição.')}
                    </Text>
                </VStack>
        )}
      </StructuredModal>
      </VStack>
    </AdminLayout>
  );
}

export default function DriversPage(props: DriversPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/requests?status=pending': { requests: props.initialRequests },
        },
      }}
    >
      <DriversPageContent {...props} />
    </SWRConfig>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Carregar motoristas e solicitações diretamente do Firestore
  const [drivers, requests] = await Promise.all([
    getDrivers(),
    getRequests({ status: 'pending', limit: 50 }),
  ]);

  return {
    initialDrivers: drivers,
    initialRequests: requests,
  };
});

