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
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiDownload,
  FiSearch,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import useSWR from 'swr';
import { useState } from 'react';
import CommissionSettingsModal from '@/components/admin/modals/CommissionSettingsModal';
import { useDisclosure } from '@chakra-ui/react';

interface CommissionRecord {
  driverId: string;
  driverName: string;
  affiliateLevel: number;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  driverRevenue: number;
  baseCommission: number;
  recruitmentCommission: number;
  totalCommission: number;
}

interface AdminCommissionsData {
  success: boolean;
  summary: {
    totalCommissions: number;
    totalPaid: number;
    totalPending: number;
    averageCommission: number;
    totalDrivers: number;
  };
  commissions: CommissionRecord[];
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function AdminCommissionsPage({ translations, locale }: AdminPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const settingsDisclosure = useDisclosure();

  const { data, isLoading, error } = useSWR<AdminCommissionsData>(
    '/api/admin/commissions',
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <AdminLayout title="Comissões" translations={translations}>
        <Center minH="400px">
          <Spinner size="lg" color="red.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <AdminLayout title="Comissões" translations={translations}>
        <CommissionSettingsModal isOpen={settingsDisclosure.isOpen} onClose={settingsDisclosure.onClose} />
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar comissões</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados de comissões.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const { summary, commissions } = data;

  // Filtrar comissões
  let filtered = commissions;
  if (searchTerm) {
    filtered = filtered.filter(c => 
      c.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.driverId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (filterLevel !== 'all') {
    filtered = filtered.filter(c => c.affiliateLevel === parseInt(filterLevel));
  }

  return (
    <AdminLayout
      title="Comissões"
      subtitle="Visualize e gerencie todas as comissões de motoristas"
      translations={translations}
      side={<Button leftIcon={<Icon as={FiDollarSign} />} colorScheme="blue" variant="outline" size="sm" onClick={settingsDisclosure.onOpen}>Configurações de Comissões</Button>}
    >
      <CommissionSettingsModal isOpen={settingsDisclosure.isOpen} onClose={settingsDisclosure.onClose} />
      <CommissionSettingsModal isOpen={settingsDisclosure.isOpen} onClose={settingsDisclosure.onClose} />
      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="red.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Total Comissões</StatLabel>
            <StatNumber color="red.600" fontSize="2xl">
              €{summary.totalCommissions.toFixed(2)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Todas as semanas
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="green.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Já Pagos</StatLabel>
            <StatNumber color="green.600" fontSize="2xl">
              €{summary.totalPaid.toFixed(2)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Comissões liquidadas
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="yellow.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Pendentes</StatLabel>
            <StatNumber color="yellow.600" fontSize="2xl">
              €{summary.totalPending.toFixed(2)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Aguardando pagamento
            </StatHelpText>
          </Stat>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="blue.200">
          <Stat>
            <StatLabel fontSize="sm" color="gray.600">Motoristas Ativos</StatLabel>
            <StatNumber color="blue.600" fontSize="2xl">
              {summary.totalDrivers}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Com comissões registradas
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
            maxW="150px"
          >
            <option value="all">Todos os Níveis</option>
            <option value="1">Nível 1</option>
            <option value="2">Nível 2</option>
            <option value="3">Nível 3</option>
          </Select>
        </HStack>
      </Box>

      {/* Tabela */}
      <Box bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden">
        {filtered.length === 0 ? (
          <Alert status="info" borderRadius="0" m={0}>
            <AlertIcon />
            <AlertTitle>Nenhuma comissão encontrada</AlertTitle>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Tr>
                  <Th>Motorista</Th>
                  <Th isNumeric>Nível</Th>
                  <Th>Semana</Th>
                  <Th isNumeric>Receita</Th>
                  <Th isNumeric>Comissão Base</Th>
                  <Th isNumeric>Comissão Recrutamento</Th>
                  <Th isNumeric>Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((commission) => (
                  <Tr key={`${commission.driverId}-${commission.weekId}`} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">
                          {commission.driverName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {commission.driverId}
                        </Text>
                      </VStack>
                    </Td>
                    <Td isNumeric>
                      <Badge colorScheme="purple">
                        Nível {commission.affiliateLevel}
                      </Badge>
                    </Td>
                    <Td fontSize="sm" color="gray.600">
                      {commission.weekStart}
                    </Td>
                    <Td isNumeric fontSize="sm">
                      €{commission.driverRevenue.toFixed(2)}
                    </Td>
                    <Td isNumeric fontSize="sm" color="blue.600" fontWeight="bold">
                      €{commission.baseCommission.toFixed(2)}
                    </Td>
                    <Td isNumeric fontSize="sm" color="purple.600" fontWeight="bold">
                      €{commission.recruitmentCommission.toFixed(2)}
                    </Td>
                    <Td isNumeric fontSize="sm" fontWeight="bold" color="green.600">
                      €{commission.totalCommission.toFixed(2)}
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
          <AlertTitle>Sobre Comissões</AlertTitle>
          <AlertDescription fontSize="sm">
            Comissão Base: 5-10% da receita do motorista conforme seu nível. Comissão Recrutamento: 2-5% da receita dos motoristas que ele recrutar.
          </AlertDescription>
        </VStack>
      </Alert>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  return {};
});

