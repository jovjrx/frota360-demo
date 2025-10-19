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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Select,
  Progress,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiDownload,
  FiSearch,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import useSWR from 'swr';
import { useState } from 'react';

interface KPIRecord {
  driverId: string;
  driverName: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  overallScore: number;
  performanceLevel: string;
  weeklyRevenue: number;
  acceptanceRate: number;
  passengerRating: number;
  recruitmentsActive: number;
  activeHoursPerWeek: number;
}

interface AdminKPIsData {
  success: boolean;
  summary: {
    averageScore: number;
    totalDriversTracked: number;
    averageRevenue: number;
    averageAcceptanceRate: number;
  };
  kpis: KPIRecord[];
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

const performanceLevelColors: Record<string, string> = {
  beginner: 'gray',
  developing: 'blue',
  proficient: 'green',
  expert: 'purple',
  master: 'gold',
};

export default function AdminKPIsPage({ translations, locale }: AdminPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const { data, isLoading, error } = useSWR<AdminKPIsData>(
    '/api/admin/kpis',
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <AdminLayout title="KPIs" translations={translations}>
        <Center minH="400px">
          <Spinner size="lg" color="red.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <AdminLayout title="KPIs" translations={translations}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar KPIs</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados de performance.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const { summary, kpis } = data;

  // Filtrar KPIs
  let filtered = kpis;
  if (searchTerm) {
    filtered = filtered.filter(k => 
      k.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.driverId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (filterLevel !== 'all') {
    filtered = filtered.filter(k => k.performanceLevel === filterLevel);
  }

  return (
    <AdminLayout
      title="KPIs"
      subtitle="Dashboard de performance de todos os motoristas"
      translations={translations}
      side={
        <Button
          leftIcon={<Icon as={FiDownload} />}
          colorScheme="red"
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
      }
    >
      {/* KPIs Resumo */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="red.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Score Médio</StatLabel>
            <StatNumber color="red.600" fontSize="2xl">
              {summary.averageScore.toFixed(0)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              /100
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="green.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Motoristas Rastreados</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              {summary.totalDriversTracked}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Com dados de performance
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="blue.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Receita Média</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              €{summary.averageRevenue.toFixed(0)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Por motorista/semana
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="purple.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Taxa Aceitação Média</StatLabel>
            <StatNumber color="purple.600" fontSize="2xl">
              {(summary.averageAcceptanceRate * 100).toFixed(1)}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              Todas as plataformas
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Filtros */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" mb={6}>
        <HStack spacing={4}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Buscar motorista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            size="sm"
            maxW="200px"
          >
            <option value="all">Todos os Níveis</option>
            <option value="beginner">Iniciante</option>
            <option value="developing">Em Desenvolvimento</option>
            <option value="proficient">Proficiente</option>
            <option value="expert">Especialista</option>
            <option value="master">Mestre</option>
          </Select>
        </HStack>
      </Box>

      {/* Tabela */}
      <Box bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden">
        {filtered.length === 0 ? (
          <Alert status="info" borderRadius="0" m={0}>
            <AlertIcon />
            <AlertTitle>Nenhum KPI encontrado</AlertTitle>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Tr>
                  <Th>Motorista</Th>
                  <Th>Semana</Th>
                  <Th isNumeric>Score</Th>
                  <Th>Nível</Th>
                  <Th isNumeric>Receita</Th>
                  <Th isNumeric>Aceitação</Th>
                  <Th isNumeric>Avaliação</Th>
                  <Th isNumeric>Horas</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((kpi) => (
                  <Tr key={`${kpi.driverId}-${kpi.weekId}`} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">
                          {kpi.driverName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {kpi.driverId}
                        </Text>
                      </VStack>
                    </Td>
                    <Td fontSize="sm" color="gray.600">
                      {kpi.weekStart}
                    </Td>
                    <Td isNumeric>
                      <HStack spacing={2}>
                        <Progress
                          value={kpi.overallScore}
                          size="sm"
                          colorScheme={performanceLevelColors[kpi.performanceLevel] || 'gray'}
                          width="60px"
                          borderRadius="md"
                        />
                        <Text fontSize="sm" fontWeight="bold">
                          {kpi.overallScore.toFixed(0)}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={performanceLevelColors[kpi.performanceLevel] || 'gray'} fontSize="xs">
                        {kpi.performanceLevel}
                      </Badge>
                    </Td>
                    <Td isNumeric fontSize="sm">
                      €{kpi.weeklyRevenue.toFixed(2)}
                    </Td>
                    <Td isNumeric fontSize="sm">
                      {(kpi.acceptanceRate * 100).toFixed(1)}%
                    </Td>
                    <Td isNumeric fontSize="sm">
                      {kpi.passengerRating.toFixed(1)} ⭐
                    </Td>
                    <Td isNumeric fontSize="sm">
                      {kpi.activeHoursPerWeek.toFixed(1)}h
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Info Box */}
      <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200" mt={6}>
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <AlertTitle>Score de Performance</AlertTitle>
          <AlertDescription fontSize="sm">
            Calculado com base em: receita (40%), aceitação (20%), avaliação (20%), recrutamentos (10%) e horas ativas (10%).
          </AlertDescription>
        </VStack>
      </Alert>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  return {};
});

