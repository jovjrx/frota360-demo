/**
 * Admin Dashboard - Página Principal
 * 
 * Usa withAdminSSR para:
 * - Autenticação e autorização
 * - Carregamento de traduções via SSR
 * - Carregamento de dados iniciais via SSR
 * - SWR com fallback para atualizações em tempo real
 */

import { useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FiRefreshCw, FiDollarSign, FiTruck, FiUsers, FiFileText } from 'react-icons/fi';
import useSWR from 'swr';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { getDashboardStats, getDrivers, getRequests } from '@/lib/admin/adminQueries';

interface DashboardData {
  stats: {
    totalDrivers: number;
    activeDrivers: number;
    pendingRequests: number;
    totalEarningsThisWeek: number;
  };
  recentDrivers: any[];
  recentRequests: any[];
}

interface AdminDashboardProps extends AdminPageProps {
  initialData: DashboardData;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminDashboard({ user, locale, initialData, tCommon, tPage }: AdminDashboardProps) {
  const toast = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const makeSafeT = (fn?: (key: string) => any) => (key: string, fallback?: string) => {
    if (!fn) return fallback ?? key;
    const value = fn(key);
    if (typeof value === 'string') return value;
    return fallback ?? key;
  };

  const t = makeSafeT(tPage);
  const tc = makeSafeT(tCommon);

  const subtitleTemplate = t('dashboard.welcome', 'Bem-vindo, {{name}}');
  const subtitle = subtitleTemplate.replace('{{name}}', user.displayName || user.email || '');

  // SWR com fallback dos dados SSR
  const { data, mutate } = useSWR<DashboardData>(
    '/api/admin/dashboard/stats',
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 30000, // Atualizar a cada 30s
      revalidateOnFocus: true,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      toast({
        title: t('dashboard.toasts.refreshSuccess', tc('messages.success')),
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: t('dashboard.toasts.refreshError', tc('errors.title')),
        description: tc('errors.tryAgain'),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    const intlLocale = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'pt-PT';
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'green',
      inactive: 'gray',
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status] || 'gray';
  };

  return (
    <AdminLayout
      title={t('dashboard.title', 'Dashboard')}
      subtitle={subtitle}
      side={
        <Button
          leftIcon={<FiRefreshCw />}
          onClick={handleRefresh}
          isLoading={isRefreshing}
          colorScheme="blue"
          size="sm"
        >
          {t('dashboard.actions.refresh', 'Atualizar')}
        </Button>
      }
      breadcrumbs={[
        { label: t('dashboard.title', 'Dashboard') }
      ]}
    >
      <VStack spacing={8} align="stretch">
        {/* KPIs */}
        <Box>
          <Heading size="md" mb={4}>{t('dashboard.sections.overview', t('dashboard.kpiTitle', 'Visão Geral'))}</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiUsers} />
                      <Text>{t('dashboard.totalDrivers', 'Total de Motoristas')}</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{data?.stats?.totalDrivers || 0}</StatNumber>
                  <StatHelpText>
                    {t('dashboard.helpers.activeCount', '{{count}} ativos').replace(
                      '{{count}}',
                      String(data?.stats?.activeDrivers || 0)
                    )}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiTruck} />
                      <Text>{t('dashboard.activeDrivers', 'Motoristas Ativos')}</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{data?.stats?.activeDrivers || 0}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {t('dashboard.helpers.operational', 'Em operação')}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiFileText} />
                      <Text>{t('dashboard.pendingRequests', 'Solicitações Pendentes')}</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{data?.stats?.pendingRequests || 0}</StatNumber>
                  <StatHelpText>{t('dashboard.helpers.awaitingReview', 'Aguardando análise')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiDollarSign} />
                      <Text>{t('dashboard.weeklyEarnings', 'Ganhos Esta Semana')}</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>
                    {formatCurrency(data?.stats?.totalEarningsThisWeek || 0)}
                  </StatNumber>
                  <StatHelpText>{t('dashboard.helpers.currentWeek', 'Semana atual')}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Motoristas Recentes */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>{t('dashboard.sections.recentDrivers', 'Motoristas Recentes')}</Heading>
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>{tc('user.name')}</Th>
                    <Th>{tc('user.email')}</Th>
                    <Th>{t('dashboard.tables.drivers.type', 'Tipo')}</Th>
                    <Th>{t('dashboard.tables.drivers.status', 'Status')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data?.recentDrivers?.map((driver) => (
                    <Tr key={driver.id}>
                      <Td>{driver.fullName}</Td>
                      <Td>{driver.email}</Td>
                      <Td>
                        <Badge colorScheme={driver.type === 'renter' ? 'purple' : 'blue'}>
                          {driver.type === 'renter'
                            ? t('drivers.type.renter', 'Locatário')
                            : t('drivers.type.affiliate', 'Afiliado')}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(driver.status)}>
                          {driver.status === 'active'
                            ? tc('status.active')
                            : tc('status.inactive')}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* Solicitações Recentes */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>{t('dashboard.sections.recentRequests', 'Solicitações Recentes')}</Heading>
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>{tc('user.name')}</Th>
                    <Th>{tc('user.email')}</Th>
                    <Th>{t('dashboard.tables.requests.type', 'Tipo')}</Th>
                    <Th>{t('dashboard.tables.requests.status', 'Status')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data?.recentRequests?.map((request) => (
                    <Tr key={request.id}>
                      <Td>{request.fullName}</Td>
                      <Td>{request.email}</Td>
                      <Td>
                        <Badge colorScheme={request.type === 'renter' ? 'purple' : 'blue'}>
                          {request.type === 'renter'
                            ? t('drivers.type.renter', 'Locatário')
                            : t('drivers.type.affiliate', 'Afiliado')}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(request.status)}>
                          {request.status === 'pending'
                            ? tc('status.pending')
                            : request.status === 'approved'
                              ? tc('status.approved')
                              : request.status === 'rejected'
                                ? tc('status.rejected')
                                : request.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Carregar dados iniciais
  const [stats, recentDrivers, recentRequests] = await Promise.all([
    getDashboardStats(),
    getDrivers({ limit: 5 }),
    getRequests({ limit: 5 }),
  ]);

  return {
    initialData: {
      stats,
      recentDrivers,
      recentRequests,
    },
  };
});
