import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Select,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Icon,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Code,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiRefreshCw, 
  FiTrendingUp, 
  FiTrendingDown,
  FiActivity,
  FiDollarSign,
  FiUsers,
  FiTruck,
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { getSession } from '@/lib/session';
import { ADMIN, COMMON } from '@/translations';
import { PageProps } from '@/interface/Global';

interface PlatformMetrics {
  platform: string;
  online: boolean;
  lastSync: string;
  error?: string;
  data?: any;
}

interface UnifiedMetrics {
  summary: {
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    totalTrips: number;
    activeVehicles: number;
    activeDrivers: number;
  };
  platforms: {
    [key: string]: PlatformMetrics;
  };
  errors: string[];
}

export default function MetricsPage({ tPage, tCommon, locale }: PageProps & { locale: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<UnifiedMetrics | null>(null);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const t = (key: string) => {
    return tCommon(key);
  };

  const tAdmin = (key: string) => {
    return tPage(key);
  };

  useEffect(() => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = new Date();

    switch (period) {
      case 'today':
        start = today;
        break;
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end);
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchMetrics();
    }
  }, [startDate, endDate]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/metrics/unified?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
      } else {
        throw new Error(data.error || 'Erro ao carregar métricas');
      }
    } catch (error: any) {
      toast({
        title: t(COMMON.MESSAGES.ERROR),
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (platform: string) => {
    setTestingConnection(platform);
    try {
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Conexão estabelecida com sucesso',
          status: 'success',
          duration: 3000,
        });
        fetchMetrics(); // Refresh metrics
      } else {
        throw new Error(data.error || 'Erro ao testar conexão');
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao conectar',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setTestingConnection(null);
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'uber':
        return FiActivity;
      case 'bolt':
        return FiTrendingUp;
      case 'cartrack':
        return FiTruck;
      case 'viaverde':
        return FiDollarSign;
      case 'fonoa':
        return FiUsers;
      case 'myprio':
        return FiActivity;
      default:
        return FiActivity;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'uber':
        return 'Uber';
      case 'bolt':
        return 'Bolt';
      case 'cartrack':
        return 'Cartrack';
      case 'viaverde':
        return 'ViaVerde';
      case 'fonoa':
        return 'FONOA';
      case 'myprio':
        return 'myPrio';
      default:
        return platform;
    }
  };

  const platforms = ['uber', 'bolt', 'cartrack', 'viaverde', 'fonoa', 'myprio'];

  return (
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2}>
              Métricas Detalhadas
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Análise detalhada de performance por plataforma
            </Text>
          </Box>

          {/* Filtros */}
          <Card>
            <CardBody>
              <HStack spacing={4} wrap="wrap">
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  maxW="200px"
                >
                  <option value="today">Hoje</option>
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mês</option>
                  <option value="quarter">Últimos 3 Meses</option>
                  <option value="year">Este Ano</option>
                  <option value="custom">Período Personalizado</option>
                </Select>

                <Button
                  onClick={fetchMetrics}
                  isLoading={loading}
                  leftIcon={<FiRefreshCw />}
                >
                  Atualizar
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Resumo Geral */}
          {metrics && (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card>
                <CardBody>
                  <Stat>
                    <HStack justify="space-between" mb={2}>
                      <StatLabel>Receita Total</StatLabel>
                      <Icon as={FiDollarSign} color="green.500" boxSize={5} />
                    </HStack>
                    <StatNumber fontSize="3xl" color="green.600">
                      {formatCurrency(metrics.summary.totalEarnings)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <HStack justify="space-between" mb={2}>
                      <StatLabel>Despesas Totais</StatLabel>
                      <Icon as={FiTrendingDown} color="red.500" boxSize={5} />
                    </HStack>
                    <StatNumber fontSize="3xl" color="red.600">
                      {formatCurrency(metrics.summary.totalExpenses)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <HStack justify="space-between" mb={2}>
                      <StatLabel>Lucro Líquido</StatLabel>
                      <Icon as={FiTrendingUp} color="blue.500" boxSize={5} />
                    </HStack>
                    <StatNumber fontSize="3xl" color="blue.600">
                      {formatCurrency(metrics.summary.netProfit)}
                    </StatNumber>
                    <StatHelpText>
                      Margem: {metrics.summary.totalEarnings ? 
                        ((metrics.summary.netProfit / metrics.summary.totalEarnings) * 100).toFixed(1) : 0}%
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <HStack justify="space-between" mb={2}>
                      <StatLabel>Total de Viagens</StatLabel>
                      <Icon as={FiActivity} color="purple.500" boxSize={5} />
                    </HStack>
                    <StatNumber fontSize="3xl" color="purple.600">
                      {formatNumber(metrics.summary.totalTrips)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}

          {/* Tabs por Plataforma */}
          <Card>
            <CardBody>
              <Tabs>
                <TabList>
                  {platforms.map((platform) => (
                    <Tab key={platform}>
                      <HStack spacing={2}>
                        <Icon as={getPlatformIcon(platform)} />
                        <Text>{getPlatformName(platform)}</Text>
                        {metrics?.platforms[platform] && (
                          <Icon
                            as={metrics.platforms[platform].online ? FiCheckCircle : FiXCircle}
                            color={metrics.platforms[platform].online ? 'green.500' : 'red.500'}
                            boxSize={4}
                          />
                        )}
                      </HStack>
                    </Tab>
                  ))}
                </TabList>

                <TabPanels>
                  {platforms.map((platform) => (
                    <TabPanel key={platform}>
                      <VStack spacing={6} align="stretch">
                        {/* Status da Plataforma */}
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" fontSize="lg">
                              {getPlatformName(platform)}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              Última Sincronização: {metrics?.platforms[platform]?.lastSync ? 
                                new Date(metrics.platforms[platform].lastSync).toLocaleString('pt-PT') : 'N/A'}
                            </Text>
                          </VStack>
                          <HStack spacing={2}>
                            <Badge
                              colorScheme={metrics?.platforms[platform]?.online ? 'green' : 'red'}
                              fontSize="md"
                              px={3}
                              py={1}
                            >
                              {metrics?.platforms[platform]?.online ? 'Online' : 'Offline'}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => testConnection(platform)}
                              isLoading={testingConnection === platform}
                              leftIcon={<FiRefreshCw />}
                            >
                              Testar Conexão
                            </Button>
                          </HStack>
                        </HStack>

                        {/* Dados da Plataforma */}
                        {metrics?.platforms[platform]?.error && (
                          <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <Text>{metrics.platforms[platform].error}</Text>
                          </Alert>
                        )}

                        {metrics?.platforms[platform]?.data && (
                          <Box>
                            <Text fontWeight="bold" mb={4}>
                              Dados Brutos
                            </Text>
                            <Code p={4} borderRadius="md" fontSize="sm" whiteSpace="pre-wrap">
                              {JSON.stringify(metrics.platforms[platform].data, null, 2)}
                            </Code>
                          </Box>
                        )}

                        {!metrics?.platforms[platform]?.data && !metrics?.platforms[platform]?.error && (
                          <Text color="gray.500" textAlign="center" py={8}>
                            Nenhum dado disponível para esta plataforma
                          </Text>
                        )}
                      </VStack>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>

          {/* Loading State */}
          {loading && (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.600">
                Carregando métricas...
              </Text>
            </Box>
          )}
        </VStack>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  return checkAdminAuth(context);
};