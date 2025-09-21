import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon,
  Flex,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FiTrendingUp, 
  FiTrendingDown,
  FiDollarSign, 
  FiClock,
  FiMapPin,
  FiStar,
  FiCalendar,
  FiDownload,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import DriverLayout from '@/components/layouts/DriverLayout';

interface AnalyticsPageProps {
  driver: any;
  analytics: {
    earnings: {
      total: number;
      monthly: number;
      weekly: number;
      daily: number;
      growth: number;
    };
    trips: {
      total: number;
      completed: number;
      cancelled: number;
      averageRating: number;
      completionRate: number;
    };
    performance: {
      onlineHours: number;
      acceptanceRate: number;
      averageTripDuration: number;
      averageTripDistance: number;
    };
    trends: {
      earningsTrend: 'up' | 'down' | 'stable';
      tripsTrend: 'up' | 'down' | 'stable';
      ratingTrend: 'up' | 'down' | 'stable';
    };
  };
  recentTrips: any[];
  translations: any;
  userData: any;
}

export default function AnalyticsPage({ 
  driver, 
  analytics, 
  recentTrips, 
  translations, 
  userData 
}: AnalyticsPageProps) {
  const tDriver = (key: string) => {
    const keys = key.split('.');
    let value = translations.driver;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <FiTrendingUp color="green" />;
      case 'down':
        return <FiTrendingDown color="red" />;
      default:
        return <FiTrendingUp color="gray" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'green.500';
      case 'down':
        return 'red.500';
      default:
        return 'gray.500';
    }
  };

  return (
    <>
      <Head>
        <title>{`${tDriver('earnings.title')} - Conduz.pt`}</title>
      </Head>
      
      <DriverLayout
        title={tDriver('earnings.title')}
        subtitle="Análise detalhada dos seus ganhos e performance"
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={0}
        breadcrumbs={[
          { label: 'Dashboard', href: '/drivers' },
          { label: 'Relatórios' }
        ]}
        stats={[
          {
            label: 'Ganhos Totais',
            value: `€${analytics.earnings.total.toFixed(2)}`,
            helpText: `€${analytics.earnings.monthly.toFixed(2)} este mês`,
            arrow: analytics.trends.earningsTrend === 'up' ? 'increase' : 'decrease',
            color: getTrendColor(analytics.trends.earningsTrend)
          },
          {
            label: 'Total de Corridas',
            value: analytics.trips.total,
            helpText: `${analytics.trips.completionRate}% concluídas`,
            arrow: analytics.trends.tripsTrend === 'up' ? 'increase' : 'decrease',
            color: getTrendColor(analytics.trends.tripsTrend)
          },
          {
            label: 'Avaliação Média',
            value: analytics.trips.averageRating.toFixed(1),
            helpText: 'Baseada em avaliações',
            arrow: analytics.trends.ratingTrend === 'up' ? 'increase' : 'decrease',
            color: getTrendColor(analytics.trends.ratingTrend)
          },
          {
            label: 'Horas Online',
            value: `${analytics.performance.onlineHours}h`,
            helpText: 'Esta semana',
            color: 'blue.500'
          }
        ]}
        actions={
          <HStack spacing={4}>
            <Select placeholder="Período" size="sm" w="150px">
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 3 meses</option>
            </Select>
            <Button leftIcon={<FiDownload />} variant="outline" size="sm">
              Exportar
            </Button>
            <Button leftIcon={<FiRefreshCw />} variant="outline" size="sm">
              Atualizar
            </Button>
          </HStack>
        }
      >
        {/* Earnings Overview */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Resumo de Ganhos</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
              <Stat>
                <StatLabel>Hoje</StatLabel>
                <StatNumber color="green.500">€{analytics.earnings.daily.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  12% vs ontem
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Esta Semana</StatLabel>
                <StatNumber color="blue.500">€{analytics.earnings.weekly.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  8% vs semana passada
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Este Mês</StatLabel>
                <StatNumber color="purple.500">€{analytics.earnings.monthly.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  15% vs mês passado
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Crescimento</StatLabel>
                <StatNumber color={analytics.earnings.growth >= 0 ? "green.500" : "red.500"}>
                  {analytics.earnings.growth >= 0 ? '+' : ''}{analytics.earnings.growth.toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={analytics.earnings.growth >= 0 ? "increase" : "decrease"} />
                  vs período anterior
                </StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Performance Metrics */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Métricas de Performance</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">Taxa de Aceitação</Text>
                    <Text fontSize="sm" color="gray.600">{analytics.performance.acceptanceRate}%</Text>
                  </HStack>
                  <Progress value={analytics.performance.acceptanceRate} colorScheme="green" size="sm" />
                </Box>
                
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">Taxa de Conclusão</Text>
                    <Text fontSize="sm" color="gray.600">{analytics.trips.completionRate}%</Text>
                  </HStack>
                  <Progress value={analytics.trips.completionRate} colorScheme="blue" size="sm" />
                </Box>

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">Duração Média das Corridas</Text>
                  <Text fontSize="sm" color="gray.600">{analytics.performance.averageTripDuration} min</Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">Distância Média</Text>
                  <Text fontSize="sm" color="gray.600">{analytics.performance.averageTripDistance} km</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Corridas Recentes</Heading>
            </CardHeader>
            <CardBody>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Data</Th>
                    <Th>Origem</Th>
                    <Th>Destino</Th>
                    <Th>Ganho</Th>
                    <Th>Avaliação</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentTrips.map((trip) => (
                    <Tr key={trip.id}>
                      <Td fontSize="sm">{new Date(trip.date).toLocaleDateString('pt-BR')}</Td>
                      <Td fontSize="sm">{trip.from}</Td>
                      <Td fontSize="sm">{trip.to}</Td>
                      <Td fontSize="sm" color="green.500">€{trip.earnings}</Td>
                      <Td>
                        <HStack spacing={1}>
                          <Icon as={FiStar} color="yellow.400" boxSize={3} />
                          <Text fontSize="sm">{trip.rating}</Text>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Trends and Insights */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Tendências e Insights</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Box textAlign="center">
                <Icon as={FiTrendingUp} boxSize={8} color="green.500" mb={2} />
                <Text fontWeight="bold" color="green.500">Ganhos em Alta</Text>
                <Text fontSize="sm" color="gray.600">
                  Seus ganhos aumentaram 15% este mês comparado ao anterior
                </Text>
              </Box>
              
              <Box textAlign="center">
                <Icon as={FiStar} boxSize={8} color="yellow.500" mb={2} />
                <Text fontWeight="bold" color="yellow.500">Excelente Avaliação</Text>
                <Text fontSize="sm" color="gray.600">
                  Mantenha o excelente serviço! Sua avaliação está acima da média
                </Text>
              </Box>
              
              <Box textAlign="center">
                <Icon as={FiClock} boxSize={8} color="blue.500" mb={2} />
                <Text fontWeight="bold" color="blue.500">Horários Picos</Text>
                <Text fontSize="sm" color="gray.600">
                  Seus melhores horários são entre 18h-22h nos fins de semana
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      </DriverLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Load translations
    const translations = await loadTranslations('pt', ['common', 'driver']);

    // Get user data from context (passed by withDriver HOC)
    const userData = (context as any).userData || null;
    
    if (!userData) {
      throw new Error('User data not found');
    }

    // Get driver data from Firestore
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', userData.uid).limit(1).get();
    
    if (driverSnap.empty) {
      throw new Error('Driver not found');
    }

    const driverDoc = driverSnap.docs[0];
    const driver = {
      id: driverDoc.id,
      ...driverDoc.data(),
    };

    // Get real trips data for analytics
    const tripsSnap = await adminDb.collection('trips').where('driverId', '==', driverDoc.id).get();
    const trips = tripsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
    }));

    // Get real payments data for earnings
    const paymentsSnap = await adminDb.collection('payments').where('driverId', '==', driverDoc.id).get();
    const payments = paymentsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
    }));

    // Calculate analytics from real data
    const totalEarnings = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const monthlyEarnings = payments
      .filter(p => new Date(p.date).getMonth() === new Date().getMonth())
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const weeklyEarnings = payments
      .filter(p => {
        const paymentDate = new Date(p.date);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return paymentDate >= weekAgo;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const dailyEarnings = payments
      .filter(p => {
        const paymentDate = new Date(p.date);
        const today = new Date();
        return paymentDate.toDateString() === today.toDateString();
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const completedTrips = trips.filter(t => t.status === 'completed');
    const cancelledTrips = trips.filter(t => t.status === 'cancelled');
    const totalTrips = trips.length;
    const averageRating = completedTrips.length > 0 
      ? completedTrips.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) / completedTrips.length 
      : 0;
    const completionRate = totalTrips > 0 ? Math.round((completedTrips.length / totalTrips) * 100) : 0;

    // Calculate performance metrics
    const onlineHours = trips.reduce((sum, t) => sum + (Number(t.duration) || 0), 0) / 60; // Convert minutes to hours
    const acceptanceRate = totalTrips > 0 ? Math.round((completedTrips.length / totalTrips) * 100) : 0;
    const averageTripDuration = completedTrips.length > 0 
      ? Math.round(completedTrips.reduce((sum, t) => sum + (Number(t.duration) || 0), 0) / completedTrips.length)
      : 0;
    const averageTripDistance = completedTrips.length > 0 
      ? Math.round((completedTrips.reduce((sum, t) => sum + (Number(t.distance) || 0), 0) / completedTrips.length) * 10) / 10
      : 0;

    // Calculate growth trends (simplified - you can implement more sophisticated trend analysis)
    const previousMonthEarnings = payments
      .filter(p => {
        const paymentDate = new Date(p.date);
        const now = new Date();
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return paymentDate >= previousMonth && paymentDate < currentMonth;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const earningsGrowth = previousMonthEarnings > 0 
      ? ((monthlyEarnings - previousMonthEarnings) / previousMonthEarnings) * 100 
      : 0;

    const analytics = {
      earnings: {
        total: totalEarnings,
        monthly: monthlyEarnings,
        weekly: weeklyEarnings,
        daily: dailyEarnings,
        growth: earningsGrowth,
      },
      trips: {
        total: totalTrips,
        completed: completedTrips.length,
        cancelled: cancelledTrips.length,
        averageRating,
        completionRate,
      },
      performance: {
        onlineHours: Math.round(onlineHours),
        acceptanceRate,
        averageTripDuration,
        averageTripDistance,
      },
      trends: {
        earningsTrend: earningsGrowth > 5 ? 'up' : earningsGrowth < -5 ? 'down' : 'stable',
        tripsTrend: totalTrips > 0 ? 'up' : 'stable',
        ratingTrend: averageRating > 4.5 ? 'up' : averageRating < 3.5 ? 'down' : 'stable',
      },
    };

    // Get recent trips for the table
    const recentTrips = trips
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      props: {
        driver,
        analytics,
        recentTrips,
        translations,
        userData: driver,
      },
    };
  } catch (error) {
    console.error('Error loading analytics page:', error);
    return {
      props: {
        driver: null,
        analytics: {
          earnings: { total: 0, monthly: 0, weekly: 0, daily: 0, growth: 0 },
          trips: { total: 0, completed: 0, cancelled: 0, averageRating: 0, completionRate: 0 },
          performance: { onlineHours: 0, acceptanceRate: 0, averageTripDuration: 0, averageTripDistance: 0 },
          trends: { earningsTrend: 'stable', tripsTrend: 'stable', ratingTrend: 'stable' },
        },
        recentTrips: [],
        translations: { common: {}, driver: {} },
        userData: null,
      },
    };
  }
};
