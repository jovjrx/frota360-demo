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
import { loadTranslations } from '@/lib/translations';
import DriverLayout from '@/components/layouts/DriverLayout';
import QuickActions from '@/components/QuickActions';

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
                            {new Date(payment.date).toLocaleDateString('pt-BR')}
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
                            {new Date(trip.date).toLocaleDateString('pt-BR')}
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

    // Mock data - replace with actual data fetching
    const driver = {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      status: 'active',
      avatar: null,
    };

    const stats = {
      totalEarnings: 2450.75,
      monthlyEarnings: 850.50,
      totalTrips: 156,
      averageRating: 4.8,
      completionRate: 95,
    };

    const subscription = {
      plan: { name: 'Plano Premium' },
      status: 'active',
    };

    const recentPayments = [
      { id: 'P001', amount: 450.75, date: '2024-01-20' },
      { id: 'P002', amount: 320.50, date: '2024-01-15' },
      { id: 'P003', amount: 280.25, date: '2024-01-10' },
    ];

    const recentTrips = [
      { from: 'Centro', to: 'Aeroporto', earnings: 25.50, rating: 5.0, date: '2024-01-20' },
      { from: 'Shopping', to: 'Hospital', earnings: 18.75, rating: 4.5, date: '2024-01-19' },
      { from: 'Universidade', to: 'Estação', earnings: 12.30, rating: 4.8, date: '2024-01-18' },
    ];

    const notifications = [
      { id: '1', message: 'Novo pagamento disponível', type: 'payment' },
      { id: '2', message: 'Documento aprovado', type: 'document' },
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