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
  FiClock
} from 'react-icons/fi';
import Link from 'next/link';
import { loadTranslations } from '@/lib/translations';

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
}

export default function AdminDashboard({ stats, recentDrivers, recentPayouts, translations }: AdminDashboardProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
  const tAdmin = (key: string) => translations.admin?.[key] || key;
  
  const cardBg = "white";
  const borderColor = "gray.200";
  const bgColor = "gray.50";

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
      
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <HStack spacing={4}>
                <Avatar 
                  size="md" 
                  name="Administrador" 
                  bg="blue.500"
                />
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    Bem-vindo, Administrador!
                  </Text>
                  <HStack>
                    <Badge colorScheme="blue">
                      Administrador
                    </Badge>
                    <Badge colorScheme="green">
                      Sistema Ativo
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
              <HStack spacing={4}>
                <Button leftIcon={<FiBell />} variant="outline" size="sm">
                  Notificações (0)
                </Button>
                <Button leftIcon={<FiSettings />} variant="outline" size="sm">
                  Configurações
                </Button>
              </HStack>
            </HStack>
          </Box>
        </Box>

        {/* Main Content */}
        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={8} align="stretch">
            {/* Stats Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total de Motoristas</StatLabel>
                    <StatNumber>{stats.totalDrivers}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      {stats.activeDrivers} ativos
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Receita Total</StatLabel>
                    <StatNumber>€{stats.totalRevenue.toFixed(2)}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      €{stats.monthlyRevenue.toFixed(2)} este mês
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Pagamentos</StatLabel>
                    <StatNumber>{stats.totalPayouts}</StatNumber>
                    <StatHelpText>
                      {stats.pendingPayouts} pendentes
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Motoristas Pendentes</StatLabel>
                    <StatNumber>{stats.pendingDrivers}</StatNumber>
                    <StatHelpText>
                      Aguardando aprovação
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Quick Actions */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Heading size="md" mb={4}>Ações Rápidas</Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Button 
                    as={Link} 
                    href="/admin/drivers" 
                    leftIcon={<FiUsers />} 
                    colorScheme="blue" 
                    variant="outline"
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
                    variant="outline"
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
                    variant="outline"
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
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <HStack justifyContent="space-between" mb={4}>
                    <Heading size="md">Motoristas Recentes</Heading>
                    <Button as={Link} href="/admin/drivers" size="sm" variant="outline">
                      Ver Todos
                    </Button>
                  </HStack>
                  <VStack spacing={3} align="stretch">
                    {recentDrivers.slice(0, 5).map((driver) => (
                      <HStack key={driver.id} p={3} bg="gray.50" borderRadius="md">
                        <Avatar size="sm" name={driver.name} />
                        <VStack align="flex-start" spacing={0} flex={1}>
                          <Text fontWeight="medium">{driver.name}</Text>
                          <Text fontSize="sm" color="gray.600">{driver.email}</Text>
                        </VStack>
                        <Badge colorScheme={getStatusColor(driver.status)}>
                          {getStatusText(driver.status)}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Recent Payouts */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <HStack justifyContent="space-between" mb={4}>
                    <Heading size="md">Pagamentos Recentes</Heading>
                    <Button as={Link} href="/admin/payouts" size="sm" variant="outline">
                      Ver Todos
                    </Button>
                  </HStack>
                  <VStack spacing={3} align="stretch">
                    {recentPayouts.slice(0, 5).map((payout) => (
                      <HStack key={payout.id} p={3} bg="gray.50" borderRadius="md">
                        <Icon as={FiDollarSign} color="green.500" />
                        <VStack align="flex-start" spacing={0} flex={1}>
                          <Text fontWeight="medium">€{(payout.grossCents / 100).toFixed(2)}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {new Date(payout.createdAt).toLocaleDateString('pt-PT')}
                          </Text>
                        </VStack>
                        <Badge colorScheme={payout.status === 'completed' ? 'green' : 'yellow'}>
                          {payout.status === 'completed' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
        </Box>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Load translations
    const translations = await loadTranslations('pt', ['common', 'admin']);

    // Get basic stats
    const [drivers, payouts] = await Promise.all([
      store.drivers.findAll(),
      store.payouts.findAll(),
    ]);

    const stats = {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === 'active').length,
      pendingDrivers: drivers.filter(d => d.status === 'pending').length,
      totalRevenue: payouts.reduce((sum, p) => sum + (p.grossCents / 100), 0),
      monthlyRevenue: payouts
        .filter(p => p.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000)
        .reduce((sum, p) => sum + (p.grossCents / 100), 0),
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
      },
    };
  }
};