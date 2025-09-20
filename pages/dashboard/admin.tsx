import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  useToast,
  Card,
  CardBody,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Alert,
  AlertIcon,
  IconButton,
} from '@chakra-ui/react';
import { FiUsers, FiDollarSign, FiTrendingUp, FiUserCheck, FiUserX, FiSettings, FiRefreshCw } from 'react-icons/fi';

import LoggedInLayout from '@/components/LoggedInLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { withAdmin } from '@/lib/auth/withAdmin';
import { adminAPI, Driver, AdminStats } from '@/lib/api/admin';

interface AdminPageProps {
  user: any;
}

function AdminPage({ user }: AdminPageProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, driversData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getDrivers(),
      ]);
      
      setStats(statsData);
      setDrivers(driversData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do dashboard',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
    toast({
      title: 'Dados atualizados',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleToggleDriverStatus = async (driverId: string, currentStatus: boolean) => {
    try {
      await adminAPI.toggleDriverStatus(driverId, !currentStatus);
      await loadAdminData(); // Recarregar dados
      toast({
        title: 'Status alterado',
        description: `Motorista ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do motorista',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <LoggedInLayout title="Dashboard Admin" subtitle="Carregando dados...">
        <LoadingSpinner message="Carregando dados administrativos..." />
      </LoggedInLayout>
    );
  }

  const statsCards = [
    {
      title: 'Total de Motoristas',
      value: stats?.totalDrivers || 0,
      icon: FiUsers,
      color: 'blue',
      description: 'Cadastrados',
    },
    {
      title: 'Motoristas Ativos',
      value: stats?.activeDrivers || 0,
      icon: FiUserCheck,
      color: 'green',
      description: 'Em atividade',
    },
    {
      title: 'Ganhos Semanais',
      value: `€ ${stats?.weeklyTotal || 0}`,
      icon: FiDollarSign,
      color: 'green',
      trend: { value: 12, isPositive: true },
      description: 'Esta semana',
    },
    {
      title: 'Ganhos Mensais',
      value: `€ ${stats?.monthlyTotal || 0}`,
      icon: FiTrendingUp,
      color: 'purple',
      trend: { value: 8, isPositive: true },
      description: 'Este mês',
    },
  ];

  const driverColumns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, row: Driver) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="semibold">{value || 'N/A'}</Text>
          <Text fontSize="sm" color="gray.500">{row.email}</Text>
        </VStack>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (value: boolean) => (
        <Badge colorScheme={value ? 'green' : 'red'} variant="subtle">
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'weeklyEarnings',
      label: 'Ganhos Semanais',
      render: (value: number) => (
        <Text fontWeight="medium" color="green.600">
          € {value}
        </Text>
      ),
    },
    {
      key: 'monthlyEarnings',
      label: 'Ganhos Mensais',
      render: (value: number) => (
        <Text fontWeight="medium" color="blue.600">
          € {value}
        </Text>
      ),
    },
  ];

  const driverActions = {
    render: (driver: Driver) => (
      <Button
        leftIcon={<FiUserCheck />}
        size="sm"
        colorScheme="blue"
        variant="outline"
        onClick={() => handleToggleDriverStatus(driver.id, driver.active)}
      >
        {driver.active ? 'Desativar' : 'Ativar'}
      </Button>
    ),
  };

  return (
    <>
      <Head>
        <title>Dashboard Admin - Conduz.pt</title>
        <meta name="description" content="Painel administrativo - Gerencie motoristas e estatísticas" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <LoggedInLayout 
        title="Dashboard Administrativo"
        subtitle="Gerencie motoristas e acompanhe estatísticas"
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' }
        ]}
      >
        <VStack spacing={8} align="stretch">
          {/* Header com ações */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="medium" color="gray.700">
                Visão Geral
              </Text>
              <Text fontSize="sm" color="gray.500">
                Última atualização: {new Date().toLocaleString('pt-PT')}
              </Text>
            </VStack>
            <HStack spacing={3}>
              <IconButton
                icon={<FiRefreshCw />}
                aria-label="Atualizar dados"
                onClick={handleRefresh}
                isLoading={refreshing}
                variant="outline"
                size="sm"
              />
              <Button
                leftIcon={<FiSettings />}
                onClick={() => router.push('/admin/plans')}
                size="sm"
              >
                Gerenciar Planos
              </Button>
            </HStack>
          </HStack>

          {/* Cards de Estatísticas */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {statsCards.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                trend={stat.trend}
                description={stat.description}
              />
            ))}
          </SimpleGrid>

          {/* Lista de Motoristas */}
          <Card>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Heading size="md" color="gray.800">
                      Motoristas Cadastrados
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                      {drivers.length} motoristas encontrados
                    </Text>
                  </VStack>
                  <Button
                    leftIcon={<FiUsers />}
                    onClick={() => router.push('/admin/drivers')}
                    size="sm"
                    variant="outline"
                  >
                    Ver Todos
                  </Button>
                </HStack>

                {drivers.length > 0 ? (
                  <DataTable
                    columns={driverColumns}
                    data={drivers}
                    actions={driverActions}
                    emptyMessage="Nenhum motorista encontrado"
                  />
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Nenhum motorista cadastrado</Text>
                      <Text fontSize="sm">
                        Os motoristas aparecerão aqui quando se cadastrarem no sistema.
                      </Text>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="gray.800">
                  Ações Rápidas
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Button
                    leftIcon={<FiUsers />}
                    variant="outline"
                    onClick={() => router.push('/admin/drivers')}
                    justifyContent="flex-start"
                  >
                    Gerenciar Motoristas
                  </Button>
                  <Button
                    leftIcon={<FiDollarSign />}
                    variant="outline"
                    onClick={() => router.push('/admin/payouts')}
                    justifyContent="flex-start"
                  >
                    Gerenciar Pagamentos
                  </Button>
                  <Button
                    leftIcon={<FiSettings />}
                    variant="outline"
                    onClick={() => router.push('/admin/plans')}
                    justifyContent="flex-start"
                  >
                    Gerenciar Planos
                  </Button>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </LoggedInLayout>
    </>
  );
}

export default withAdmin(AdminPage);