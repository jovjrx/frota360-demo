/**
 * Admin Dashboard - Página Principal
 * 
 * Usa withAdminSSR para:
 * - Autenticação e autorização
 * - Carregamento de traduções via SSR
 * - Carregamento de dados iniciais via SSR
 * - SWR com fallback para atualizações em tempo real
 */

import { useMemo } from 'react';
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
} from '@chakra-ui/react';
import { FiDollarSign, FiTruck, FiUsers, FiFileText, FiClock, FiCheckCircle } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getDashboardStats, getDrivers, getRequests } from '@/lib/admin/adminQueries';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';

interface DashboardData {
  stats: {
    totalDrivers: number;
    activeDrivers: number;
    pendingRequests: number;
    totalEarningsThisWeek: number;
    totalGrossEarningsThisWeek: number; // Ganhos brutos da semana
    totalRepasseThisWeek: number; // Repasse total (valor a ser pago aos motoristas)
    totalPaymentsPaid: number;
    averageEarningsPerDriver: number;
    profitCommissions: number;
    profitRentals: number;
    profitDiscounts: number;
    // Dados da semana anterior para comparação
    totalGrossEarningsLastWeek?: number;
    totalRepasseLastWeek?: number;
    totalEarningsLastWeek?: number;
  };
  recentDrivers: any[];
  recentRequests: any[];
}

interface AdminDashboardProps extends AdminPageProps {
  initialData: DashboardData;
}

export default function AdminDashboard({ user, locale, initialData, tCommon, tPage, translations }: AdminDashboardProps) {
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);

  const subtitleTemplate = t('dashboard.welcome', 'Bem-vindo, {{name}}');
  const subtitle = subtitleTemplate.replace('{{name}}', user.displayName || user.email || '');

  const data = initialData;

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
      breadcrumbs={[
        { label: t('dashboard.title', 'Dashboard') }
      ]}
      translations={translations}
    >

      {/* 3 Cards Principais com Comparação */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {/* Entradas Totais */}
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack spacing={2}>
                  <Icon as={FiTruck} color="green.600" />
                  <Text fontSize="sm" color="gray.700">Entradas Totais</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="green.600" fontSize="2xl">
                {formatCurrency(data?.stats?.totalGrossEarningsThisWeek || 0)}
              </StatNumber>
              <StatHelpText fontSize="xs" color="gray.600">
                {data?.stats?.totalGrossEarningsLastWeek && data?.stats?.totalGrossEarningsLastWeek > 0
                  ? (() => {
                    const diff = data.stats.totalGrossEarningsThisWeek - data.stats.totalGrossEarningsLastWeek;
                    const percentChange = ((diff / data.stats.totalGrossEarningsLastWeek) * 100).toFixed(1);
                    const isIncrease = diff >= 0;
                    return `${isIncrease ? '↑' : '↓'} ${Math.abs(Number(percentChange))}% vs semana anterior`;
                  })()
                  : 'Primeira semana com dados'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Repasse Total (valor a ser repassado aos motoristas) */}
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack spacing={2}>
                  <Icon as={FiClock} color="orange.600" />
                  <Text fontSize="sm" color="gray.700">Repasse</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="orange.600" fontSize="2xl">
                {formatCurrency(data?.stats?.totalRepasseThisWeek || 0)}
              </StatNumber>
              <StatHelpText fontSize="xs" color="gray.600">
                {data?.stats?.totalRepasseLastWeek && data?.stats?.totalRepasseLastWeek > 0
                  ? (() => {
                    const diff = data.stats.totalRepasseThisWeek - data.stats.totalRepasseLastWeek;
                    const percentChange = ((diff / data.stats.totalRepasseLastWeek) * 100).toFixed(1);
                    const isIncrease = diff >= 0;
                    return `${isIncrease ? '↑' : '↓'} ${Math.abs(Number(percentChange))}% vs semana anterior`;
                  })()
                  : 'Primeira semana com dados'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Receita (Líquido para empresa) */}
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack spacing={2}>
                  <Icon as={FiDollarSign} color="blue.600" />
                  <Text fontSize="sm" color="gray.700">Receita</Text>
                </HStack>
              </StatLabel>
              <StatNumber color="blue.600" fontSize="2xl">
                {formatCurrency(data?.stats?.totalEarningsThisWeek || 0)}
              </StatNumber>
              <StatHelpText fontSize="xs" color="gray.600">
                {data?.stats?.totalEarningsLastWeek && data?.stats?.totalEarningsLastWeek > 0
                  ? (() => {
                    const diff = data.stats.totalEarningsThisWeek - data.stats.totalEarningsLastWeek;
                    const percentChange = ((diff / data.stats.totalEarningsLastWeek) * 100).toFixed(1);
                    const isIncrease = diff >= 0;
                    return `${isIncrease ? '↑' : '↓'} ${Math.abs(Number(percentChange))}% vs semana anterior`;
                  })()
                  : 'Primeira semana com dados'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>


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
  const cookies = context.req.headers.cookie || '';
  
  const [stats, recentDrivers, recentRequests] = await Promise.all([
    getDashboardStats(cookies),
    getDrivers({ limit: 5 }),
    getRequests({ limit: 5 }),
  ]);

  // Serializar todos os Timestamps de forma centralizada
  const initialData = serializeDatasets({
    stats,
    recentDrivers,
    recentRequests,
  });

  return {
    initialData,
  };
});

