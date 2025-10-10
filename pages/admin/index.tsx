/**
 * Admin Dashboard - Página Principal
 * 
 * Usa withAdminSSR para:
 * - Autenticação e autorização
 * - Carregamento de traduções via SSR
 * - Carregamento de dados iniciais via SSR
 * - SWR com fallback para atualizações em tempo real
 */

import { useMemo, useState } from 'react';
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
import { FiRefreshCw, FiDollarSign, FiTruck, FiUsers, FiFileText, FiClock, FiCheckCircle } from 'react-icons/fi';
import useSWR from 'swr';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getDashboardStats, getDrivers, getRequests } from '@/lib/admin/adminQueries';

interface DashboardData {
  stats: {
    totalDrivers: number;
    activeDrivers: number;
    pendingRequests: number;
    totalEarningsThisWeek: number;
    totalGrossEarningsThisWeek: number; // Ganhos brutos da semana
    totalPaymentsPending: number;
    totalPaymentsPaid: number;
    averageEarningsPerDriver: number;
  };
  recentDrivers: any[];
  recentRequests: any[];
}

interface AdminDashboardProps extends AdminPageProps {
  initialData: DashboardData;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminDashboard({ user, locale, initialData, tCommon, tPage, translations }: AdminDashboardProps) {
  const toast = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);

  const subtitleTemplate = t('dashboard.welcome', 'Bem-vindo, {{name}}');
  const subtitle = subtitleTemplate.replace('{{name}}', user.displayName || user.email || '');

  const { data: apiData, mutate } = useSWR<{ success: boolean; data: DashboardData }>(
    '/api/admin/dashboard/stats',
    fetcher,
    {
      fallbackData: { success: true, data: initialData },
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const data = apiData?.data || initialData;

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
      translations={translations}
    >

      {/* 3 Blocos Financeiros Principais + Lucro */}
      <Box>
        {/* Primeira linha - 3 blocos */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          {/* Ganhos Brutos (Total que entrou) */}
          <Card bg="purple.50" borderColor="purple.200" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <Icon as={FiTruck} color="purple.600" />
                    <Text fontSize="sm" color="purple.700">{t('dashboard.grossEarnings', 'Ganhos')}</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="purple.600" fontSize="2xl">
                  {formatCurrency(data?.stats?.totalGrossEarningsThisWeek || 0)}
                </StatNumber>
                <StatHelpText color="purple.500" fontSize="xs">
                  {t('dashboard.helpers.grossEarnings', 'Total entrou')}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Pagamentos Pendentes (A Pagar) */}
          <Card bg="orange.50" borderColor="orange.200" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <Icon as={FiClock} color="orange.600" />
                    <Text fontSize="sm" color="orange.700">{t('dashboard.paymentsPending', 'A Pagar')}</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="orange.600" fontSize="2xl">
                  {formatCurrency(data?.stats?.totalPaymentsPending || 0)}
                </StatNumber>
                <StatHelpText color="orange.500" fontSize="xs">
                  {t('dashboard.helpers.awaitingPayment', 'Pendente')}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Pagamentos Realizados (Pagos) */}
          <Card bg="green.50" borderColor="green.200" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <Icon as={FiCheckCircle} color="green.600" />
                    <Text fontSize="sm" color="green.700">{t('dashboard.paymentsPaid', 'Pagos')}</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="green.600" fontSize="2xl">
                  {formatCurrency(data?.stats?.totalPaymentsPaid || 0)}
                </StatNumber>
                <StatHelpText color="green.500" fontSize="xs">
                  {t('dashboard.helpers.totalPaid', 'Total realizado')}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Segunda linha - Lucro Semanal (destaque) */}
        <Card bg="blue.50" borderColor="blue.200" borderWidth="2px">
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack spacing={2}>
                  <Icon as={FiDollarSign} color="blue.600" boxSize={5} />
                  <Text fontSize="md" fontWeight="bold" color="blue.700">
                    {t('dashboard.weeklyProfit', 'Lucro Semanal')}
                  </Text>
                </HStack>
              </StatLabel>
              <StatNumber color="blue.600" fontSize="3xl" mt={2}>
                {formatCurrency(data?.stats?.totalEarningsThisWeek || 0)}
              </StatNumber>
              <StatHelpText color="blue.600" fontSize="sm" mt={1}>
                {t('dashboard.helpers.weeklyProfitDetail', 'Comissões + Aluguéis + Descontos aplicados')}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Box>

      {/* Estatísticas Secundárias */}
      <Box mt={4}>
        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
          {/* Solicitações Pendentes */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <Icon as={FiFileText} />
                    <Text fontSize="sm">{t('dashboard.pendingRequests', 'Solicitações')}</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data?.stats?.pendingRequests || 0}</StatNumber>
                <StatHelpText fontSize="xs">
                  {t('dashboard.helpers.awaitingReview', 'Aguardando análise')}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Total de Motoristas */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <Icon as={FiUsers} />
                    <Text fontSize="sm">{t('dashboard.totalDrivers', 'Motoristas')}</Text>
                  </HStack>
                </StatLabel>
                <StatNumber>{data?.stats?.totalDrivers || 0}</StatNumber>
                <StatHelpText fontSize="xs">
                  {t('dashboard.helpers.activeCount', '{{count}} ativos').replace(
                    '{{count}}',
                    String(data?.stats?.activeDrivers || 0)
                  )}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Média por Motorista */}
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <Icon as={FiUsers} />
                    <Text fontSize="sm">{t('dashboard.averageEarnings', 'Média/Motorista')}</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="lg">
                  {formatCurrency(data?.stats?.averageEarningsPerDriver || 0)}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {t('dashboard.helpers.weeklyAverage', 'Média paga')}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>

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
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
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
