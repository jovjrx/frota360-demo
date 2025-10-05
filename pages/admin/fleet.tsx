import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { 
  FiSearch,
  FiEdit,
  FiPlus,
  FiFilter,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiDownload,
  FiRefreshCw,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { ADMIN } from '@/translations';
import { PageProps } from '@/interface/Global';
import { FleetRecord, calculateFleetRecord } from '@/schemas/fleet-record';

interface FleetFilters {
  driverId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface FleetKPIs {
  totalEarnings: number;
  totalExpenses: number;
  totalCommissions: number;
  totalPayouts: number;
  pendingPayments: number;
}

export default function AdminFleet({ tCommon, tPage, locale }: PageProps) {
  const [records, setRecords] = useState<FleetRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FleetRecord[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<FleetFilters>({
    driverId: '',
    vehicleId: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [selectedRecord, setSelectedRecord] = useState<FleetRecord | null>(null);
  const [formData, setFormData] = useState<Partial<FleetRecord>>({});
  const [calculatedValues, setCalculatedValues] = useState<any>({});
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isEditModal, onOpen: onEditModal, onClose: onEditModalClose } = useDisclosure();
  
  const toast = useToast();
  
  const tAdmin = tPage;
  const t = tCommon;

  // Mock data - substituir por chamadas à API
  useEffect(() => {
    const mockRecords: FleetRecord[] = [
      {
        id: '1',
        driverId: 'd1',
        driverName: 'João Silva',
        vehicleId: 'v1',
        vehiclePlate: 'AX-42-DO',
        periodStart: '2024-01-01',
        periodEnd: '2024-01-08',
        earningsUber: 389.04,
        earningsBolt: 328.71,
        earningsTotal: 717.75,
        tipsUber: 13.55,
        tipsBolt: 8.20,
        tipsTotal: 21.75,
        tollsUber: 17.70,
        tollsAdjusted: 17.70,
        rental: 0,
        fuel: 170.90,
        otherExpenses: 0,
        commissionRate: 0.07,
        commissionBase: 700.05,
        commissionAmount: 49.00,
        netPayout: 527.86,
        iban: 'PT50000700000066615972323',
        paymentStatus: 'paid',
        paymentDate: '2024-01-10',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-10T15:30:00Z',
        createdBy: 'admin',
        notes: 'Período normal de operação'
      },
      {
        id: '2',
        driverId: 'd2',
        driverName: 'Maria Santos',
        vehicleId: 'v2',
        vehiclePlate: 'BY-53-EF',
        periodStart: '2024-01-01',
        periodEnd: '2024-01-08',
        earningsUber: 245.80,
        earningsBolt: 189.50,
        earningsTotal: 435.30,
        tipsUber: 12.40,
        tipsBolt: 6.80,
        tipsTotal: 19.20,
        tollsUber: 8.90,
        tollsAdjusted: 8.90,
        rental: 120.00,
        fuel: 95.60,
        otherExpenses: 15.00,
        commissionRate: 0.07,
        commissionBase: 426.40,
        commissionAmount: 29.85,
        netPayout: 289.65,
        iban: 'PT50000700000077715972324',
        paymentStatus: 'pending',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
        createdBy: 'admin'
      }
    ];

    const mockDrivers = [
      { id: 'd1', name: 'João Silva' },
      { id: 'd2', name: 'Maria Santos' },
      { id: 'd3', name: 'Pedro Costa' }
    ];

    const mockVehicles = [
      { id: 'v1', plate: 'AX-42-DO' },
      { id: 'v2', plate: 'BY-53-EF' },
      { id: 'v3', plate: 'CZ-64-GH' }
    ];
    
    setRecords(mockRecords);
    setFilteredRecords(mockRecords);
    setDrivers(mockDrivers);
    setVehicles(mockVehicles);
    setLoading(false);
  }, []);

  // Calcular KPIs
  const kpis: FleetKPIs = {
    totalEarnings: filteredRecords.reduce((sum, r) => sum + r.earningsTotal, 0),
    totalExpenses: filteredRecords.reduce((sum, r) => sum + r.fuel + r.rental + r.otherExpenses, 0),
    totalCommissions: filteredRecords.reduce((sum, r) => sum + r.commissionAmount, 0),
    totalPayouts: filteredRecords.reduce((sum, r) => sum + r.netPayout, 0),
    pendingPayments: filteredRecords
      .filter(r => r.paymentStatus === 'pending')
      .reduce((sum, r) => sum + r.netPayout, 0)
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = records;
    
    if (filters.driverId) {
      filtered = filtered.filter(record => record.driverId === filters.driverId);
    }
    
    if (filters.vehicleId) {
      filtered = filtered.filter(record => record.vehicleId === filters.vehicleId);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(record => record.periodStart >= filters.startDate);
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(record => record.periodEnd <= filters.endDate);
    }
    
    if (filters.status) {
      filtered = filtered.filter(record => record.paymentStatus === filters.status);
    }
    
    setFilteredRecords(filtered);
  }, [records, filters]);

  // Calcular valores quando formData muda
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      const calculated = calculateFleetRecord(formData);
      setCalculatedValues(calculated);
    }
  }, [formData]);

  const handleAddRecord = () => {
    setFormData({});
    setCalculatedValues({});
    onModalOpen();
  };

  const handleEditRecord = (record: FleetRecord) => {
    setFormData(record);
    setCalculatedValues(calculateFleetRecord(record));
    onEditModal();
  };

  const handleMarkAsPaid = async (record: FleetRecord) => {
    try {
      // Aqui faria a chamada à API
      setRecords(prev => prev.map(r => 
        r.id === record.id 
          ? { ...r, paymentStatus: 'paid', paymentDate: new Date().toISOString() }
          : r
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Registro marcado como pago!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar como pago',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      // Aqui faria a chamada à API de sincronização
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      
      toast({
        title: 'Sucesso',
        description: 'Dados sincronizados com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro na sincronização',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportExcel = () => {
    // Implementar exportação para Excel
    toast({
      title: 'Exportação',
      description: 'Exportando dados para Excel...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString('pt-PT');
    const endDate = new Date(end).toLocaleDateString('pt-PT');
    return `${startDate} - ${endDate}`;
  };

  if (loading) {
    return (
      <LoggedInLayout>
        <Container maxW="container.xl">
          <Center h="400px">
            <Spinner size="xl" />
          </Center>
        </Container>
      </LoggedInLayout>
    );
  }

  return (
    <LoggedInLayout>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Box>
              <Heading size="lg">{tAdmin('fleet.title')}</Heading>
              <Text color="gray.600">{tAdmin('fleet.subtitle')}</Text>
            </Box>
            <HStack>
              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={handleSyncData}
                isLoading={syncing}
                loadingText="Sincronizando..."
              >
                {tAdmin('fleet.syncData')}
              </Button>
              <Button
                leftIcon={<Icon as={FiDownload} />}
                onClick={handleExportExcel}
              >
                {tAdmin('fleet.exportExcel')}
              </Button>
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={FiPlus} />}
                onClick={handleAddRecord}
              >
                {tAdmin('fleet.addRecord')}
              </Button>
            </HStack>
          </HStack>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">{tAdmin('fleet.kpis.totalEarnings')}</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {formatCurrency(kpis.totalEarnings)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">{tAdmin('fleet.kpis.totalExpenses')}</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {formatCurrency(kpis.totalExpenses)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">{tAdmin('fleet.kpis.totalCommissions')}</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {formatCurrency(kpis.totalCommissions)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">{tAdmin('fleet.kpis.totalPayouts')}</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {formatCurrency(kpis.totalPayouts)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">{tAdmin('fleet.kpis.pending')}</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {formatCurrency(kpis.pendingPayments)}
                  </Text>
                  <Badge colorScheme="yellow">Pendente</Badge>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filtros */}
          <Card>
            <CardBody>
              <HStack spacing={4} flexWrap="wrap">
                <Select
                  placeholder={tAdmin('fleet.filters.driver')}
                  value={filters.driverId}
                  onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
                  maxW="200px"
                >
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </Select>
                
                <Select
                  placeholder={tAdmin('fleet.filters.vehicle')}
                  value={filters.vehicleId}
                  onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
                  maxW="200px"
                >
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.plate}</option>
                  ))}
                </Select>
                
                <Input
                  type="date"
                  placeholder={tAdmin('fleet.filters.startDate')}
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  maxW="200px"
                />
                
                <Input
                  type="date"
                  placeholder={tAdmin('fleet.filters.endDate')}
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  maxW="200px"
                />
                
                <Select
                  placeholder={tAdmin('fleet.filters.status')}
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  maxW="150px"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="cancelled">Cancelado</option>
                </Select>
                
                <Button
                  leftIcon={<Icon as={FiFilter} />}
                  variant="outline"
                  onClick={() => setFilters({
                    driverId: '',
                    vehicleId: '',
                    startDate: '',
                    endDate: '',
                    status: ''
                  })}
                >
                  Limpar Filtros
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Tabela */}
          <Card>
            <CardBody p={0}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{tAdmin('fleet.table.driver')}</Th>
                    <Th>{tAdmin('fleet.table.vehicle')}</Th>
                    <Th>{tAdmin('fleet.table.period')}</Th>
                    <Th isNumeric>{tAdmin('fleet.table.uber')}</Th>
                    <Th isNumeric>{tAdmin('fleet.table.bolt')}</Th>
                    <Th isNumeric>{tAdmin('fleet.table.total')}</Th>
                    <Th isNumeric>{tAdmin('fleet.table.fuel')}</Th>
                    <Th isNumeric>{tAdmin('fleet.table.commission')}</Th>
                    <Th isNumeric>{tAdmin('fleet.table.payout')}</Th>
                    <Th>{tAdmin('fleet.table.status')}</Th>
                    <Th>{tAdmin('fleet.table.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRecords.map((record) => (
                    <Tr key={record.id}>
                      <Td fontWeight="medium">{record.driverName}</Td>
                      <Td>{record.vehiclePlate}</Td>
                      <Td>{formatPeriod(record.periodStart, record.periodEnd)}</Td>
                      <Td isNumeric>{formatCurrency(record.earningsUber)}</Td>
                      <Td isNumeric>{formatCurrency(record.earningsBolt)}</Td>
                      <Td isNumeric>{formatCurrency(record.earningsTotal)}</Td>
                      <Td isNumeric>{formatCurrency(record.fuel)}</Td>
                      <Td isNumeric>{formatCurrency(record.commissionAmount)}</Td>
                      <Td isNumeric fontWeight="bold">
                        {formatCurrency(record.netPayout)}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(record.paymentStatus)}>
                          {getStatusText(record.paymentStatus)}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<Icon as={FiEdit} />}
                            onClick={() => handleEditRecord(record)}
                          >
                            Editar
                          </Button>
                          {record.paymentStatus === 'pending' && (
                            <Button
                              size="sm"
                              colorScheme="green"
                              leftIcon={<Icon as={FiCheck} />}
                              onClick={() => handleMarkAsPaid(record)}
                            >
                              {tAdmin('fleet.markAsPaid')}
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </VStack>

        {/* Modal de Adicionar/Editar Registro */}
        <Modal isOpen={isModalOpen || isEditModal} onClose={isEditModal ? onEditModalClose : onModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isEditModal ? tAdmin('fleet.editRecord') : tAdmin('fleet.addRecord')}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <SimpleGrid columns={2} spacing={4} width="100%">
                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.driver')}</FormLabel>
                    <Select
                      value={formData.driverId || ''}
                      onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    >
                      <option value="">Selecionar motorista</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.vehicle')}</FormLabel>
                    <Select
                      value={formData.vehicleId || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    >
                      <option value="">Selecionar veículo</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.plate}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.periodStart')}</FormLabel>
                    <Input
                      type="date"
                      value={formData.periodStart || ''}
                      onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.periodEnd')}</FormLabel>
                    <Input
                      type="date"
                      value={formData.periodEnd || ''}
                      onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.earningsUber')}</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.earningsUber || ''}
                      onChange={(e) => setFormData({ ...formData, earningsUber: parseFloat(e.target.value) || 0 })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.earningsBolt')}</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.earningsBolt || ''}
                      onChange={(e) => setFormData({ ...formData, earningsBolt: parseFloat(e.target.value) || 0 })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.fuel')}</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.fuel || ''}
                      onChange={(e) => setFormData({ ...formData, fuel: parseFloat(e.target.value) || 0 })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tAdmin('fleet.form.rental')}</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.rental || ''}
                      onChange={(e) => setFormData({ ...formData, rental: parseFloat(e.target.value) || 0 })}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Resumo Calculado */}
                {Object.keys(calculatedValues).length > 0 && (
                  <Card width="100%" bg="gray.50">
                    <CardBody>
                      <VStack align="stretch">
                        <HStack justify="space-between">
                          <Text>{tAdmin('fleet.form.calculatedTotal')}:</Text>
                          <Text fontWeight="bold">{formatCurrency(calculatedValues.earningsTotal || 0)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>{tAdmin('fleet.form.calculatedCommission')}:</Text>
                          <Text>{formatCurrency(calculatedValues.commissionBase || 0)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text>{tAdmin('fleet.form.calculatedCommissionAmount')}:</Text>
                          <Text>{formatCurrency(calculatedValues.commissionAmount || 0)}</Text>
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="lg">{tAdmin('fleet.form.calculatedPayout')}:</Text>
                          <Text fontWeight="bold" fontSize="lg" color="green.500">
                            {formatCurrency(calculatedValues.netPayout || 0)}
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={isEditModal ? onEditModalClose : onModalClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue">
                {isEditModal ? 'Atualizar' : 'Adicionar'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
    const result = await checkAdminAuth(context);
    
    if ('redirect' in result) {
      return result;
    }

    // Criar funções de tradução
    const { createTranslationFunction } = await import('@/lib/translations');
    const tCommon = createTranslationFunction(result.props.translations.common);
    const tPage = createTranslationFunction(result.props.translations.page);

    return {
      props: {
        ...result.props,
        tCommon,
        tPage,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};
