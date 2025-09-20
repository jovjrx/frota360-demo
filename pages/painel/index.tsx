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
  useToast,
  Card,
  CardBody,
  Heading,
  Alert,
  AlertIcon,
  IconButton,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import { FiDollarSign, FiTrendingUp, FiFileText, FiUser, FiSettings, FiRefreshCw, FiCalendar, FiUpload } from 'react-icons/fi';

import LoggedInLayout from '@/components/LoggedInLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { withDriver } from '@/lib/auth/withDriver';
import { dashboardAPI, DriverData, DriverStatus } from '@/lib/api/dashboard';

interface PainelPageProps {
  user: any;
}

function PainelPage({ user }: PainelPageProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [data, setData] = useState<DriverData | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [driverData, status] = await Promise.all([
        dashboardAPI.getDriverData(user.uid),
        dashboardAPI.checkDriverStatus(user.uid),
      ]);
      
      setData(driverData);
      setDriverStatus(status);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do painel',
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
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: 'Dados atualizados',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <LoggedInLayout title="Painel do Motorista" subtitle="Carregando seus dados...">
        <LoadingSpinner message="Carregando seus dados..." />
      </LoggedInLayout>
    );
  }

  // Se o motorista não está ativo, mostra alerta
  if (driverStatus && !driverStatus.active) {
    return (
      <LoggedInLayout title="Conta Desabilitada">
        <VStack spacing={6} align="center" py={20}>
          <Badge colorScheme="red" size="lg" px={4} py={2}>
            Conta Desabilitada
          </Badge>
          <Alert status="warning" maxW="md">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Sua conta está temporariamente desabilitada.</Text>
              <Text fontSize="sm">
                Entre em contacto com o suporte para mais informações sobre o status da sua conta.
              </Text>
            </VStack>
          </Alert>
          <Button 
            colorScheme="blue" 
            onClick={() => window.location.href = 'mailto:suporte@conduz.pt'}
          >
            Contactar Suporte
          </Button>
        </VStack>
      </LoggedInLayout>
    );
  }

  const statsCards = [
    {
      title: 'Ganhos Semanais',
      value: `€ ${data?.weeklyEarnings || 0}`,
      icon: FiDollarSign,
      color: 'green',
      trend: { value: 12, isPositive: true },
      description: 'Esta semana',
    },
    {
      title: 'Ganhos Mensais',
      value: `€ ${data?.monthlyEarnings || 0}`,
      icon: FiTrendingUp,
      color: 'blue',
      trend: { value: 8, isPositive: true },
      description: 'Este mês',
    },
    {
      title: 'Documentos',
      value: data?.documents?.length || 0,
      icon: FiFileText,
      color: 'purple',
      description: 'Enviados',
    },
    {
      title: 'Status da Conta',
      value: driverStatus?.active ? 'Ativa' : 'Inativa',
      icon: FiUser,
      color: driverStatus?.active ? 'green' : 'red',
      description: 'Sua conta',
    },
  ];

  const documentColumns = [
    {
      key: 'type',
      label: 'Tipo',
      render: (value: string) => (
        <Badge colorScheme="blue" variant="subtle">
          {value}
        </Badge>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, row: any) => (
        <Text
          as="a"
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          color="blue.500"
          _hover={{ textDecoration: 'underline' }}
        >
          {value}
        </Text>
      ),
    },
    {
      key: 'uploadedAt',
      label: 'Data de Upload',
      render: (value: number) => (
        <Text fontSize="sm" color="gray.600">
          {new Date(value).toLocaleDateString('pt-PT')}
        </Text>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Painel do Motorista - Conduz.pt</title>
        <meta name="description" content="Painel do motorista - Gerencie seus ganhos e documentos" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <LoggedInLayout 
        title="Painel do Motorista"
        subtitle="Gerencie seus ganhos e documentos"
        breadcrumbs={[
          { label: 'Painel', href: '/painel' }
        ]}
      >
        <VStack spacing={8} align="stretch">
          {/* Status da Conta */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="medium" color="gray.700">
                Status da Conta
              </Text>
              <Text fontSize="sm" color="gray.500">
                Bem-vindo, {user?.displayName || user?.email}
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
              <Badge colorScheme="green" size="lg" px={3} py={1}>
                ✓ Conta Ativa
              </Badge>
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

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {/* Documentos */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="gray.800">
                      Seus Documentos
                    </Heading>
                    <Button
                      leftIcon={<FiUpload />}
                      onClick={() => router.push('/painel/documents')}
                      size="sm"
                      variant="outline"
                    >
                      Enviar
                    </Button>
                  </HStack>
                  
                  {data?.documents && data.documents.length > 0 ? (
                    <DataTable
                      columns={documentColumns}
                      data={data.documents}
                      emptyMessage="Nenhum documento enviado ainda"
                    />
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Nenhum documento enviado</Text>
                        <Text fontSize="sm">
                          Envie seus documentos para completar o cadastro.
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
                  <VStack spacing={3} align="stretch">
                    <Button
                      leftIcon={<FiUser />}
                      variant="outline"
                      onClick={() => router.push('/painel/settings')}
                      justifyContent="flex-start"
                    >
                      Meu Perfil
                    </Button>
                    <Button
                      leftIcon={<FiFileText />}
                      variant="outline"
                      onClick={() => router.push('/painel/documents')}
                      justifyContent="flex-start"
                    >
                      Documentos
                    </Button>
                    <Button
                      leftIcon={<FiCalendar />}
                      variant="outline"
                      onClick={() => router.push('/painel/subscription')}
                      justifyContent="flex-start"
                    >
                      Minha Assinatura
                    </Button>
                    <Button
                      leftIcon={<FiSettings />}
                      variant="outline"
                      onClick={() => router.push('/painel/settings')}
                      justifyContent="flex-start"
                    >
                      Configurações
                    </Button>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Próximos Passos */}
          {(!data?.documents || data.documents.length === 0) && (
            <Card bg="blue.50" borderColor="blue.200">
              <CardBody>
                <VStack spacing={4} align="start">
                  <Heading size="md" color="blue.800">
                    Próximos Passos
                  </Heading>
                  <Text color="blue.700">
                    Para começar a trabalhar, você precisa enviar alguns documentos obrigatórios.
                  </Text>
                  <Button
                    colorScheme="blue"
                    onClick={() => router.push('/painel/documents')}
                    leftIcon={<FiUpload />}
                  >
                    Enviar Documentos
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </LoggedInLayout>
    </>
  );
}

export default withDriver(PainelPage);