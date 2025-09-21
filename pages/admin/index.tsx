import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withAdmin } from '@/lib/auth/withAdmin';
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
  CardHeader,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
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
import { loadTranslations } from '@/lib/translations';
import AdminLayout from '@/components/layouts/AdminLayout';

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
  userData
}: AdminDashboardProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
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
        <title>Painel Administrativo - Conduz.pt</title>
      </Head>
      
      <AdminLayout
        title="Painel Administrativo"
        subtitle="Visão geral do sistema e atividades recentes"
        user={{
          name: userData?.name || 'Administrador',
          avatar: userData?.avatar,
          role: 'admin',
          status: 'active'
        }}
        notifications={0}
        breadcrumbs={[
          { label: 'Dashboard' }
        ]}
        stats={[
          {
            label: 'Total Motoristas',
            value: stats.totalDrivers,
            helpText: 'Cadastrados',
            color: 'blue.500'
          },
          {
            label: 'Motoristas Ativos',
            value: stats.activeDrivers,
            helpText: 'Aprovados',
            color: 'green.500'
          },
          {
            label: 'Pendentes',
            value: stats.pendingDrivers,
            helpText: 'Aguardando',
            color: 'yellow.500'
          },
          {
            label: 'Receita Total',
            value: `€${stats.totalRevenue.toLocaleString()}`,
            helpText: 'Acumulada',
            color: 'purple.500'
          },
          {
            label: 'Pagamentos',
            value: stats.totalPayouts,
            helpText: 'Processados',
            color: 'orange.500'
          }
        ]}
      >
        {/* Quick Actions */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Ações Rápidas</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Button
                as={Link}
                href="/admin/drivers"
                leftIcon={<FiUsers />}
                colorScheme="blue"
                size="lg"
                h="60px"
              >
                Gerenciar Motoristas
              </Button>
              <Button
                as={Link}
                href="/admin/payouts"
                leftIcon={<FiDollarSign />}
                colorScheme="green"
                size="lg"
                h="60px"
              >
                Pagamentos
              </Button>
              <Button
                as={Link}
                href="/admin/plans"
                leftIcon={<FiSettings />}
                colorScheme="purple"
                size="lg"
                h="60px"
              >
                Planos
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Drivers */}
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Motoristas Recentes</Heading>
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
                  Ver Todos os Motoristas
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Recent Payouts */}
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Pagamentos Recentes</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {recentPayouts.map((payout) => (
                  <HStack key={payout.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="medium">{payout.driverName}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(payout.createdAt).toLocaleDateString('pt-BR')}
                      </Text>
                    </VStack>
                    <VStack align="flex-end" spacing={0}>
                      <Text fontWeight="bold" color="green.500">
                        €{payout.amount.toLocaleString()}
                      </Text>
                      <Badge colorScheme={payout.status === 'paid' ? 'green' : 'yellow'}>
                        {payout.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </VStack>
                  </HStack>
                ))}
                <Button variant="outline" as={Link} href="/admin/payouts" w="full">
                  Ver Todos os Pagamentos
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* System Status */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Status do Sistema</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <HStack>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text>Sistema Operacional</Text>
              </HStack>
              <HStack>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text>Base de Dados Conectada</Text>
              </HStack>
              <HStack>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text>Pagamentos Ativos</Text>
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
    // Load translations
    const translations = await loadTranslations('pt', ['common', 'admin']);

    // Get all drivers
    const drivers = await store.drivers.findAll();
    
    // Get all payouts
    const payouts = await store.payouts.findAll();

    const stats = {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === 'active').length,
      pendingDrivers: drivers.filter(d => d.status === 'pending').length,
      totalRevenue: payouts.reduce((sum, p) => sum + (p.amount || 0), 0),
      monthlyRevenue: payouts
        .filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      totalPayouts: payouts.length,
      pendingPayouts: payouts.filter(p => p.status === 'pending').length,
    };

    // Get recent drivers (last 5)
    const recentDrivers = drivers
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    // Get recent payouts (last 5)
    const recentPayouts = payouts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    return {
      props: {
        stats,
        recentDrivers,
        recentPayouts,
        translations,
        userData: { name: 'Administrador' }, // Mock data
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