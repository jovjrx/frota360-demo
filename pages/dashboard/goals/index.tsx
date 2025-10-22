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
  Progress,
  Spinner,
  Center,
} from '@chakra-ui/react';
import {
  FiTarget,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import useSWR from 'swr';

interface Goal {
  id: string;
  quarter: string;
  target: number;
  description: string;
  current: number;
  status: string;
  weight: number;
  createdAt: string;
}

interface GoalsData {
  success: boolean;
  driver: {
    id: string;
    name: string;
    type: string;
  };
  goals: Goal[];
  summary: {
    totalGoals: number;
    completedGoals: number;
    overallProgress: number;
  };
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

const statusColors: Record<string, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  overdue: 'red',
};

const statusLabels: Record<string, string> = {
  not_started: 'Não Iniciado',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  overdue: 'Atrasado',
};

export default function GoalsPage({ translations, locale }: DashboardPageProps) {
  const router = useRouter();
  const { data, isLoading, error } = useSWR<GoalsData>(
    '/api/driver/goals',
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Metas" translations={translations}>
        <Center minH="400px">
          <Spinner size="lg" color="green.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <DashboardLayout title="Metas" translations={translations}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar metas</AlertTitle>
          <AlertDescription>
            Não foi possível carregar suas metas para 2026.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const { goals, summary, year } = data as any;
  const displayYear = goals?.[0]?.year || year; // no fallback to mocked year

  return (
    <DashboardLayout
      title={displayYear ? `Metas ${displayYear}` : 'Metas'}
      subtitle="Acompanhe as metas estratégicas da Conduz.pt"
      translations={translations}
    >
      {/* Resumo Geral */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="green.200">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600" fontWeight="bold">
              Metas Concluídas
            </Text>
            <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {summary.completedGoals}/{summary.totalGoals}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {((summary.completedGoals / summary.totalGoals) * 100).toFixed(0)}% completo
          </Text>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="blue.200">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600" fontWeight="bold">
              Progresso Geral
            </Text>
            <Icon as={FiTrendingUp} color="blue.500" boxSize={5} />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            {summary.overallProgress.toFixed(0)}%
          </Text>
          <Progress
            value={summary.overallProgress}
            size="sm"
            colorScheme="blue"
            borderRadius="md"
            mt={2}
          />
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="purple.200">
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color="gray.600" fontWeight="bold">
              Ano
            </Text>
            <Icon as={FiClock} color="purple.500" boxSize={5} />
          </HStack>
          <Text fontSize="2xl" fontWeight="bold" color="purple.600">{displayYear ?? '—'}</Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            4 trimestres
          </Text>
        </Box>
      </SimpleGrid>

      {/* Metas por Trimestre */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <VStack align="stretch" spacing={4}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Metas Trimestrais
            </Text>
            <Text fontSize="sm" color="gray.500">
              Objetivos de crescimento configurados pela administração
            </Text>
          </VStack>

          <Divider />

          {goals.length === 0 ? (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>Sem metas definidas</AlertTitle>
              <AlertDescription>
                As metas ainda não foram configuradas. Aguarde a definição pela administração.
              </AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {goals.map((goal) => {
                const progress = (goal.current / goal.target) * 100;
                const statusColor = statusColors[goal.status] || 'gray';

                return (
                  <Box
                    key={goal.id}
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={statusColor === 'green' ? 'green.200' : 'gray.200'}
                    bg={statusColor === 'green' ? 'green.50' : 'gray.50'}
                  >
                    <HStack justify="space-between" mb={3}>
                      <VStack align="start" spacing={1}>
                        <HStack spacing={2}>
                          <Icon as={FiTarget} color={`${statusColor}.500`} />
                          <Text fontSize="sm" fontWeight="bold" color="gray.700">
                            {goal.quarter} {displayYear ? displayYear : ''}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.600" pl={6}>
                          {goal.description}
                        </Text>
                      </VStack>
                      <Badge colorScheme={statusColor} fontSize="xs">
                        {statusLabels[goal.status] || goal.status}
                      </Badge>
                    </HStack>

                    <VStack align="stretch" spacing={2} pl={6}>
                      <HStack justify="space-between" fontSize="xs">
                        <Text color="gray.600">
                          {goal.current} / {goal.target} motoristas
                        </Text>
                        <Text fontWeight="bold" color={statusColor === 'green' ? 'green.600' : 'gray.700'}>
                          {progress.toFixed(0)}%
                        </Text>
                      </HStack>
                      <Progress
                        value={Math.min(progress, 100)}
                        size="sm"
                        colorScheme={statusColor}
                        borderRadius="md"
                      />
                    </VStack>

                    {goal.weight && (
                      <Text fontSize="xs" color="gray.500" mt={2} pl={6}>
                        Peso: {goal.weight}% do objetivo geral
                      </Text>
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Info Box */}
      <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <AlertTitle>Sobre as Metas{displayYear ? ` ${displayYear}` : ''}</AlertTitle>
          <AlertDescription fontSize="sm">
            As metas representam os objetivos estratégicos da Conduz.pt. Seu progresso é baseado no número de motoristas ativos em sua rede.
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

