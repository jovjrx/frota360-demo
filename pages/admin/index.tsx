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
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import { FiUsers, FiDollarSign, FiTrendingUp, FiFileText, FiSettings, FiBell } from 'react-icons/fi';
import Link from 'next/link';

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
}

export default function AdminDashboard({ stats, recentDrivers, recentPayouts }: AdminDashboardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <>
      <Head>
        <title>Painel Administrativo - Conduz.pt</title>
      </Head>
      
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
                      <StatArrow type="decrease" />
                      {stats.pendingPayouts} pendentes
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Pendentes</StatLabel>
                    <StatNumber>{stats.pendingDrivers}</StatNumber>
                    <StatHelpText>
                      Motoristas aguardando aprovação
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
                  <Link href="/admin/painels" passHref>
                    <Button as="a" leftIcon={<FiUsers />} colorScheme="blue" variant="outline" w="full">
                      Gerenciar Motoristas
                    </Button>
                  </Link>
                  <Link href="/admin/plans" passHref>
                    <Button as="a" leftIcon={<FiFileText />} colorScheme="green" variant="outline" w="full">
                      Gerenciar Planos
                    </Button>
                  </Link>
                  <Link href="/admin/payouts" passHref>
                    <Button as="a" leftIcon={<FiDollarSign />} colorScheme="purple" variant="outline" w="full">
                      Processar Pagamentos
                    </Button>
                  </Link>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>Motoristas Recentes</Heading>
                  <VStack spacing={3} align="stretch">
                    {recentDrivers.map((driver) => (
                      <HStack key={driver.id} justifyContent="space-between">
                        <VStack align="flex-start" spacing={0}>
                          <Text fontWeight="medium">{driver.name || 'Sem nome'}</Text>
                          <Text fontSize="sm" color="gray.500">{driver.email}</Text>
                        </VStack>
                        <Badge colorScheme={
                          driver.status === 'approved' ? 'green' :
                          driver.status === 'pending' ? 'yellow' : 'red'
                        }>
                          {driver.status}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>Pagamentos Recentes</Heading>
                  <VStack spacing={3} align="stretch">
                    {recentPayouts.map((payout) => (
                      <HStack key={payout.id} justifyContent="space-between">
                        <VStack align="flex-start" spacing={0}>
                          <Text fontWeight="medium">Motorista {payout.driverId.slice(0, 8)}...</Text>
                          <Text fontSize="sm" color="gray.500">
                            {new Date(payout.periodStart).toLocaleDateString('pt-BR')}
                          </Text>
                        </VStack>
                        <VStack align="flex-end" spacing={0}>
                          <Text fontWeight="medium">€{(payout.netCents / 100).toFixed(2)}</Text>
                          <Badge colorScheme={payout.status === 'paid' ? 'green' : 'yellow'}>
                            {payout.status}
                          </Badge>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get basic stats
    const [drivers, payouts] = await Promise.all([
      store.drivers.findAll(),
      store.payouts.findAll(),
    ]);

    const stats = {
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === 'approved').length,
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
      },
    };
  }
};
