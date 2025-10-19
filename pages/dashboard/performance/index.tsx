import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Center,
  Progress,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiStar,
  FiUsers,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import useSWR from 'swr';

interface KPIData {
  success: boolean;
  driver: {
    id: string;
    name: string;
    type: string;
  };
  currentKPI?: {
    weekId: string;
    weekStart: string;
    weekEnd: string;
    overallScore: number;
    performanceLevel: string;
    kpis: {
      weeklyRevenue: number;
      acceptanceRate: number;
      passengerRating: number;
      recruitmentsActive: number;
      activeHoursPerWeek: number;
    };
  };
  history: Array<{
    weekId: string;
    weekStart: string;
    weekEnd: string;
    overallScore: number;
    performanceLevel: string;
  }>;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

const performanceLevelColors: Record<string, string> = {
  beginner: 'gray',
  developing: 'blue',
  proficient: 'green',
  expert: 'purple',
  master: 'gold',
};

const performanceLevelLabels: Record<string, string> = {
  beginner: 'Iniciante',
  developing: 'Em Desenvolvimento',
  proficient: 'Proficiente',
  expert: 'Especialista',
  master: 'Mestre',
};

export default function PerformancePage({ translations, locale }: DashboardPageProps) {
  const router = useRouter();
  const { data, isLoading, error } = useSWR<KPIData>(
    '/api/driver/performance/my-kpis',
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Performance" translations={translations}>
        <Center minH="400px">
          <Spinner size="lg" color="green.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <DashboardLayout title="Performance" translations={translations}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar performance</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seus dados de performance.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const { currentKPI, history } = data;

  if (!currentKPI) {
    return (
      <DashboardLayout
        title="Performance"
        subtitle="Acompanhe seu desempenho semanal"
        translations={translations}
      >
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Sem dados de performance</AlertTitle>
          <AlertDescription>
            Seus dados de performance aparecerão aqui conforme você trabalha.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const colorScheme = performanceLevelColors[currentKPI.performanceLevel] || 'gray';
  const levelLabel = performanceLevelLabels[currentKPI.performanceLevel] || currentKPI.performanceLevel;

  return (
    <DashboardLayout
      title="Performance"
      subtitle="Acompanhe seu desempenho semanal e histórico"
      translations={translations}
    >
      {/* Score Geral */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" mb={6}>
        <VStack align="stretch" spacing={4}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Score de Performance
            </Text>
            <Text fontSize="sm" color="gray.500">
              Semana {currentKPI.weekStart} a {currentKPI.weekEnd}
            </Text>
          </VStack>

          <Divider />

          <HStack justify="center" spacing={8}>
            <VStack align="center" spacing={2}>
              <Box
                width="120px"
                height="120px"
                borderRadius="full"
                bg={`${colorScheme}.50`}
                borderWidth="4px"
                borderColor={`${colorScheme}.500`}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={0}>
                  <Text fontSize="3xl" fontWeight="bold" color={`${colorScheme}.600`}>
                    {currentKPI.overallScore.toFixed(0)}
                  </Text>
                  <Text fontSize="xs" color={`${colorScheme}.600`}>
                    /100
                  </Text>
                </VStack>
              </Box>
              <Badge colorScheme={colorScheme} fontSize="sm" px={3} py={1}>
                {levelLabel}
              </Badge>
            </VStack>

            <VStack align="start" spacing={3} flex={1}>
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>Receita Semanal</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  €{currentKPI.kpis.weeklyRevenue.toFixed(2)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>Taxa de Aceitação</Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                  {(currentKPI.kpis.acceptanceRate * 100).toFixed(1)}%
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>Avaliação de Passageiros</Text>
                <Text fontSize="lg" fontWeight="bold" color="yellow.600">
                  {currentKPI.kpis.passengerRating.toFixed(1)} ⭐
                </Text>
              </Box>
            </VStack>
          </HStack>
        </VStack>
      </Box>

      {/* KPIs Detalhados */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
          <Stat>
            <HStack justify="space-between" mb={2}>
              <StatLabel fontSize="sm" color="gray.600">Horas Ativas</StatLabel>
              <Icon as={FiClock} color="blue.500" boxSize={5} />
            </HStack>
            <StatNumber color="blue.600" fontSize="2xl">
              {currentKPI.kpis.activeHoursPerWeek.toFixed(1)}h
            </StatNumber>
            <StatHelpText fontSize="xs">
              Horas trabalhadas esta semana
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
          <Stat>
            <HStack justify="space-between" mb={2}>
              <StatLabel fontSize="sm" color="gray.600">Recrutamentos Ativos</StatLabel>
              <Icon as={FiUsers} color="purple.500" boxSize={5} />
            </HStack>
            <StatNumber color="purple.600" fontSize="2xl">
              {currentKPI.kpis.recruitmentsActive}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Motoristas que você recrutou
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Histórico */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <VStack align="stretch" spacing={4}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Histórico de Performance
            </Text>
            <Text fontSize="sm" color="gray.500">
              Últimas 12 semanas
            </Text>
          </VStack>

          <Divider />

          {history.length === 0 ? (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>Sem histórico</AlertTitle>
              <AlertDescription>
                Seu histórico de performance aparecerá aqui.
              </AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={3} align="stretch">
              {history.map((week) => (
                <Box
                  key={week.weekId}
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                  bg="gray.50"
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">
                      {week.weekStart} a {week.weekEnd}
                    </Text>
                    <Badge colorScheme={performanceLevelColors[week.performanceLevel] || 'gray'}>
                      {week.overallScore.toFixed(0)}/100
                    </Badge>
                  </HStack>
                  <Progress
                    value={week.overallScore}
                    size="sm"
                    colorScheme={performanceLevelColors[week.performanceLevel] || 'gray'}
                    borderRadius="md"
                  />
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Info Box */}
      <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <AlertTitle>Como é calculado seu score?</AlertTitle>
          <AlertDescription fontSize="sm">
            Seu score é baseado em: receita semanal (40%), taxa de aceitação (20%), avaliação de passageiros (20%), recrutamentos (10%) e horas ativas (10%).
          </AlertDescription>
        </VStack>
      </Alert>
    </DashboardLayout>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: false },
  async (context, user, driverId) => {
    return {};
  }
);

