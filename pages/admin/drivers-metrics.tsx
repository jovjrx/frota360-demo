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
import LoggedInLayout from '@/components/LoggedInLayout';
import { getSession } from '@/lib/session';
import { ADMIN, COMMON } from '@/translations';

interface DriverMetricsProps {
  translations: any;
  locale: string;
}

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

export default function DriverMetrics({ translations, locale }: DriverMetricsProps) {
  const [drivers, setDrivers] = useState<DriverMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // dias
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables);
  };

  const tAdmin = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.admin, key, variables);
  };

  useEffect(() => {
    fetchDriverMetrics();
  }, [period]);

  const fetchDriverMetrics = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await fetch(
        `/api/admin/drivers/metrics?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (data.success) {
        setDrivers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching driver metrics:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2}>
              Métricas por Motorista
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Análise detalhada de performance individual
            </Text>
          </Box>

          {/* Filtros */}
          <Card>
            <CardBody>
              <HStack spacing={4} flexWrap="wrap">
                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">Período:</Text>
                  <Select value={period} onChange={(e) => setPeriod(e.target.value)} w="200px">
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                    <option value="365">Último ano</option>
                  </Select>
                </Box>

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

                <Box>
                  <Text fontSize="sm" mb={2} opacity={0}>.</Text>
                  <Button colorScheme="green" onClick={fetchDriverMetrics}>
                    Atualizar
                  </Button>
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
                    {loading ? (
                      <Tr>
                        <Td colSpan={9} textAlign="center" py={8}>
                          <Text color="gray.500">Carregando...</Text>
                        </Td>
                      </Tr>
                    ) : filteredDrivers.length === 0 ? (
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
        </VStack>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getSession(context.req, context.res);

    // Verificar se está logado e se tem role de admin
    if (!session?.isLoggedIn || (session.role !== 'admin' && session.user?.role !== 'admin')) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    const locale = Array.isArray(context.req.headers['x-locale'])
      ? context.req.headers['x-locale'][0]
      : context.req.headers['x-locale'] || 'pt';

    const translations = await loadTranslations(locale, ['common', 'admin']);
    const { common, admin } = translations;

    return {
      props: {
        translations: { common, admin },
        locale,
      },
    };
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {
      props: {
        translations: { common: {}, admin: {} },
        locale: 'pt',
      },
    };
  }
};
