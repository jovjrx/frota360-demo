import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardHeader,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Avatar,
  Progress as ChakraProgress,
} from '@chakra-ui/react';
import {
  FiUser,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiClock,
  FiMapPin,
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import AdminLayout from '@/components/layouts/AdminLayout';
import { ADMIN, COMMON } from '@/translations';
import { PageProps } from '@/interface/Global';

interface DriverMetric {
  id: string;
  name: string;
  email: string;
  type: 'affiliate' | 'renter';
  status: 'active' | 'inactive';
  vehicle?: string;
  metrics: {
    totalTrips: number;
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    avgFare: number;
    totalDistance: number;
    hoursWorked: number;
    rating: number;
  };
}

interface DriverMetricsProps extends PageProps {
  translations: {
    common: any;
    admin: any;
  };
  locale: string;
  drivers: DriverMetric[];
  defaultPeriod: string;
}

export default function DriverMetrics({ translations, locale, tCommon, tPage, drivers: initialDrivers, defaultPeriod }: DriverMetricsProps) {
  const [drivers] = useState<DriverMetric[]>(initialDrivers);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const t = tCommon || ((key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables);
  });

  const tAdmin = tPage || ((key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.admin, key, variables);
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value || 0);
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesType = filterType === 'all' || driver.type === filterType;
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calcular totais
  const totals = filteredDrivers.reduce((acc, driver) => ({
    trips: acc.trips + driver.metrics.totalTrips,
    earnings: acc.earnings + driver.metrics.totalEarnings,
    expenses: acc.expenses + driver.metrics.totalExpenses,
    profit: acc.profit + driver.metrics.netProfit,
  }), { trips: 0, earnings: 0, expenses: 0, profit: 0 });

  return (
    <AdminLayout
      title="Métricas por Motorista"
      subtitle="Análise detalhada de performance individual"
      breadcrumbs={[{ label: 'Controle Semanal' }]}
    >

      <Card>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">Tipo:</Text>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} w="200px">
                <option value="all">Todos</option>
                <option value="affiliate">Afiliados</option>
                <option value="renter">Locatários</option>
              </Select>
            </Box>

            <Box flex="1">
              <Text fontSize="sm" mb={2} fontWeight="medium">Buscar:</Text>
              <Input
                placeholder="Nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Box>
          </HStack>
        </CardBody>
      </Card>

      {/* Resumo Geral */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total de Viagens</StatLabel>
              <StatNumber color="purple.600">{formatNumber(totals.trips)}</StatNumber>
              <StatHelpText>{filteredDrivers.length} motoristas</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Receita Total</StatLabel>
              <StatNumber color="green.600">{formatCurrency(totals.earnings)}</StatNumber>
              <StatHelpText>Média: {formatCurrency(totals.earnings / (filteredDrivers.length || 1))}/motorista</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Despesas Totais</StatLabel>
              <StatNumber color="red.600">{formatCurrency(totals.expenses)}</StatNumber>
              <StatHelpText>Média: {formatCurrency(totals.expenses / (filteredDrivers.length || 1))}/motorista</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Lucro Líquido</StatLabel>
              <StatNumber color="blue.600">{formatCurrency(totals.profit)}</StatNumber>
              <StatHelpText>
                Margem: {totals.earnings ? ((totals.profit / totals.earnings) * 100).toFixed(1) : 0}%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Tabela de Motoristas */}
      <Card>
        <CardHeader>
          <Heading size="md">Performance Individual</Heading>
        </CardHeader>
        <CardBody>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Motorista</Th>
                  <Th>Tipo</Th>
                  <Th isNumeric>Viagens</Th>
                  <Th isNumeric>Receita</Th>
                  <Th isNumeric>Despesas</Th>
                  <Th isNumeric>Lucro</Th>
                  <Th isNumeric>Margem</Th>
                  <Th isNumeric>Avaliação</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDrivers.length === 0 ? (
                  <Tr>
                    <Td colSpan={9} textAlign="center" py={8}>
                      <Text color="gray.500">Nenhum motorista encontrado</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredDrivers.map((driver) => {
                    const margin = driver.metrics.totalEarnings
                      ? ((driver.metrics.netProfit / driver.metrics.totalEarnings) * 100).toFixed(1)
                      : '0';

                    return (
                      <Tr key={driver.id}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={driver.name} />
                            <Box>
                              <Text fontWeight="medium">{driver.name}</Text>
                              <Text fontSize="xs" color="gray.500">{driver.email}</Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={driver.type === 'affiliate' ? 'green' : 'blue'}>
                            {driver.type === 'affiliate' ? 'Afiliado' : 'Locatário'}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="medium">{formatNumber(driver.metrics.totalTrips)}</Td>
                        <Td isNumeric fontWeight="medium" color="green.600">
                          {formatCurrency(driver.metrics.totalEarnings)}
                        </Td>
                        <Td isNumeric fontWeight="medium" color="red.600">
                          {formatCurrency(driver.metrics.totalExpenses)}
                        </Td>
                        <Td isNumeric fontWeight="bold" color="blue.600">
                          {formatCurrency(driver.metrics.netProfit)}
                        </Td>
                        <Td isNumeric>
                          <Badge colorScheme={parseFloat(margin) > 20 ? 'green' : parseFloat(margin) > 10 ? 'yellow' : 'red'}>
                            {margin}%
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <HStack justify="flex-end" spacing={1}>
                            <Text fontWeight="medium">{driver.metrics.rating.toFixed(1)}</Text>
                            <Text color="yellow.500">⭐</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={driver.status === 'active' ? 'green' : 'gray'}>
                            {driver.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Cards de Detalhes */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {filteredDrivers.slice(0, 6).map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Avatar size="sm" name={driver.name} />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">{driver.name}</Text>
                    <Badge size="xs" colorScheme={driver.type === 'affiliate' ? 'green' : 'blue'}>
                      {driver.type === 'affiliate' ? 'Afiliado' : 'Locatário'}
                    </Badge>
                  </Box>
                </HStack>
                <Badge colorScheme={driver.status === 'active' ? 'green' : 'gray'}>
                  {driver.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={FiActivity} color="purple.500" />
                    <Text fontSize="sm">Viagens</Text>
                  </HStack>
                  <Text fontWeight="bold">{formatNumber(driver.metrics.totalTrips)}</Text>
                </HStack>

                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={FiDollarSign} color="green.500" />
                    <Text fontSize="sm">Receita</Text>
                  </HStack>
                  <Text fontWeight="bold" color="green.600">
                    {formatCurrency(driver.metrics.totalEarnings)}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={FiTrendingUp} color="blue.500" />
                    <Text fontSize="sm">Lucro</Text>
                  </HStack>
                  <Text fontWeight="bold" color="blue.600">
                    {formatCurrency(driver.metrics.netProfit)}
                  </Text>
                </HStack>

                <Divider />

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Ticket Médio</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatCurrency(driver.metrics.avgFare)}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Distância</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatNumber(driver.metrics.totalDistance)} km
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Horas Trabalhadas</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {driver.metrics.hoursWorked}h
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Avaliação</Text>
                  <HStack spacing={1}>
                    <Text fontSize="sm" fontWeight="medium">{driver.metrics.rating.toFixed(1)}</Text>
                    <Text color="yellow.500">⭐</Text>
                  </HStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);

  if ('redirect' in authResult) {
    return authResult;
  }

  try {
    const { fetchDriverMetricsData } = await import('@/lib/admin/unified-data');

    // Período padrão: últimos 30 dias
    const period = (context.query.period as string) || '30';
    const days = parseInt(period);

    // Buscar dados unificados incluindo weekly records
    const unifiedData = await fetchDriverMetricsData(days);

    // Converter para formato esperado pelo componente
    const drivers = unifiedData.drivers.map(driver => {
      // Buscar métricas semanais deste motorista
      const driverWeeklyRecords = unifiedData.weeklyRecords.filter(
        record => record.driverId === driver.id
      );

      // Agregar métricas de todos os weekly records
      const metrics = driverWeeklyRecords.reduce(
        (acc, record) => ({
          totalTrips: acc.totalTrips + record.metrics.totalTrips,
          totalEarnings: acc.totalEarnings + record.metrics.totalEarnings,
          totalExpenses: acc.totalExpenses + record.metrics.totalExpenses,
          netProfit: acc.netProfit + record.metrics.netProfit,
          avgFare: acc.avgFare + record.metrics.avgFare,
          totalDistance: acc.totalDistance + record.metrics.totalDistance,
          hoursWorked: acc.hoursWorked + record.metrics.hoursWorked,
          rating: Math.max(acc.rating, record.metrics.rating),
        }),
        {
          totalTrips: 0,
          totalEarnings: 0,
          totalExpenses: 0,
          netProfit: 0,
          avgFare: 0,
          totalDistance: 0,
          hoursWorked: 0,
          rating: 0,
        }
      );

      // Calcular média de tarifa
      if (metrics.totalTrips > 0) {
        metrics.avgFare = metrics.totalEarnings / metrics.totalTrips;
      }

      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        type: driver.type,
        status: driver.status,
        vehicle: driver.vehicle,
        metrics,
      };
    });

    return {
      props: {
        ...authResult.props,
        drivers,
        defaultPeriod: period,
      },
    };
  } catch (error) {
    console.error('Error fetching driver metrics:', error);
    return {
      props: {
        ...authResult.props,
        drivers: [],
        defaultPeriod: '30',
      },
    };
  }
};
