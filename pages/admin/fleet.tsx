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
  useToast,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { 
  FiRefreshCw,
  FiDownload,
  FiPlus,
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { PageProps } from '@/interface/Global';
import { FleetRecord } from '@/schemas/fleet-record';

interface FleetFilters {
  driverId: string;
  vehicleId: string;
  status: string;
}

interface FleetKPIs {
  totalEarnings: number;
  totalExpenses: number;
  totalCommissions: number;
  totalPayouts: number;
  pendingPayments: number;
}

interface AdminFleetProps extends PageProps {
  translations: {
    common: any;
    page: any;
  };
  locale: string;
  records: FleetRecord[];
  drivers: Array<{ id: string; name: string; email: string }>;
  vehicles: Array<{ id: string; plate: string; make: string; model: string }>;
  kpis: FleetKPIs;
}

export default function AdminFleet({ 
  translations, 
  locale, 
  tCommon, 
  tPage, 
  records: initialRecords, 
  drivers, 
  vehicles, 
  kpis 
}: AdminFleetProps) {
  const [records, setRecords] = useState<FleetRecord[]>(initialRecords);
  const [filteredRecords, setFilteredRecords] = useState<FleetRecord[]>(initialRecords);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<FleetFilters>({
    driverId: '',
    vehicleId: '',
    status: ''
  });
  
  const toast = useToast();
  const t = tCommon || ((key: string) => getTranslation(translations.common, key));
  const tAdmin = tPage || ((key: string) => getTranslation(translations.page, key));

  // Filtrar localmente quando mudarem os filtros
  useEffect(() => {
    let filtered = records;

    if (filters.driverId) {
      filtered = filtered.filter(r => r.driverId === filters.driverId);
    }
    if (filters.vehicleId) {
      filtered = filtered.filter(r => r.vehicleId === filters.vehicleId);
    }
    if (filters.status) {
      filtered = filtered.filter(r => r.paymentStatus === filters.status);
    }

    setFilteredRecords(filtered);
  }, [filters, records]);

  // Calcular KPIs dinamicamente baseado nos registros filtrados
  const currentKpis: FleetKPIs = {
    totalEarnings: filteredRecords.reduce((sum, r) => sum + (r.earningsTotal || 0), 0),
    totalExpenses: filteredRecords.reduce((sum, r) => sum + (r.fuel || 0) + (r.rental || 0) + (r.otherExpenses || 0), 0),
    totalCommissions: filteredRecords.reduce((sum, r) => sum + (r.commissionAmount || 0), 0),
    totalPayouts: filteredRecords.reduce((sum, r) => sum + (r.netPayout || 0), 0),
    pendingPayments: filteredRecords.filter(r => r.paymentStatus === 'pending').reduce((sum, r) => sum + (r.netPayout || 0), 0),
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/fleet/sync', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: 'Sincronização concluída',
          description: 'Dados da frota atualizados com sucesso',
          status: 'success',
          duration: 3000,
        });
        window.location.reload();
      } else {
        throw new Error('Erro ao sincronizar dados');
      }
    } catch (error) {
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os dados',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportExcel = () => {
    toast({
      title: 'Exportação',
      description: 'Exportando dados para Excel...',
      status: 'info',
      duration: 3000,
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

  return (
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Box>
              <Heading size="lg">Controle da Frota</Heading>
              <Text color="gray.600">Gestão de veículos e motoristas</Text>
            </Box>
            <HStack>
              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={handleSyncData}
                isLoading={syncing}
                loadingText="Sincronizando..."
              >
                Sincronizar
              </Button>
              <Button
                leftIcon={<Icon as={FiDownload} />}
                onClick={handleExportExcel}
              >
                Exportar Excel
              </Button>
            </HStack>
          </HStack>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Receitas Totais</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {formatCurrency(currentKpis.totalEarnings)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Despesas Totais</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {formatCurrency(currentKpis.totalExpenses)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Comissões</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {formatCurrency(currentKpis.totalCommissions)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Pagamentos</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {formatCurrency(currentKpis.totalPayouts)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Pendentes</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {formatCurrency(currentKpis.pendingPayments)}
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
                  placeholder="Todos os motoristas"
                  value={filters.driverId}
                  onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
                  maxW="200px"
                >
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </Select>
                
                <Select
                  placeholder="Todos os veículos"
                  value={filters.vehicleId}
                  onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
                  maxW="200px"
                >
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </Select>

                <Select
                  placeholder="Todos os status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  maxW="150px"
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="cancelled">Cancelado</option>
                </Select>

                {(filters.driverId || filters.vehicleId || filters.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFilters({ driverId: '', vehicleId: '', status: '' })}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </HStack>
            </CardBody>
          </Card>

          {/* Tabela de Registros */}
          <Card>
            <CardBody>
              {filteredRecords.length === 0 ? (
                <Center py={10}>
                  <VStack>
                    <Text color="gray.500">Nenhum registro encontrado</Text>
                    <Text fontSize="sm" color="gray.400">
                      Ajuste os filtros ou sincronize novos dados
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Motorista</Th>
                        <Th>Veículo</Th>
                        <Th>Período</Th>
                        <Th isNumeric>Receitas</Th>
                        <Th isNumeric>Despesas</Th>
                        <Th isNumeric>Comissão</Th>
                        <Th isNumeric>Pagamento</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredRecords.map((record) => (
                        <Tr key={record.id}>
                          <Td>{record.driverName || 'N/A'}</Td>
                          <Td>{record.vehiclePlate || 'N/A'}</Td>
                          <Td>{formatPeriod(record.periodStart, record.periodEnd)}</Td>
                          <Td isNumeric color="green.600">
                            {formatCurrency(record.earningsTotal || 0)}
                          </Td>
                          <Td isNumeric color="red.600">
                            {formatCurrency((record.fuel || 0) + (record.rental || 0) + (record.otherExpenses || 0))}
                          </Td>
                          <Td isNumeric>
                            {formatCurrency(record.commissionAmount || 0)}
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {formatCurrency(record.netPayout || 0)}
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(record.paymentStatus || 'pending')}>
                              {getStatusText(record.paymentStatus || 'pending')}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  if ('redirect' in authResult) {
    return authResult;
  }

  try {
    const { fetchUnifiedAdminData } = await import('@/lib/admin/unified-data');
    
    // Calcular período dos últimos 30 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Buscar dados unificados dos últimos 30 dias
    const unifiedData = await fetchUnifiedAdminData({
      startDate,
      endDate,
      includeFleetRecords: true,
      includeDrivers: true,
      includeVehicles: true,
      includeIntegrations: false,
      includeRequests: false,
      driverStatus: 'active',
      vehicleStatus: 'all',
    });

    // Converter para formato esperado pelo componente
    const records = unifiedData.fleetRecords.map(record => ({
      id: record.id,
      date: record.date,
      driverId: record.driverId,
      driverName: record.driverName,
      vehicleId: record.vehicleId,
      vehiclePlate: record.vehiclePlate,
      earningsTotal: record.totalEarnings,
      fuel: record.totalExpenses * 0.4, // Estimativa
      rental: record.totalExpenses * 0.3, // Estimativa
      otherExpenses: record.totalExpenses * 0.3, // Estimativa
      commissionAmount: record.totalEarnings * 0.2, // Estimativa
      netPayout: record.netProfit,
      paymentStatus: 'paid', // Default
      periodStart: record.date,
      periodEnd: record.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const drivers = unifiedData.drivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      email: driver.email,
    }));

    const vehicles = unifiedData.vehicles.map(vehicle => ({
      id: vehicle.id,
      plate: vehicle.plate,
      make: vehicle.brand,
      model: vehicle.model,
    }));

    // Calcular KPIs usando dados unificados
    const kpis = {
      totalEarnings: unifiedData.summary.financial.totalEarnings,
      totalExpenses: unifiedData.summary.financial.totalExpenses,
      totalCommissions: unifiedData.summary.financial.totalEarnings * 0.2,
      totalPayouts: unifiedData.summary.financial.netProfit,
      pendingPayments: 0, // Requer lógica adicional
    };

    return {
      props: {
        ...authResult.props,
        records,
        drivers,
        vehicles,
        kpis,
      },
    };
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return {
      props: {
        ...authResult.props,
        records: [],
        drivers: [],
        vehicles: [],
        kpis: {
          totalEarnings: 0,
          totalExpenses: 0,
          totalCommissions: 0,
          totalPayouts: 0,
          pendingPayments: 0,
        },
      },
    };
  }
};
