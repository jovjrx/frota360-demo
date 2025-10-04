import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Select,
  HStack,
  Button,
  useToast,
  Spinner,
  Text,
  Badge,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { loadTranslations } from '@/lib/translations';
import { PageProps } from '@/interface/Global';
import LoggedInLayout from '@/components/LoggedInLayout';
import { getSession } from '@/lib/session';

interface MetricsSummary {
  totalTrips: number;
  totalEarnings: number;
  totalExpenses: number;
  netProfit: number;
  activeVehicles: number;
  activeDrivers: number;
}

interface UnifiedMetrics {
  period: {
    start: string;
    end: string;
  };
  platforms: Record<string, any>;
  summary: MetricsSummary;
  errors: string[];
}

export default function MetricsPage({ tPage, tCommon, locale }: PageProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<UnifiedMetrics | null>(null);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getPeriodDates = () => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'custom':
        if (customStart && customEnd) {
          return {
            start: customStart,
            end: customEnd,
          };
        }
        return null;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const fetchMetrics = async () => {
    const dates = getPeriodDates();
    if (!dates) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione datas válidas',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/metrics/unified?startDate=${dates.start}&endDate=${dates.end}`
      );
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
        
        if (data.data.errors.length > 0) {
          toast({
            title: 'Aviso',
            description: `Algumas plataformas retornaram erros: ${data.data.errors.length}`,
            status: 'warning',
            duration: 5000,
          });
        }
      } else {
        throw new Error(data.error || data.message);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar métricas',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value);
  };

  return (
    <LoggedInLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              Dashboard de Métricas Unificadas
            </Heading>
            <Text color="gray.600">
              Visualize dados consolidados de todas as plataformas integradas
            </Text>
          </Box>

          {/* Filtros */}
          <Card>
            <CardBody>
              <HStack spacing={4} flexWrap="wrap">
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  maxW="200px"
                >
                  <option value="today">Hoje</option>
                  <option value="week">Última Semana</option>
                  <option value="month">Último Mês</option>
                  <option value="quarter">Último Trimestre</option>
                  <option value="year">Último Ano</option>
                  <option value="custom">Personalizado</option>
                </Select>

                {period === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                    />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                    />
                  </>
                )}

                <Button
                  colorScheme="green"
                  onClick={fetchMetrics}
                  isLoading={loading}
                >
                  Atualizar
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Resumo */}
          {loading && (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" color="green.500" />
              <Text mt={4} color="gray.600">
                Carregando métricas...
              </Text>
            </Box>
          )}

          {!loading && metrics && (
            <>
              {/* Erros */}
              {metrics.errors.length > 0 && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Algumas plataformas retornaram erros:</Text>
                    {metrics.errors.map((error, i) => (
                      <Text key={i} fontSize="sm">{error}</Text>
                    ))}
                  </Box>
                </Alert>
              )}

              {/* Cards de Resumo */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Total de Viagens</StatLabel>
                      <StatNumber>{formatNumber(metrics.summary.totalTrips)}</StatNumber>
                      <StatHelpText>
                        {metrics.period.start} - {metrics.period.end}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Ganhos Totais</StatLabel>
                      <StatNumber color="green.500">
                        {formatCurrency(metrics.summary.totalEarnings)}
                      </StatNumber>
                      <StatHelpText>
                        {metrics.period.start} - {metrics.period.end}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Despesas Totais</StatLabel>
                      <StatNumber color="red.500">
                        {formatCurrency(metrics.summary.totalExpenses)}
                      </StatNumber>
                      <StatHelpText>
                        {metrics.period.start} - {metrics.period.end}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Lucro Líquido</StatLabel>
                      <StatNumber color={metrics.summary.netProfit >= 0 ? 'green.500' : 'red.500'}>
                        {formatCurrency(metrics.summary.netProfit)}
                      </StatNumber>
                      <StatHelpText>
                        {metrics.period.start} - {metrics.period.end}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Veículos Ativos</StatLabel>
                      <StatNumber>{formatNumber(metrics.summary.activeVehicles)}</StatNumber>
                      <StatHelpText>Em operação</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Motoristas Ativos</StatLabel>
                      <StatNumber>{formatNumber(metrics.summary.activeDrivers)}</StatNumber>
                      <StatHelpText>Em operação</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Detalhes por Plataforma */}
              <Card>
                <CardHeader>
                  <Heading size="md">Detalhes por Plataforma</Heading>
                </CardHeader>
                <CardBody>
                  <Tabs colorScheme="green">
                    <TabList>
                      {Object.keys(metrics.platforms).map((platform) => (
                        <Tab key={platform}>
                          {platform.toUpperCase()}
                          <Badge ml={2} colorScheme="green">
                            {metrics.platforms[platform] ? '✓' : '✗'}
                          </Badge>
                        </Tab>
                      ))}
                    </TabList>

                    <TabPanels>
                      {Object.entries(metrics.platforms).map(([platform, data]) => (
                        <TabPanel key={platform}>
                          {data ? (
                            <Box>
                              <pre style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
                                {JSON.stringify(data, null, 2)}
                              </pre>
                            </Box>
                          ) : (
                            <Alert status="error">
                              <AlertIcon />
                              Sem dados disponíveis para {platform}
                            </Alert>
                          )}
                        </TabPanel>
                      ))}
                    </TabPanels>
                  </Tabs>
                </CardBody>
              </Card>
            </>
          )}
        </VStack>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getSession(context.req, context.res);

    if (!session?.user || session.user.role !== 'admin') {
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
    const { common, admin: page } = translations;

    return {
      props: {
        translations: { common, page },
        locale,
      },
    };
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {
      props: {
        translations: { common: {}, page: {} },
        locale: 'pt',
      },
    };
  }
};
