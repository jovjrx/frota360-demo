import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import { store } from '@/lib/store';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Button,
  Avatar,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiFileText, 
  FiSettings, 
  FiBell,
  FiUser,
  FiCreditCard,
  FiUpload,
  FiCalendar,
  FiMapPin,
  FiClock
} from 'react-icons/fi';
import Link from 'next/link';
import { loadTranslations } from '@/lib/translations';

interface DriverDashboardProps {
  driver: any;
  stats: {
    totalEarnings: number;
    monthlyEarnings: number;
    totalTrips: number;
    averageRating: number;
    completionRate: number;
  };
  subscription: any;
  recentPayments: any[];
  recentTrips: any[];
  notifications: any[];
  tCommon: any;
  tDriver: any;
}

export default function DriverDashboard({ 
  driver, 
  stats, 
  subscription, 
  recentPayments, 
  recentTrips, 
  notifications,
  tCommon,
  tDriver 
}: DriverDashboardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  return (
    <>
      <Head>
        <title>{tDriver('dashboard.title')} - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <HStack spacing={4}>
                <Avatar 
                  size="md" 
                  name={driver?.name || 'Motorista'} 
                  src={driver?.avatar}
                />
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {tDriver('dashboard.welcome')}, {driver?.name || 'Motorista'}!
                  </Text>
                  <HStack>
                    <Badge colorScheme={getStatusColor(driver?.status)}>
                      {getStatusText(driver?.status)}
                    </Badge>
                    {subscription && (
                      <Badge colorScheme="purple">
                        {subscription.plan?.name || 'Plano Ativo'}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              </HStack>
              <HStack spacing={4}>
                <Button leftIcon={<FiBell />} variant="outline" size="sm">
                  {tCommon('notifications')} ({notifications.length})
                </Button>
                <Button leftIcon={<FiSettings />} variant="outline" size="sm">
                  {tCommon('settings')}
                </Button>
              </HStack>
            </HStack>
          </Box>
        </Box>

        {/* Status Alerts */}
        {driver?.status === 'pending' && (
          <Box maxW="7xl" mx="auto" px={4} pt={4}>
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>{tDriver('dashboard.accountPending')}</AlertTitle>
                <AlertDescription>
                  Sua documentação está sendo analisada. Você receberá uma notificação quando for aprovado.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        )}

        {driver?.status === 'suspended' && (
          <Box maxW="7xl" mx="auto" px={4} pt={4}>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>{tDriver('dashboard.accountSuspended')}</AlertTitle>
                <AlertDescription>
                  Entre em contato com o suporte para mais informações.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Main Content */}
        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={8} align="stretch">
            {/* Stats Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>{tDriver('dashboard.totalEarnings')}</StatLabel>
                    <StatNumber>€{stats.totalEarnings.toFixed(2)}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      €{stats.monthlyEarnings.toFixed(2)} este mês
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>{tDriver('dashboard.totalTrips')}</StatLabel>
                    <StatNumber>{stats.totalTrips}</StatNumber>
                    <StatHelpText>
                      Taxa de conclusão: {stats.completionRate}%
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Avaliação Média</StatLabel>
                    <StatNumber>{stats.averageRating.toFixed(1)}</StatNumber>
                    <StatHelpText>
                      ⭐ Baseado em {stats.totalTrips} corridas
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>{tDriver('dashboard.subscription')}</StatLabel>
                    <StatNumber fontSize="lg">
                      {subscription?.plan?.name || 'Sem plano'}
                    </StatNumber>
                    <StatHelpText>
                      {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Quick Actions */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Heading size="md" mb={4}>{tDriver('dashboard.quickActions')}</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  <Link href="/drivers/subscription" passHref>
                    <Button as="a" leftIcon={<FiCreditCard />} colorScheme="purple" variant="outline" w="full">
                      {tDriver('dashboard.manageSubscription')}
                    </Button>
                  </Link>
                  <Link href="/drivers/profile" passHref>
                    <Button as="a" leftIcon={<FiUser />} colorScheme="blue" variant="outline" w="full">
                      {tDriver('dashboard.myProfile')}
                    </Button>
                  </Link>
                  <Link href="/drivers/documents" passHref>
                    <Button as="a" leftIcon={<FiUpload />} colorScheme="green" variant="outline" w="full">
                      {tDriver('dashboard.documents')}
                    </Button>
                  </Link>
                  <Link href="/drivers/earnings" passHref>
                    <Button as="a" leftIcon={<FiDollarSign />} colorScheme="orange" variant="outline" w="full">
                      Ganhos Detalhados
                    </Button>
                  </Link>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Recent Payments */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>{tDriver('dashboard.recentPayments')}</Heading>
                  <VStack spacing={3} align="stretch">
                    {recentPayments.length > 0 ? (
                      recentPayments.map((payment) => (
                        <HStack key={payment.id} justifyContent="space-between" p={3} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">
                              {new Date(payment.periodStart).toLocaleDateString('pt-BR')} - {new Date(payment.periodEnd).toLocaleDateString('pt-BR')}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                            </Text>
                          </VStack>
                          <VStack align="flex-end" spacing={0}>
                            <Text fontWeight="bold" color="green.600">
                              €{(payment.netCents / 100).toFixed(2)}
                            </Text>
                            <Badge colorScheme={payment.status === 'paid' ? 'green' : 'yellow'}>
                              {payment.status}
                            </Badge>
                          </VStack>
                        </HStack>
                      ))
                    ) : (
                      <Text color="gray.500" textAlign="center" py={4}>
                        {tDriver('dashboard.noPayments')}
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Recent Trips */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>{tDriver('dashboard.recentTrips')}</Heading>
                  <VStack spacing={3} align="stretch">
                    {recentTrips.length > 0 ? (
                      recentTrips.map((trip, index) => (
                        <HStack key={index} justifyContent="space-between" p={3} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <HStack>
                              <Icon as={FiMapPin} color="gray.500" />
                              <Text fontWeight="medium" fontSize="sm">
                                {trip.startLocation} → {trip.endLocation}
                              </Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiClock} color="gray.500" />
                              <Text fontSize="sm" color="gray.500">
                                {new Date(trip.date).toLocaleDateString('pt-BR')}
                              </Text>
                            </HStack>
                          </VStack>
                          <VStack align="flex-end" spacing={0}>
                            <Text fontWeight="bold" color="green.600">
                              €{trip.earnings.toFixed(2)}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              ⭐ {trip.rating}
                            </Text>
                          </VStack>
                        </HStack>
                      ))
                    ) : (
                      <Text color="gray.500" textAlign="center" py={4}>
                        {tDriver('dashboard.noTrips')}
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Subscription Status */}
            {subscription && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>{tDriver('dashboard.subscriptionStatus')}</Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <VStack align="flex-start">
                      <Text fontSize="sm" color="gray.500">{tDriver('dashboard.activePlan')}</Text>
                      <Text fontSize="lg" fontWeight="bold">{subscription.plan?.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        €{(subscription.plan?.price / 100).toFixed(2)}/{subscription.plan?.interval === 'month' ? 'mês' : 'ano'}
                      </Text>
                    </VStack>
                    <VStack align="flex-start">
                      <Text fontSize="sm" color="gray.500">{tDriver('dashboard.nextBilling')}</Text>
                      <Text fontSize="lg" fontWeight="bold">
                        {subscription.nextBilling ? new Date(subscription.nextBilling).toLocaleDateString('pt-BR') : 'N/A'}
                      </Text>
                      <Badge colorScheme={subscription.status === 'active' ? 'green' : 'red'}>
                        {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </VStack>
                    <VStack align="flex-start">
                      <Text fontSize="sm" color="gray.500">Progresso do Período</Text>
                      <Progress value={65} colorScheme="purple" size="lg" w="full" />
                      <Text fontSize="sm" color="gray.600">
                        15 de 30 dias utilizados
                      </Text>
                    </VStack>
                  </SimpleGrid>
                </CardBody>
              </Card>
            )}
          </VStack>
        </Box>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Simulate user authentication check
    const userType = context.req.cookies['user-type'];
    const authToken = context.req.cookies['auth-token'];
    
    if (!authToken || userType !== 'driver') {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
    
    // Load translations
    const translations = await loadTranslations(context.locale || 'pt', ['common', 'driver']);

    // Mock driver data for demonstration
    const driver = {
      id: 'demo-driver-1',
      name: 'João Silva',
      email: 'motorista@conduz.pt',
      status: 'approved',
      avatar: null
    };
    
    // Get driver stats (mock data for now)
    const stats = {
      totalEarnings: 2450.75,
      monthlyEarnings: 680.25,
      totalTrips: 156,
      averageRating: 4.8,
      completionRate: 95
    };

    // Mock subscription data
    const subscription = {
      id: 'sub-1',
      planName: 'Plano Básico',
      status: 'active',
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 29.99
    };

    // Mock recent payments
    const recentPayments = [
      {
        id: 'pay-1',
        amount: 450.25,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'paid'
      },
      {
        id: 'pay-2',
        amount: 380.50,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'paid'
      }
    ];

    // Mock recent trips data
    const recentTrips = [
      {
        id: 'trip-1',
        startLocation: 'Lisboa Centro',
        endLocation: 'Aeroporto',
        date: new Date().toISOString(),
        earnings: 25.50,
        rating: 5.0
      },
      {
        id: 'trip-2',
        startLocation: 'Cascais',
        endLocation: 'Sintra',
        date: new Date(Date.now() - 86400000).toISOString(),
        earnings: 18.75,
        rating: 4.8
      }
    ];

    // Mock notifications
    const notifications = [
      { id: 1, message: 'Novo pagamento processado', read: false },
      { id: 2, message: 'Documento aprovado', read: true }
    ];

    return {
      props: {
        driver,
        stats,
        subscription,
        recentPayments,
        recentTrips,
        notifications,
        translations,
      },
    };
  } catch (error) {
    console.error('Error loading driver dashboard:', error);
    return {
      props: {
        driver: null,
        stats: {
          totalEarnings: 0,
          monthlyEarnings: 0,
          totalTrips: 0,
          averageRating: 0,
          completionRate: 0
        },
        subscription: null,
        recentPayments: [],
        recentTrips: [],
        notifications: [],
        translations: {},
      },
    };
  }
};

