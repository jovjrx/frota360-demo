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


interface DriverGoalStatus {
  id: string;
  descricao: string;
  criterio: 'ganho' | 'viagens';
  tipo: 'valor' | 'percentual';
  valor: number;
  nivel: number;
  atingido: boolean;
  valorGanho: number;
  valorBase: number;
  dataInicio?: number;
}

interface GoalsData {
  success: boolean;
  driver: {
    id: string;
    name: string;
    type: string;
  };
  goals: DriverGoalStatus[];
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
            Não foi possível carregar suas metas/recompensas.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const { goals } = data;

  return (
    <DashboardLayout
      title="Metas/Recompensas da Semana"
      subtitle="Veja as metas/recompensas válidas para você nesta semana."
      translations={translations}
    >
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <VStack align="stretch" spacing={4}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Metas/Recompensas Ativas
            </Text>
            <Text fontSize="sm" color="gray.500">
              As metas/recompensas são calculadas semanalmente com base nos seus ganhos e viagens.
            </Text>
          </VStack>

          <Divider />

          {goals.length === 0 ? (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>Sem metas/recompensas ativas</AlertTitle>
              <AlertDescription>
                Nenhuma meta/recompensa está ativa para esta semana.
              </AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {goals.map((goal) => (
                <Box
                  key={goal.id}
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={goal.atingido ? 'green.200' : 'gray.200'}
                  bg={goal.atingido ? 'green.50' : 'gray.50'}
                >
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="md" fontWeight="bold" color="gray.700">
                        {goal.descricao}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Critério: {goal.criterio === 'ganho' ? 'Ganho Bruto' : 'Viagens'} | Tipo: {goal.tipo === 'valor' ? 'Valor Fixo' : 'Percentual'} | Nível: {goal.nivel}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Valor: {goal.tipo === 'percentual' ? `${goal.valor}%` : `R$ ${goal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        {goal.dataInicio ? ` | Vigente desde: ${new Date(goal.dataInicio).toLocaleDateString('pt-BR')}` : ''}
                      </Text>
                    </VStack>
                    <Badge colorScheme={goal.atingido ? 'green' : 'gray'} fontSize="sm">
                      {goal.atingido ? 'Atingido' : 'Não atingido'}
                    </Badge>
                  </HStack>
                  <HStack spacing={6} mt={2} fontSize="sm">
                    <Text color="gray.700">Base: {goal.criterio === 'ganho' ? `R$ ${goal.valorBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `${goal.valorBase} viagens`}</Text>
                    <Text color={goal.atingido ? 'green.700' : 'gray.700'} fontWeight="bold">
                      Valor ganho: {goal.atingido ? (goal.tipo === 'percentual' ? `R$ ${goal.valorGanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${goal.valorGanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`) : '—'}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </Box>
      <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200" mt={6}>
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <AlertTitle>Sobre as Metas/Recompensas</AlertTitle>
          <AlertDescription fontSize="sm">
            As metas/recompensas são definidas pela administração e aplicadas a todos os motoristas a partir da data de início. O cálculo é feito semanalmente.
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

