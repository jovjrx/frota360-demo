import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
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
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiDownload,
  FiUsers,
  FiArrowUp,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { formatDate, formatDateShort, formatCurrency } from '@/lib/utils/format';
import useSWR from 'swr';

interface Commission {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  driverRevenue: number;
  baseCommission: number;
  recruitmentCommission: number;
  totalCommission: number;
  recruitmentBreakdown?: Array<{
    level: number;
    count: number;
    commission: number;
  }>;
}

interface RecruitedDriver {
  id: string;
  name: string;
  email: string;
  lastWeekRevenue: number;
  last4WeeksRevenue: number;
  recruitmentDate: string;
  status: 'active' | 'inactive';
}

interface CommissionsData {
  success: boolean;
  driver: {
    id: string;
    name: string;
    affiliateLevel: number;
    activeRecruitments: number;
  };
  commissions: Commission[];
  recruitedDrivers: RecruitedDriver[];
  summary: {
    totalEarned: number;
    totalWeeks: number;
    averageWeekly: number;
    recruitedDriversTotal4Weeks: number;
  };
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function CommissionsPage({ translations, locale }: DashboardPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { data, isLoading, error } = useSWR<CommissionsData>(
    '/api/driver/commissions/my-commissions',
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Comissões" translations={translations}>
        <Center minH="400px">
          <Spinner size="lg" color="green.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <DashboardLayout title="Comissões" translations={translations}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar comissões</AlertTitle>
          <AlertDescription>
            Não foi possível carregar seus dados de comissões. Tente novamente.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const { driver, commissions, summary, recruitedDrivers } = data;

  return (
    <DashboardLayout
      title="Comissões"
      subtitle="Acompanhe suas comissões semanais e ganhos por recrutamento"
      translations={translations}
    >
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="green.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Total Ganho</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              €{summary.totalEarned.toFixed(2)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              {summary.totalWeeks} semanas registradas
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="blue.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Média Semanal</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              €{summary.averageWeekly.toFixed(2)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Baseado em {summary.totalWeeks} semanas
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="purple.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Nível Afiliado</StatLabel>
            <StatNumber color="purple.600" fontSize="2xl">
              Nível {driver.affiliateLevel}
            </StatNumber>
            <StatHelpText fontSize="xs">
              {driver.activeRecruitments} recrutamentos ativos
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Motoristas Indicados */}
      {recruitedDrivers && recruitedDrivers.length > 0 && (
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" mb={6}>
          <HStack justify="space-between" mb={6}>
            <VStack align="start" spacing={0}>
              <HStack>
                <Icon as={FiUsers} color="purple.600" />
                <Text fontSize="lg" fontWeight="bold" color="gray.700">
                  Motoristas Indicados
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Ganhos totais dos últimos 4 semanas: €{summary.recruitedDriversTotal4Weeks?.toFixed(2) || '0.00'}
              </Text>
            </VStack>
          </HStack>

          <Divider mb={6} />

          <VStack spacing={3} align="stretch">
            {recruitedDrivers.map((driver) => (
              <Box
                key={driver.id}
                bg={driver.status === 'active' ? 'white' : 'gray.50'}
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                _hover={{ borderColor: 'purple.300' }}
              >
                <HStack justify="space-between" mb={3}>
                  <VStack align="start" spacing={0} flex={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        {driver.name}
                      </Text>
                      <Badge colorScheme={driver.status === 'active' ? 'green' : 'gray'}>
                        {driver.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {driver.email}
                    </Text>
                  </VStack>
                  <VStack align="end" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold" color="purple.600">
                      €{driver.last4WeeksRevenue.toFixed(2)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      últimas 4 semanas
                    </Text>
                  </VStack>
                </HStack>

                <HStack spacing={6} fontSize="xs" color="gray.600">
                  <HStack>
                    <Icon as={FiArrowUp} boxSize={3} />
                    <Text>Semana passada: €{driver.lastWeekRevenue.toFixed(2)}</Text>
                  </HStack>
                  <Text>
                    Indicado em: {driver.recruitmentDate}
                  </Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Histórico de Comissões */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <HStack justify="space-between" mb={6}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Histórico de Comissões
            </Text>
            <Text fontSize="sm" color="gray.500">
              Últimas 12 semanas
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiDownload} />}
            colorScheme="green"
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: 'Exportação',
                description: 'Funcionalidade em desenvolvimento',
                status: 'info',
                duration: 3000,
              });
            }}
          >
            Exportar
          </Button>
        </HStack>

        <Divider mb={6} />

        {commissions.length === 0 ? (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>Nenhuma comissão registrada</AlertTitle>
            <AlertDescription>
              Suas comissões aparecerão aqui conforme você ganha receita e recruta novos motoristas.
            </AlertDescription>
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {commissions.map((commission) => (
              <Box
                key={commission.weekId}
                bg="gray.50"
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                _hover={{ bg: 'gray.100', borderColor: 'green.300' }}
                transition="all 0.2s"
              >
                <HStack justify="space-between" mb={3}>
                  <HStack>
                    <Icon as={FiCalendar} color="green.600" />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        Semana {formatDateShort(commission.weekStart)} - {formatDateShort(commission.weekEnd)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {commission.weekId}
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge colorScheme="green" fontSize="xs">
                    €{commission.totalCommission.toFixed(2)}
                  </Badge>
                </HStack>

                <Divider my={2} />

                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>Receita</Text>
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">
                      €{commission.driverRevenue.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>Comissão Base</Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.600">
                      €{commission.baseCommission.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>Comissão Recrutamento</Text>
                    <Text fontSize="sm" fontWeight="bold" color="purple.600">
                      €{commission.recruitmentCommission.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>Total</Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.600">
                      €{commission.totalCommission.toFixed(2)}
                    </Text>
                  </Box>
                </SimpleGrid>

                {commission.recruitmentBreakdown && commission.recruitmentBreakdown.length > 0 && (
                  <>
                    <Divider my={2} />
                    <Text fontSize="xs" color="gray.600" mb={2} fontWeight="bold">
                      Breakdown por Nível:
                    </Text>
                    <HStack spacing={4} fontSize="xs">
                      {commission.recruitmentBreakdown.map((breakdown) => (
                        <Text key={breakdown.level} color="gray.600">
                          Nível {breakdown.level}: {breakdown.count} × €{breakdown.commission.toFixed(2)}
                        </Text>
                      ))}
                    </HStack>
                  </>
                )}
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Info Box */}
      <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <AlertTitle>Como funcionam as comissões?</AlertTitle>
          <AlertDescription fontSize="sm">
            Você ganha uma comissão base sobre sua receita (5-10% conforme seu nível) + comissão de recrutamento dos motoristas que você recrutar (2-5% conforme o nível deles).
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


