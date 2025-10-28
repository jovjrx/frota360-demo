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
import { useMemo } from 'react';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';


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

interface GoalsPageProps extends DashboardPageProps {
  goalsData: GoalsData;
}

export default function GoalsPage({ translations, locale, goalsData, tPage, tCommon }: GoalsPageProps) {
  const router = useRouter();
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);

  if (!goalsData?.success) {
    return (
      <DashboardLayout title={t('goals.title', 'Metas')} translations={translations}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>{t('goals.error_title', 'Erro ao carregar metas')}</AlertTitle>
          <AlertDescription>
            {t('goals.error_description', 'Não foi possível carregar suas metas/recompensas.')}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const { goals } = goalsData;

  return (
    <DashboardLayout
      title={t('goals.title', 'Metas/Recompensas da Semana')}
      subtitle={t('goals.subtitle', 'Veja as metas/recompensas válidas para você nesta semana.')}
      translations={translations}
    >
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <VStack align="stretch" spacing={4}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              {t('goals.active_goals', 'Metas/Recompensas Ativas')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('goals.active_goals_subtitle', 'As metas/recompensas são calculadas semanalmente com base nos seus ganhos e viagens.')}
            </Text>
          </VStack>

          <Divider />

          {goals.length === 0 ? (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <AlertTitle>{t('goals.no_goals_title', 'Sem metas/recompensas ativas')}</AlertTitle>
              <AlertDescription>
                {t('goals.no_goals_description', 'Nenhuma meta/recompensa está ativa para esta semana.')}
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
                        {t('goals.criterio', 'Critério')}: {goal.criterio === 'ganho' ? t('goals.criterio_ganho', 'Ganho Bruto') : t('goals.criterio_viagens', 'Viagens')} | {t('goals.tipo', 'Tipo')}: {goal.tipo === 'valor' ? t('goals.tipo_valor', 'Valor Fixo') : t('goals.tipo_percentual', 'Percentual')} | {t('goals.nivel', 'Nível')}: {goal.nivel}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {t('goals.valor', 'Valor')}: {goal.tipo === 'percentual' ? `${goal.valor}%` : `€${goal.valor.toLocaleString(locale, { minimumFractionDigits: 2 })}`}
                        {goal.dataInicio ? ` | ${t('goals.vigente_desde', 'Vigente desde')}: ${new Date(goal.dataInicio).toLocaleDateString(locale)}` : ''}
                      </Text>
                    </VStack>
                    <Badge colorScheme={goal.atingido ? 'green' : 'gray'} fontSize="sm">
                      {goal.atingido ? t('goals.atingido', 'Atingido') : t('goals.nao_atingido', 'Não atingido')}
                    </Badge>
                  </HStack>
                  <HStack spacing={6} mt={2} fontSize="sm">
                    <Text color="gray.700">{t('goals.base', 'Base')}: {goal.criterio === 'ganho' ? `€${goal.valorBase.toLocaleString(locale, { minimumFractionDigits: 2 })}` : `${goal.valorBase} ${t('goals.viagens', 'viagens')}`}</Text>
                    <Text color={goal.atingido ? 'green.700' : 'gray.700'} fontWeight="bold">
                      {t('goals.valor_ganho', 'Valor ganho')}: {goal.atingido ? `€${goal.valorGanho.toLocaleString(locale, { minimumFractionDigits: 2 })}` : '—'}
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
          <AlertTitle>{t('goals.info_title', 'Sobre as Metas/Recompensas')}</AlertTitle>
          <AlertDescription fontSize="sm">
            {t('goals.info_description', 'As metas/recompensas são definidas pela administração e aplicadas a todos os motoristas a partir da data de início. O cálculo é feito semanalmente.')}
          </AlertDescription>
        </VStack>
      </Alert>
    </DashboardLayout>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: false },
  async (context, user, driverId) => {
    try {
      // ✅ Importar função ÚNICA centralizada
      const { getProcessedWeeklyRecords } = await import('@/lib/api/weekly-data-processor');
      const { getWeekId } = await import('@/lib/utils/date-helpers');
      const { computeDriverGoals } = await import('@/lib/goals/service');
      const { adminDb } = await import('@/lib/firebaseAdmin');
      
      const weekId = (context.query.weekId as string) || getWeekId(new Date());
      
      // Buscar dados do motorista
      const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
      if (!driverDoc.exists) {
        return {
          goalsData: {
            success: false,
            driver: { id: driverId, name: '', type: 'driver' },
            goals: [],
          },
        };
      }
      
      const driverData = driverDoc.data() as any;
      const driverName = driverData.fullName || driverData.firstName || '';
      
      // ✅ Buscar dados da semana com função ÚNICA (filtering por driverId)
      const weekDataArray = await getProcessedWeeklyRecords(weekId, driverId, false);
      const weekData = weekDataArray[0];
      
      if (!weekData) {
        // Sem dados, calcular goals com valores zerados
        const dataSemana = new Date().getTime();
        const goals = await computeDriverGoals(driverId, driverName, 0, 0, dataSemana);
        return {
          goalsData: {
            success: true,
            driver: { id: driverId, name: driverName, type: 'driver' },
            goals,
          },
        };
      }
      
      return {
        goalsData: {
          success: true,
          driver: { id: driverId, name: driverName, type: 'driver' },
          goals: (weekData as any).goals || [],
        },
      };
    } catch (error) {
      console.error('[dashboard/goals SSR] error:', error);
      return {
        goalsData: {
          success: false,
          driver: { id: driverId, name: '', type: 'driver' },
          goals: [],
        },
      };
    }
  }
);


