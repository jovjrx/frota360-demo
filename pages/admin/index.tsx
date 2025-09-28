import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withAdmin } from '@/lib/auth/withAdmin';
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
  Stat,
  StatLabel,
  StatNumber,
  Button,
  Avatar,
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
  FiUsers, 
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
  FiEye,
  FiEdit,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import Link from 'next/link';
import { formatPortugalTime } from '@/lib/timezone';
import { loadTranslations } from '@/lib/translations';
import AdminLayout from '@/components/layouts/AdminLayout';
import QuickActions from '@/components/QuickActions';

interface AdminDashboardProps {
  stats: {
    totalDrivers: number;
    activeDrivers: number;
    pendingDrivers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalPayouts: number;
    pendingPayouts: number;
  };
  recentDrivers: any[];
  recentPayouts: any[];
  translations: Record<string, any>;
  userData: any;
}

export default function AdminDashboard({ 
  stats,
  recentDrivers,
  recentPayouts,
  translations,
  userData,
  tCommon
}: AdminDashboardProps & { tCommon: (key: string) => string }) {
  const tAdmin = (key: string) => translations.admin?.[key] || key;

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
        <title>{tAdmin("dashboard.title")} - Conduz.pt</title>
      </Head>
      
      <AdminLayout
        title={tAdmin("dashboard.title")}
        subtitle={tAdmin("dashboard.subtitle")}
        user={{
          name: userData?.name || 'Administrador',
          avatar: userData?.avatar,
          role: 'admin',
          status: 'active'
        }}
        notifications={0}
        breadcrumbs={[
          { label: tAdmin("dashboard.title") }
        ]}
        stats={[
          {
            label: tAdmin("dashboard.stats.totalDrivers"),
            value: stats.totalDrivers,
            helpText: 'Cadastrados',
            color: 'blue.500'
          },
          {
            label: tAdmin("dashboard.stats.activeDrivers"),
            value: stats.activeDrivers,
            helpText: 'Aprovados',
            color: 'green.500'
          },
          {
            label: tAdmin("dashboard.stats.pendingDrivers"),
            value: stats.pendingDrivers,
            helpText: 'Aguardando',
            color: 'yellow.500'
          },
          {
            label: tAdmin("dashboard.stats.totalRevenue"),
            value: `€${stats.totalRevenue.toLocaleString()}`,
            helpText: 'Acumulada',
            color: 'purple.500'
          },
          {
            label: tAdmin("dashboard.stats.totalPayouts"),
            value: stats.totalPayouts,
            helpText: 'Processados',
            color: 'orange.500'
          }
        ]}
      >
            {/* Quick Actions */}
        <QuickActions userRole="admin" userData={userData} />

        {/* Content Management Link */}
        <Card bg="white" borderColor="gray.200">
          <CardBody>
            <HStack justify="space-between" align="center">
              <VStack align="flex-start" spacing={1}>
                <Heading size="md">Gestão de Conteúdo</Heading>
                <Text color="gray.600">
                  Gerencie o conteúdo das páginas públicas com suporte multilíngue
                </Text>
              </VStack>
              <Button as={Link} href="/admin/content" colorScheme="blue" leftIcon={<FiEdit />}>
                Gerenciar Conteúdo
              </Button>
            </HStack>
          </CardBody>
        </Card>

            {/* Recent Activity */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Drivers */}
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">{tAdmin("dashboard.recentDrivers")}</Heading>
            </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {recentDrivers.map((driver) => (
                  <HStack key={driver.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <HStack>
                      <Avatar size="sm" name={driver.name} />
                        <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="medium">{driver.name}</Text>
                        <Text fontSize="sm" color="gray.600">{driver.email}</Text>
                        </VStack>
                    </HStack>
                    <HStack>
                      <Badge colorScheme={getStatusColor(driver.status)}>
                        {getStatusText(driver.status)}
                        </Badge>
                      <Button size="sm" variant="outline" as={Link} href={`/admin/drivers`}>
                        <FiEye />
                      </Button>
                    </HStack>
                      </HStack>
                    ))}
                <Button variant="outline" as={Link} href="/admin/drivers" w="full">
                  {tAdmin("dashboard.manageDrivers")}
                </Button>
                  </VStack>
                </CardBody>
              </Card>

          {/* Recent Payouts */}
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">{tAdmin("dashboard.recentPayouts")}</Heading>
            </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {recentPayouts.map((payout) => (
                  <HStack key={payout.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                        <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="medium">{payout.driverName}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {formatPortugalTime(payout.createdAt, 'dd/MM/yyyy')}
                          </Text>
                        </VStack>
                        <VStack align="flex-end" spacing={0}>
                      <Text fontWeight="bold" color="green.500">
                        €{payout.amount.toLocaleString()}
                      </Text>
                          <Badge colorScheme={payout.status === 'paid' ? 'green' : 'yellow'}>
                        {payout.status === 'paid' ? tAdmin("common.approved") : tAdmin("common.pending")}
                          </Badge>
                        </VStack>
                      </HStack>
                    ))}
                <Button variant="outline" as={Link} href="/admin/payouts" w="full">
                  {tAdmin("dashboard.processPayouts")}
                </Button>
                  </VStack>
                </CardBody>
              </Card>
        </SimpleGrid>

        {/* System Status */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">{tAdmin("dashboard.systemStatus")}</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <HStack>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text>{tAdmin("dashboard.systemOperational")}</Text>
              </HStack>
              <HStack>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text>{tAdmin("dashboard.databaseConnected")}</Text>
              </HStack>
              <HStack>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text>{tAdmin("dashboard.paymentsActive")}</Text>
              </HStack>
            </SimpleGrid>
          </CardBody>
        </Card>
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get session from Iron Session
    const { getSession } = await import('@/lib/session/ironSession');
    const session = await getSession(context.req, context.res);
    
    if (!session.userId) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(session.userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    if (!userData || userData.role !== 'admin') {
      return {
        redirect: {
          destination: '/drivers',
          permanent: false,
        },
      };
    }

    // Extract locale from middleware header
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    // Load translations
    const translations = await loadTranslations(locale, ['common', 'admin']);
    const driversSnap = await adminDb.collection('drivers').get();
    const drivers = driversSnap.docs.map((doc: any) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt.toISOString(), // Convert to string for JSON serialization
      };
    });
    
    // Get real payouts data from Firestore
    const payoutsSnap = await adminDb.collection('payouts').get();
    const payouts = payoutsSnap.docs.map((doc: any) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt.toISOString(), // Convert to string for JSON serialization
      };
    });

    const stats = {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === 'active').length,
      pendingDrivers: drivers.filter(d => d.status === 'pending').length,
      totalRevenue: payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
      monthlyRevenue: payouts
        .filter(p => {
          const payoutDate = new Date(p.createdAt);
          const now = new Date();
          return payoutDate.getMonth() === now.getMonth() && 
                 payoutDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
      totalPayouts: payouts.length,
      pendingPayouts: payouts.filter(p => p.status === 'pending').length,
    };

    // Get recent drivers (last 5)
    const recentDrivers = drivers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Get recent payouts (last 5)
    const recentPayouts = payouts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      props: {
        stats,
        recentDrivers,
        recentPayouts,
        translations,
        userData: { name: 'Administrador' },
      },
    };
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    return {
      props: {
        stats: {
          totalDrivers: 0,
          activeDrivers: 0,
          pendingDrivers: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalPayouts: 0,
          pendingPayouts: 0,
        },
        recentDrivers: [],
        recentPayouts: [],
        translations: { common: {}, admin: {} },
        userData: { name: 'Administrador' },
      },
    };
  }
};