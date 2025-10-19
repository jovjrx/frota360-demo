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
  FiActivity,
  FiDownload,
  FiSearch,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import useSWR from 'swr';
import { useState } from 'react';

interface ReserveRecord {
  driverId: string;
  driverName: string;
  affiliateLevel: number;
  totalReserve: number;
  weeksCovered: number;
  daysCovered: number;
  reserveHealth: string;
  lastUpdateDate: string;
}

interface AdminReserveData {
  success: boolean;
  summary: {
    totalReservePool: number;
    averageReservePerDriver: number;
    driversWithCriticalReserve: number;
    driversWithHealthyReserve: number;
  };
  reserves: ReserveRecord[];
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

const healthColors: Record<string, string> = {
  critical: 'red',
  warning: 'yellow',
  healthy: 'green',
  excellent: 'blue',
};

const healthLabels: Record<string, string> = {
  critical: 'Crítica',
  warning: 'Aviso',
  healthy: 'Saudável',
  excellent: 'Excelente',
};

export default function AdminTechnicalReservePage({ translations, locale }: AdminPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHealth, setFilterHealth] = useState('all');

  const { data, isLoading, error } = useSWR<AdminReserveData>(
    '/api/admin/technical-reserve',
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <AdminLayout title="Reserva Técnica" translations={translations}>
        <Center minH="400px">
          <Spinner size="lg" color="red.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <AdminLayout title="Reserva Técnica" translations={translations}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar reserva técnica</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados de reserva técnica.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const { summary, reserves } = data;

  // Filtrar reservas
  let filtered = reserves;
  if (searchTerm) {
    filtered = filtered.filter(r => 
      r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.driverId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (filterHealth !== 'all') {
    filtered = filtered.filter(r => r.reserveHealth === filterHealth);
  }

  return (
    <AdminLayout
      title="Reserva Técnica"
      subtitle="Monitore a saúde financeira dos motoristas"
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
            <StatLabel fontSize="sm" color="gray.600">Pool Total de Reserva</StatLabel>
            <StatNumber color="red.600" fontSize="2xl">
              €{summary.totalReservePool.toFixed(2)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              25% do lucro total
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="green.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Motoristas Saudáveis</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              {summary.driversWithHealthyReserve}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Com reserva adequada
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="red.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Motoristas em Risco</StatLabel>
            <StatNumber color="red.600" fontSize="2xl">
              {summary.driversWithCriticalReserve}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Reserva crítica
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="blue.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Média por Motorista</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              €{summary.averageReservePerDriver.toFixed(2)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Reserva média
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Alerta de Motoristas em Risco */}
      {summary.driversWithCriticalReserve > 0 && (
        <Alert status="warning" borderRadius="lg" bg="red.50" borderColor="red.200" mb={6}>
          <AlertIcon as={FiAlertTriangle} />
          <VStack align="start" spacing={1}>
            <AlertTitle>Atenção: Motoristas em Risco</AlertTitle>
            <AlertDescription fontSize="sm">
              {summary.driversWithCriticalReserve} motorista(s) com reserva técnica crítica. Considere oferecer suporte ou ajustar comissões.
            </AlertDescription>
          </VStack>
        </Alert>
      )}

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
            value={filterHealth}
            onChange={(e) => setFilterHealth(e.target.value)}
            size="sm"
            maxW="200px"
          >
            <option value="all">Todos Status</option>
            <option value="critical">Crítica</option>
            <option value="warning">Aviso</option>
            <option value="healthy">Saudável</option>
            <option value="excellent">Excelente</option>
          </Select>
        </HStack>
      </Box>

      {/* Tabela */}
      <Box bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden">
        {filtered.length === 0 ? (
          <Alert status="info" borderRadius="0" m={0}>
            <AlertIcon />
            <AlertTitle>Nenhuma reserva encontrada</AlertTitle>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Tr>
                  <Th>Motorista</Th>
                  <Th isNumeric>Nível</Th>
                  <Th isNumeric>Reserva Total</Th>
                  <Th isNumeric>Semanas Cobertas</Th>
                  <Th isNumeric>Dias Cobertos</Th>
                  <Th>Status</Th>
                  <Th>Saúde</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((reserve) => (
                  <Tr key={reserve.driverId} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">
                          {reserve.driverName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {reserve.driverId}
                        </Text>
                      </VStack>
                    </Td>
                    <Td isNumeric>
                      <Badge colorScheme="purple">
                        Nível {reserve.affiliateLevel}
                      </Badge>
                    </Td>
                    <Td isNumeric fontSize="sm" fontWeight="bold">
                      €{reserve.totalReserve.toFixed(2)}
                    </Td>
                    <Td isNumeric fontSize="sm">
                      {reserve.weeksCovered} semanas
                    </Td>
                    <Td isNumeric fontSize="sm">
                      {reserve.daysCovered} dias
                    </Td>
                    <Td fontSize="xs" color="gray.600">
                      {reserve.lastUpdateDate}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Box
                          width="12px"
                          height="12px"
                          borderRadius="full"
                          bg={`${healthColors[reserve.reserveHealth] || 'gray'}.500`}
                        />
                        <Badge colorScheme={healthColors[reserve.reserveHealth] || 'gray'} fontSize="xs">
                          {healthLabels[reserve.reserveHealth] || reserve.reserveHealth}
                        </Badge>
                      </HStack>
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
          <AlertTitle>Sobre Reserva Técnica</AlertTitle>
          <AlertDescription fontSize="sm">
            A reserva técnica é 25% do lucro mensal de cada motorista, mantida para cobrir períodos de baixa receita ou emergências. A saúde é determinada por quantas semanas de cobertura o motorista tem (6+ semanas = Excelente).
          </AlertDescription>
        </VStack>
      </Alert>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  return {};
});

