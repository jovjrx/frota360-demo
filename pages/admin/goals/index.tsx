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
  FiTarget,
  FiDownload,
  FiSearch,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import useSWR from 'swr';
import { useState } from 'react';
import PageSettingsMenu from '@/components/admin/PageSettingsMenu';
import GoalsSettingsModal from '@/components/admin/modals/GoalsSettingsModal';
import { useDisclosure } from '@chakra-ui/react';

interface GoalRecord {
  id: string;
  driverId: string;
  driverName: string;
  driverType: string;
  year: number;
  quarter: string;
  target: number;
  current: number;
  status: string;
  weight: number;
  description: string;
}

interface AdminGoalsData {
  success: boolean;
  summary: {
    totalGoals: number;
    completedGoals: number;
    overallProgress: number;
    averageProgress: number;
  };
  goals: GoalRecord[];
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

export default function AdminGoalsPage({ translations, locale }: AdminPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const settingsDisclosure = useDisclosure();

  const { data, isLoading, error } = useSWR<AdminGoalsData>(
    '/api/admin/goals',
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <AdminLayout title="Metas" translations={translations} side={<PageSettingsMenu items={[{ label: 'Configurações de Metas', onClick: settingsDisclosure.onOpen }]} />}>
        <Center minH="400px">
          <Spinner size="lg" color="red.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <AdminLayout title="Metas" translations={translations} side={<PageSettingsMenu items={[{ label: 'Configurações de Metas', onClick: settingsDisclosure.onOpen }]} />}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar metas</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados de metas.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const { summary, goals, year } = data as any;
  const displayYear = goals?.[0]?.year || year; // no mocked fallback

  // Filtrar metas
  let filtered = goals;
  if (searchTerm) {
    filtered = filtered.filter(g => 
      g.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.driverId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (filterQuarter !== 'all') {
    filtered = filtered.filter(g => g.quarter === filterQuarter);
  }
  if (filterStatus !== 'all') {
    filtered = filtered.filter(g => g.status === filterStatus);
  }

  return (
    <AdminLayout
      title={displayYear ? `Metas ${displayYear}` : 'Metas'}
      subtitle="Acompanhe o progresso das metas estratégicas"
      translations={translations}
      side={
        <HStack spacing={2}>
          <PageSettingsMenu items={[{ label: 'Configurações de Metas', onClick: settingsDisclosure.onOpen }]} />
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
        </HStack>
      }
    >
      <GoalsSettingsModal isOpen={settingsDisclosure.isOpen} onClose={settingsDisclosure.onClose} />
      {/* KPIs Resumo */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="red.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Total de Metas</StatLabel>
            <StatNumber color="red.600" fontSize="2xl">
              {summary.totalGoals}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Todas as metas{displayYear ? ` ${displayYear}` : ''}
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="green.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Metas Concluídas</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              {summary.completedGoals}
            </StatNumber>
            <StatHelpText fontSize="xs">
              {summary.totalGoals > 0 ? ((summary.completedGoals / summary.totalGoals) * 100).toFixed(0) : 0}% do total
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="blue.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Progresso Geral</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              {summary.overallProgress.toFixed(0)}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              Média ponderada
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="purple.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Progresso Médio</StatLabel>
            <StatNumber color="purple.600" fontSize="2xl">
              {summary.averageProgress.toFixed(0)}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              Por meta
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Filtros */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" mb={6}>
        <HStack spacing={4} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
          <InputGroup size="sm" flex={1} minW="200px">
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
            value={filterQuarter}
            onChange={(e) => setFilterQuarter(e.target.value)}
            size="sm"
            maxW="150px"
          >
            <option value="all">Todos Trimestres</option>
            <option value="Q1">Q1 {displayYear ?? ''}</option>
            <option value="Q2">Q2 {displayYear ?? ''}</option>
            <option value="Q3">Q3 {displayYear ?? ''}</option>
            <option value="Q4">Q4 {displayYear ?? ''}</option>
          </Select>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="sm"
            maxW="180px"
          >
            <option value="all">Todos Status</option>
            <option value="not_started">Não Iniciado</option>
            <option value="in_progress">Em Progresso</option>
            <option value="completed">Concluído</option>
            <option value="overdue">Atrasado</option>
          </Select>
        </HStack>
      </Box>

      {/* Tabela */}
      <Box bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden">
        {filtered.length === 0 ? (
          <Alert status="info" borderRadius="0" m={0}>
            <AlertIcon />
            <AlertTitle>Nenhuma meta encontrada</AlertTitle>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Tr>
                  <Th>Motorista</Th>
                  <Th>Trimestre</Th>
                  <Th>Descrição</Th>
                  <Th isNumeric>Meta</Th>
                  <Th isNumeric>Atual</Th>
                  <Th isNumeric>Progresso</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((goal) => {
                  const progress = (goal.current / goal.target) * 100;
                  const statusColor = statusColors[goal.status] || 'gray';

                  return (
                    <Tr key={goal.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="bold">
                            {goal.driverName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {goal.driverId}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" fontSize="xs">
                          {goal.quarter} {displayYear ?? ''}
                        </Badge>
                      </Td>
                      <Td fontSize="sm" color="gray.600">
                        {goal.description}
                      </Td>
                      <Td isNumeric fontSize="sm" fontWeight="bold">
                        {goal.target}
                      </Td>
                      <Td isNumeric fontSize="sm">
                        {goal.current}
                      </Td>
                      <Td isNumeric>
                        <HStack spacing={2}>
                          <Progress
                            value={Math.min(progress, 100)}
                            size="sm"
                            colorScheme={statusColor}
                            width="60px"
                            borderRadius="md"
                          />
                          <Text fontSize="sm" fontWeight="bold" minW="40px">
                            {progress.toFixed(0)}%
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={statusColor} fontSize="xs">
                          {statusLabels[goal.status] || goal.status}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Info Box */}
      <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200" mt={6}>
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <AlertTitle>Sobre Metas{displayYear ? ` ${displayYear}` : ''}</AlertTitle>
          <AlertDescription fontSize="sm">As metas são definidas pela administração e medem a evolução de motoristas ativos por trimestre.</AlertDescription>
        </VStack>
      </Alert>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  return {};
});

