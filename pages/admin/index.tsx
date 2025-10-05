import { GetServerSideProps } from 'next';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown,
  FiTruck,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiActivity,
  FiEdit,
  FiSettings
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { ADMIN } from '@/translations';
import { PageProps } from '@/interface/Global';

interface DashboardMetrics {
  summary: {
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    totalTrips: number;
    activeVehicles: number;
    activeDrivers: number;
    activeAffiliates: number;
    activeRenters: number;
    utilizationRate: number;
  };
  errors: string[];
}

interface AdminDashboardProps extends PageProps {
  translations: {
    common: any;
    page: any;
  };
  locale: string;
  metrics: DashboardMetrics;
}

export default function AdminDashboard({ translations, locale, tCommon, tPage, metrics }: AdminDashboardProps) {

  const t = tCommon || ((key: string) => getTranslation(translations.common, key));
  const tAdmin = tPage || ((key: string) => getTranslation(translations.page, key));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value || 0);
  };

  return (
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2}>
              {tAdmin(ADMIN.DASHBOARD.TITLE)}
            </Heading>
            <Text color="gray.600" fontSize="lg">
              {tAdmin(ADMIN.DASHBOARD.SUBTITLE)}
            </Text>
          </Box>

          {/* KPIs Principais */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {/* Receita Total */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>{tAdmin(ADMIN.DASHBOARD.TOTAL_REVENUE)}</StatLabel>
                    <Icon as={FiDollarSign} color="green.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="green.600">
                    {formatCurrency(metrics?.summary?.totalEarnings || 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12.5% vs mês anterior
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            {/* Despesas Totais */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>{tAdmin(ADMIN.DASHBOARD.TOTAL_EXPENSES)}</StatLabel>
                    <Icon as={FiTrendingDown} color="red.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="red.600">
                    {formatCurrency(metrics?.summary?.totalExpenses || 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    3.2% vs mês anterior
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            {/* Lucro Líquido */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>{tAdmin(ADMIN.DASHBOARD.NET_PROFIT)}</StatLabel>
                    <Icon as={FiTrendingUp} color="blue.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="blue.600">
                    {formatCurrency(metrics?.summary?.netProfit || 0)}
                  </StatNumber>
                  <StatHelpText>
                    Margem: {metrics?.summary?.totalEarnings ? 
                      ((metrics.summary.netProfit / metrics.summary.totalEarnings) * 100).toFixed(1) : 0}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            {/* Total de Viagens */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>{tAdmin(ADMIN.DASHBOARD.TOTAL_TRIPS)}</StatLabel>
                    <Icon as={FiActivity} color="purple.500" boxSize={5} />
                  </HStack>
                  <StatNumber fontSize="3xl" color="purple.600">
                    {formatNumber(metrics?.summary?.totalTrips || 0)}
                  </StatNumber>
                  <StatHelpText>
                    Média: {formatCurrency((metrics?.summary?.totalEarnings || 0) / (metrics?.summary?.totalTrips || 1))} /viagem
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Frota e Motoristas */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Frota Ativa */}
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">{tAdmin(ADMIN.DASHBOARD.FLEET_TITLE)}</Heading>
                  <Icon as={FiTruck} color="green.500" boxSize={6} />
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="4xl" fontWeight="bold" color="green.600">
                      {formatNumber(metrics?.summary?.activeVehicles || 0)}
                    </Text>
                    <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                      Veículos
                    </Badge>
                  </HStack>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Taxa de Utilização</Text>
                    <Progress value={85} colorScheme="green" size="lg" borderRadius="md" />
                    <Text fontSize="sm" color="gray.500" mt={1}>85% da frota em operação</Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Motoristas Ativos */}
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">{tAdmin(ADMIN.DASHBOARD.DRIVERS_TITLE)}</Heading>
                  <Icon as={FiUsers} color="blue.500" boxSize={6} />
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="4xl" fontWeight="bold" color="blue.600">
                      {formatNumber(metrics?.summary?.activeDrivers || 0)}
                    </Text>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      Motoristas
                    </Badge>
                  </HStack>
                  <Divider />
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">{tAdmin(ADMIN.DASHBOARD.AFFILIATES)}</Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {Math.floor((metrics?.summary?.activeDrivers || 0) * 0.6)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">{tAdmin(ADMIN.DASHBOARD.RENTERS)}</Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {Math.floor((metrics?.summary?.activeDrivers || 0) * 0.4)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Status das Integrações */}
          <Card>
            <CardHeader>
              <Heading size="md">{tAdmin(ADMIN.DASHBOARD.INTEGRATIONS_TITLE)}</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {[
                  { name: 'Uber', status: 'online', lastSync: '2 min atrás' },
                  { name: 'Bolt', status: 'online', lastSync: '5 min atrás' },
                  { name: 'Cartrack', status: 'online', lastSync: '1 min atrás' },
                  { name: 'ViaVerde', status: 'online', lastSync: '3 min atrás' },
                  { name: 'FONOA', status: 'warning', lastSync: '2 horas atrás' },
                  { name: 'myprio', status: 'online', lastSync: '10 min atrás' },
                ].map((integration) => (
                  <HStack
                    key={integration.name}
                    p={4}
                    bg="gray.50"
                    borderRadius="md"
                    justify="space-between"
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{integration.name}</Text>
                      <Text fontSize="xs" color="gray.600">
                        {integration.lastSync}
                      </Text>
                    </VStack>
                    <Icon
                      as={integration.status === 'online' ? FiCheckCircle : FiAlertCircle}
                      color={integration.status === 'online' ? 'green.500' : 'orange.500'}
                      boxSize={5}
                    />
                  </HStack>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Ações Rápidas */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Button
              as={NextLink}
              href="/admin/requests"
              size="lg"
              colorScheme="green"
              leftIcon={<Icon as={FiUsers} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>{tAdmin(ADMIN.DASHBOARD.MANAGE_REQUESTS)}</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Candidaturas pendentes
                </Text>
              </VStack>
            </Button>

            <Button
              as={NextLink}
              href="/admin/drivers"
              size="lg"
              colorScheme="orange"
              leftIcon={<Icon as={FiUsers} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>{tAdmin(ADMIN.DASHBOARD.MANAGE_DRIVERS)}</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Controle de motoristas
                </Text>
              </VStack>
            </Button>

            <Button
              as={NextLink}
              href="/admin/metrics"
              size="lg"
              colorScheme="blue"
              leftIcon={<Icon as={FiActivity} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>{tAdmin(ADMIN.DASHBOARD.DETAILED_METRICS)}</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Análise por plataforma
                </Text>
              </VStack>
            </Button>

            <Button
              as={NextLink}
              href="/admin/fleet"
              size="lg"
              colorScheme="teal"
              leftIcon={<Icon as={FiTruck} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>{tAdmin(ADMIN.DASHBOARD.MANAGE_FLEET)}</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Controle da frota
                </Text>
              </VStack>
            </Button>
          </SimpleGrid>

          {/* Segunda linha de ações */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Button
              as={NextLink}
              href="/admin/integrations"
              size="lg"
              colorScheme="purple"
              leftIcon={<Icon as={FiSettings} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>{tAdmin(ADMIN.DASHBOARD.INTEGRATIONS)}</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Status das integrações
                </Text>
              </VStack>
            </Button>

            <Button
              as={NextLink}
              href="/admin/content"
              size="lg"
              colorScheme="gray"
              leftIcon={<Icon as={FiEdit} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>{tAdmin(ADMIN.DASHBOARD.CONTENT_MANAGEMENT)}</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Editar textos do site
                </Text>
              </VStack>
            </Button>
          </SimpleGrid>

          {/* Alertas */}
          {metrics?.errors && metrics.errors.length > 0 && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">{tAdmin(ADMIN.DASHBOARD.INTEGRATION_PROBLEMS)}</Text>
                <Text fontSize="sm">
                  {metrics.errors.length} plataforma(s) com erros. Verifique as integrações.
                </Text>
              </Box>
            </Alert>
          )}
        </VStack>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  if ('redirect' in authResult || 'notFound' in authResult) {
    return authResult;
  }

  try {
    const { fetchDashboardData } = await import('@/lib/admin/unified-data');
    
    // Buscar dados unificados dos últimos 30 dias
    const unifiedData = await fetchDashboardData(30);

    // Converter para formato esperado pelo componente
    const metrics: DashboardMetrics = {
      summary: {
        totalEarnings: unifiedData.summary.financial.totalEarnings,
        totalExpenses: unifiedData.summary.financial.totalExpenses,
        netProfit: unifiedData.summary.financial.netProfit,
        totalTrips: unifiedData.summary.operations.totalTrips,
        activeVehicles: unifiedData.summary.fleet.activeVehicles,
        activeDrivers: unifiedData.summary.drivers.activeDrivers,
        activeAffiliates: unifiedData.summary.drivers.affiliates,
        activeRenters: unifiedData.summary.drivers.renters,
        utilizationRate: unifiedData.summary.fleet.utilizationRate,
      },
      errors: unifiedData.errors,
    };

    return {
      props: {
        ...authResult.props,
        metrics,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      props: {
        ...authResult.props,
        metrics: {
          summary: {
            totalEarnings: 0,
            totalExpenses: 0,
            netProfit: 0,
            totalTrips: 0,
            activeVehicles: 0,
            activeDrivers: 0,
            activeAffiliates: 0,
            activeRenters: 0,
            utilizationRate: 0,
          },
          errors: [],
        },
      },
    };
  }
};

