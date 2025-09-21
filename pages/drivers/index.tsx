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
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
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
  List,
  ListItem,
  ListIcon,
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
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle
} from 'react-icons/fi';
import Link from 'next/link';
import { formatPortugalTime } from '@/lib/timezone';
import { loadTranslations } from '@/lib/translations';
import DriverLayout from '@/components/layouts/DriverLayout';
import QuickActions from '@/components/QuickActions';
import { CheckInManager } from '@/components/checkin/CheckInManager';
import { CheckInHistory } from '@/components/checkin/CheckInHistory';

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
  translations: Record<string, any>;
  userData: any;
}

export default function DriverDashboard({ 
  driver, 
  stats, 
  subscription, 
  recentPayments, 
  recentTrips, 
  notifications,
  translations,
  userData
}: DriverDashboardProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
  const tDriver = (key: string) => translations.driver?.[key] || key;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'suspended': return 'red';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'suspended': return 'Suspenso';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  return (
    <>
      <Head>
        <title>{`${tDriver('dashboard.title')} - Conduz.pt`}</title>
      </Head>
      
      <DriverLayout
        title={`${tDriver('dashboard.welcome')}, ${driver?.name || 'Motorista'}!`}
        subtitle="Gerencie suas atividades e ganhos"
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={notifications.length}
        breadcrumbs={[
          { label: 'Dashboard' }
        ]}
        alerts={[
          ...(driver?.status === 'pending' ? [{
            type: 'warning' as const,
            title: tDriver('dashboard.accountPending'),
            description: 'Sua documentação está sendo analisada. Você receberá uma notificação quando for aprovado.'
          }] : []),
          ...(driver?.status === 'suspended' ? [{
            type: 'error' as const,
            title: tDriver('dashboard.accountSuspended'),
            description: 'Entre em contato com o suporte para mais informações.'
          }] : [])
        ]}
        stats={[
          {
            label: tDriver('dashboard.totalEarnings'),
            value: `€${stats.totalEarnings.toFixed(2)}`,
            helpText: `€${stats.monthlyEarnings.toFixed(2)} este mês`,
            arrow: 'increase',
            color: 'green.500'
          },
          {
            label: tDriver('dashboard.totalTrips'),
            value: stats.totalTrips,
            helpText: `Taxa de conclusão: ${stats.completionRate}%`,
            color: 'blue.500'
          },
          {
            label: 'Avaliação',
            value: stats.averageRating.toFixed(1),
            helpText: 'Média de avaliações',
            color: 'yellow.500'
          },
          {
            label: 'Plano Ativo',
            value: subscription?.plan?.name || 'Sem plano',
            helpText: subscription?.status === 'active' ? 'Ativo' : 'Inativo',
            color: 'purple.500'
          }
        ]}
        actions={
              <HStack spacing={4}>
            <Button leftIcon={<FiUpload />} variant="outline" size="sm">
              Upload Documentos
                </Button>
                <Button leftIcon={<FiSettings />} variant="outline" size="sm">
              Configurações
                </Button>
              </HStack>
        }
      >
            {/* Quick Actions */}
        <QuickActions userRole="driver" userData={driver} />

        {/* Check-in System */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Sistema de Check-in</Heading>
          </CardHeader>
                <CardBody>
            <CheckInManager />
                </CardBody>
              </Card>

        {/* Check-in History */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Histórico de Check-ins</Heading>
          </CardHeader>
                <CardBody>
            <CheckInHistory />
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Recent Payments */}
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Pagamentos Recentes</Heading>
            </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {recentPayments.length > 0 ? (
                  recentPayments.slice(0, 5).map((payment, index) => (
                    <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiDollarSign} color="green.500" />
                          <VStack align="flex-start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            Pagamento #{payment.id}
                            </Text>
                          <Text fontSize="xs" color="gray.600">
                            {formatPortugalTime(payment.date, 'dd/MM/yyyy')}
                            </Text>
                          </VStack>
                      </HStack>
                      <Text fontWeight="bold" color="green.500">
                        €{payment.amount.toFixed(2)}
                            </Text>
                        </HStack>
                      ))
                    ) : (
                      <Text color="gray.500" textAlign="center" py={4}>
                    Nenhum pagamento recente
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Recent Trips */}
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Corridas Recentes</Heading>
            </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {recentTrips.length > 0 ? (
                  recentTrips.slice(0, 5).map((trip, index) => (
                    <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiMapPin} color="blue.500" />
                          <VStack align="flex-start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {trip.from} → {trip.to}
                              </Text>
                          <Text fontSize="xs" color="gray.600">
                            {formatPortugalTime(trip.date, 'dd/MM/yyyy')}
                              </Text>
                        </VStack>
                            </HStack>
                          <VStack align="flex-end" spacing={0}>
                        <Text fontWeight="bold" color="blue.500">
                              €{trip.earnings.toFixed(2)}
                            </Text>
                        <Text fontSize="xs" color="gray.600">
                              ⭐ {trip.rating}
                            </Text>
                          </VStack>
                        </HStack>
                      ))
                    ) : (
                      <Text color="gray.500" textAlign="center" py={4}>
                    Nenhuma corrida recente
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

        {/* Document Status */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Status dos Documentos</Heading>
          </CardHeader>
                <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                <HStack>
                  <Icon as={FiCheckCircle} color="green.500" />
                  <Text fontSize="sm" fontWeight="medium">Carta de Condução</Text>
                </HStack>
                <Badge colorScheme="green">Verificado</Badge>
              </HStack>
              
              <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                <HStack>
                  <Icon as={FiAlertCircle} color="yellow.500" />
                  <Text fontSize="sm" fontWeight="medium">Seguro do Veículo</Text>
                </HStack>
                <Badge colorScheme="yellow">Pendente</Badge>
              </HStack>
              
              <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                <HStack>
                  <Icon as={FiXCircle} color="red.500" />
                  <Text fontSize="sm" fontWeight="medium">Certificado TVDE</Text>
                </HStack>
                <Badge colorScheme="red">Rejeitado</Badge>
              </HStack>
                    </VStack>
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

    // Get real payments data
    const paymentsSnap = await adminDb.collection('payments').where('driverId', '==', driverDoc.id).get();
    const payments = paymentsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
    }));

    // Get real trips data
    const tripsSnap = await adminDb.collection('trips').where('driverId', '==', driverDoc.id).get();
    const trips = tripsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
    }));

    // Get subscription data
    const subscriptionSnap = await adminDb.collection('subscriptions').where('driverId', '==', driverDoc.id).limit(1).get();
    const subscription = subscriptionSnap.empty ? null : {
      ...subscriptionSnap.docs[0].data(),
      plan: subscriptionSnap.docs[0].data().plan || { name: 'Sem plano' },
    };

    // Calculate stats from real data
    const totalEarnings = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const monthlyEarnings = payments
      .filter(p => {
        const paymentDate = new Date(p.date);
        const now = new Date();
        return paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const completedTrips = trips.filter(t => t.status === 'completed');
    const totalTrips = trips.length;
    const averageRating = completedTrips.length > 0 
      ? completedTrips.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) / completedTrips.length 
      : 0;
    const completionRate = totalTrips > 0 ? Math.round((completedTrips.length / totalTrips) * 100) : 0;

    const stats = {
      totalEarnings,
      monthlyEarnings,
      totalTrips,
      averageRating,
      completionRate,
    };

    // Get recent payments (last 5)
    const recentPayments = payments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Get recent trips (last 5)
    const recentTrips = trips
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Get notifications
    const notificationsSnap = await adminDb.collection('notifications').where('driverId', '==', driverDoc.id).get();
    const notifications = notificationsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      props: {
        driver,
        stats,
        subscription,
        recentPayments,
        recentTrips,
        notifications,
        translations,
        userData: driver,
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
          completionRate: 0,
        },
        subscription: null,
        recentPayments: [],
        recentTrips: [],
        notifications: [],
        translations: { common: {}, driver: {} },
        userData: null,
      },
    };
  }
};