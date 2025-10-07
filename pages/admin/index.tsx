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
  Container,
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
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
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

export default function AdminDashboard({ user, translations, locale, initialData }: AdminDashboardProps) {
  const toast = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        title: 'Dados atualizados',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
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
      title="Dashboard"
      subtitle={`Bem-vindo, ${user.displayName || user.email}`}
      side={
        <Button
          leftIcon={<FiRefreshCw />}
          onClick={handleRefresh}
          isLoading={isRefreshing}
          colorScheme="blue"
          size="sm"
        >
          Atualizar
        </Button>
      }
      breadcrumbs={[
        { label: 'Dashboard' }
      ]}
    >
      <VStack spacing={8} align="stretch">
        {/* KPIs */}
        <Box>
          <Heading size="md" mb={4}>Visão Geral</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiUsers} />
                      <Text>Total de Motoristas</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{data?.stats?.totalDrivers || 0}</StatNumber>
                  <StatHelpText>
                    {data?.stats?.activeDrivers || 0} ativos
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
                      <Text>Motoristas Ativos</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{data?.stats?.activeDrivers || 0}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Em operação
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
                      <Text>Solicitações Pendentes</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{data?.stats?.pendingRequests || 0}</StatNumber>
                  <StatHelpText>Aguardando análise</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <Icon as={FiDollarSign} />
                      <Text>Ganhos Esta Semana</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>
                    {formatCurrency(data?.stats?.totalEarningsThisWeek || 0)}
                  </StatNumber>
                  <StatHelpText>Semana atual</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Motoristas Recentes */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>Motoristas Recentes</Heading>
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Email</Th>
                    <Th>Tipo</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data?.recentDrivers?.map((driver) => (
                    <Tr key={driver.id}>
                      <Td>{driver.fullName}</Td>
                      <Td>{driver.email}</Td>
                      <Td>
                        <Badge colorScheme={driver.type === 'renter' ? 'purple' : 'blue'}>
                          {driver.type === 'renter' ? 'Locatário' : 'Afiliado'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(driver.status)}>
                          {driver.status === 'active' ? 'Ativo' : 'Inativo'}
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
            <Heading size="sm" mb={4}>Solicitações Recentes</Heading>
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Email</Th>
                    <Th>Tipo</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data?.recentRequests?.map((request) => (
                    <Tr key={request.id}>
                      <Td>{request.fullName}</Td>
                      <Td>{request.email}</Td>
                      <Td>
                        <Badge colorScheme={request.type === 'renter' ? 'purple' : 'blue'}>
                          {request.type === 'renter' ? 'Locatário' : 'Afiliado'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(request.status)}>
                          {request.status === 'pending' ? 'Pendente' :
                           request.status === 'approved' ? 'Aprovado' :
                           request.status === 'rejected' ? 'Rejeitado' : request.status}
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
