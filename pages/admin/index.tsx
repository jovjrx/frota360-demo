import { useState, useEffect } from 'react';
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
  FiEdit
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import { PageProps } from '@/interface/Global';
import LoggedInLayout from '@/components/LoggedInLayout';
import { getSession } from '@/lib/session';

export default function AdminDashboard({ tPage, tCommon, locale }: PageProps) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // Buscar métricas do último mês
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    fetch(`/api/admin/metrics/unified?startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.data);
        }
      })
      .catch(console.error);
  }, []);

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
              Dashboard de Gestão TVDE
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Visão geral do negócio - Últimos 30 dias
            </Text>
          </Box>

          {/* KPIs Principais */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {/* Receita Total */}
            <Card>
              <CardBody>
                <Stat>
                  <HStack justify="space-between" mb={2}>
                    <StatLabel>Receita Total</StatLabel>
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
                    <StatLabel>Despesas Totais</StatLabel>
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
                    <StatLabel>Lucro Líquido</StatLabel>
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
                    <StatLabel>Total de Viagens</StatLabel>
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
                  <Heading size="md">Frota Ativa</Heading>
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
                  <Heading size="md">Motoristas Ativos</Heading>
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
                      <Text fontSize="sm" color="gray.600">Afiliados</Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {Math.floor((metrics?.summary?.activeDrivers || 0) * 0.6)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Locatários</Text>
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
              <Heading size="md">Status das Integrações</Heading>
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
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Button
              as={NextLink}
              href="/admin/requests"
              size="lg"
              colorScheme="green"
              leftIcon={<Icon as={FiUsers} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>Gestão de Solicitações</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Ver candidaturas pendentes
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
                <Text>Métricas Detalhadas</Text>
                <Text fontSize="sm" fontWeight="normal">
                  Análise completa por plataforma
                </Text>
              </VStack>
            </Button>

            <Button
              as={NextLink}
              href="/admin/content"
              size="lg"
              colorScheme="purple"
              leftIcon={<Icon as={FiEdit} />}
              height="80px"
            >
              <VStack spacing={0}>
                <Text>Gestão de Conteúdo</Text>
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
                <Text fontWeight="bold">Atenção: Problemas nas Integrações</Text>
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
