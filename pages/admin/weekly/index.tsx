import { useState } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Select,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiDownload,
  FiCheck,
  FiEye,
  FiUpload,
} from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { PageProps } from '@/interface/Global';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { getFirestore } from 'firebase-admin/firestore';

interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

interface WeeklyPayoutProps extends PageProps {
  weeklyRecords: DriverWeeklyRecord[];
  weekOptions: WeekOption[];
  currentWeek: string;
}

export default function WeeklyPayoutPage({ 
  weeklyRecords: initialRecords,
  weekOptions,
  currentWeek 
}: WeeklyPayoutProps) {
  const [records, setRecords] = useState<DriverWeeklyRecord[]>(initialRecords);
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/weekly-records/list');
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
        toast({
          title: 'Dados atualizados',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAsPaid = async (recordId: string) => {
    try {
      const response = await fetch(`/api/admin/weekly-records/${recordId}/mark-paid`, {
        method: 'POST',
      });
      if (response.ok) {
        setRecords(records.map(r => 
          r.id === recordId ? { ...r, paymentStatus: 'paid' as const, paymentDate: new Date().toISOString() } : r
        ));
        toast({
          title: 'Marcado como pago',
          status: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao marcar como pago',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleExportExcel = () => {
    window.open(`/api/admin/weekly-records/export?week=${filterWeek}`, '_blank');
  };

  const filteredRecords = records.filter(record => {
    const matchesWeek = filterWeek === 'all' || record.weekId === filterWeek;
    const matchesDriver = filterDriver === 'all' || record.driverId === filterDriver;
    const matchesStatus = filterStatus === 'all' || record.paymentStatus === filterStatus;
    return matchesWeek && matchesDriver && matchesStatus;
  });

  // Calcular totais
  const totals = filteredRecords.reduce((acc, record) => ({
    ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
    ivaValor: acc.ivaValor + record.ivaValor,
    despesasAdm: acc.despesasAdm + record.despesasAdm,
    combustivel: acc.combustivel + record.combustivel,
    viaverde: acc.viaverde + record.viaverde,
    aluguel: acc.aluguel + record.aluguel,
    totalDespesas: acc.totalDespesas + record.totalDespesas,
    repasse: acc.repasse + record.repasse,
  }), { 
    ganhosTotal: 0, 
    ivaValor: 0, 
    despesasAdm: 0, 
    combustivel: 0, 
    viaverde: 0, 
    aluguel: 0,
    totalDespesas: 0, 
    repasse: 0 
  });

  // Obter lista única de motoristas
  const drivers = Array.from(new Set(records.map(r => ({ id: r.driverId, name: r.driverName }))
    .map(d => JSON.stringify(d))))
    .map(d => JSON.parse(d));

  return (
    <AdminLayout
      title="Controle Semanal de Repasses"
      subtitle="Gestão de pagamentos semanais aos motoristas"
      breadcrumbs={[{ label: 'Controle Semanal' }]}
    >
      <VStack spacing={6} align="stretch">
        {/* Filtros e Ações */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap" justify="space-between">
              <HStack spacing={4} flexWrap="wrap">
                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">Semana:</Text>
                  <Select 
                    value={filterWeek} 
                    onChange={(e) => setFilterWeek(e.target.value)} 
                    w="200px"
                  >
                    <option value="all">Todas</option>
                    {weekOptions.map(week => (
                      <option key={week.value} value={week.value}>
                        {week.label}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">Motorista:</Text>
                  <Select 
                    value={filterDriver} 
                    onChange={(e) => setFilterDriver(e.target.value)} 
                    w="250px"
                  >
                    <option value="all">Todos</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">Status:</Text>
                  <Select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)} 
                    w="150px"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="cancelled">Cancelado</option>
                  </Select>
                </Box>
              </HStack>

              <HStack spacing={2}>
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => window.location.href = '/admin/weekly/import'}
                  colorScheme="blue"
                  size="sm"
                >
                  Importar Dados
                </Button>
                <Button
                  leftIcon={<Icon as={FiRefreshCw} />}
                  onClick={handleRefresh}
                  isLoading={isRefreshing}
                  size="sm"
                >
                  Atualizar
                </Button>
                <Button
                  leftIcon={<Icon as={FiDownload} />}
                  onClick={handleExportExcel}
                  colorScheme="green"
                  size="sm"
                >
                  Exportar CSV
                </Button>
              </HStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Resumo */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Ganhos Total</StatLabel>
                <StatNumber fontSize="lg" color="green.600">{formatCurrency(totals.ganhosTotal)}</StatNumber>
                <StatHelpText fontSize="xs">{filteredRecords.length} registros</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">IVA 6%</StatLabel>
                <StatNumber fontSize="lg" color="orange.600">{formatCurrency(totals.ivaValor)}</StatNumber>
                <StatHelpText fontSize="xs">
                  {totals.ganhosTotal ? ((totals.ivaValor / totals.ganhosTotal) * 100).toFixed(1) : 0}% do total
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Despesas Adm 7%</StatLabel>
                <StatNumber fontSize="lg" color="purple.600">{formatCurrency(totals.despesasAdm)}</StatNumber>
                <StatHelpText fontSize="xs">
                  Sobre ganhos - IVA
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Repasse Líquido</StatLabel>
                <StatNumber fontSize="lg" color="blue.600">{formatCurrency(totals.repasse)}</StatNumber>
                <StatHelpText fontSize="xs">A transferir</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Despesas Detalhadas */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Combustível</StatLabel>
                <StatNumber fontSize="md" color="orange.600">{formatCurrency(totals.combustivel)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">ViaVerde</StatLabel>
                <StatNumber fontSize="md" color="red.600">{formatCurrency(totals.viaverde)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Aluguel</StatLabel>
                <StatNumber fontSize="md" color="purple.600">{formatCurrency(totals.aluguel)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabela de Repasses Semanais */}
        <Card>
          <CardHeader>
            <Heading size="md">Registros Semanais</Heading>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Semana</Th>
                    <Th>Motorista</Th>
                    <Th isNumeric>Uber</Th>
                    <Th isNumeric>Bolt</Th>
                    <Th isNumeric>Ganhos Total</Th>
                    <Th isNumeric>IVA 6%</Th>
                    <Th isNumeric>Desp. Adm 7%</Th>
                    <Th isNumeric>Combustível</Th>
                    <Th isNumeric>ViaVerde</Th>
                    <Th isNumeric>Aluguel</Th>
                    <Th isNumeric>Repasse</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRecords.length === 0 ? (
                    <Tr>
                      <Td colSpan={13} textAlign="center" py={8}>
                        <Text color="gray.500">Nenhum registro encontrado</Text>
                        <Button
                          mt={4}
                          leftIcon={<Icon as={FiUpload} />}
                          onClick={() => window.location.href = '/admin/weekly/import'}
                          colorScheme="blue"
                          size="sm"
                        >
                          Importar Dados da Semana
                        </Button>
                      </Td>
                    </Tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <Tr key={record.id}>
                        <Td>
                          <Text fontSize="xs" fontWeight="medium">
                            {formatDate(record.weekStart)} - {formatDate(record.weekEnd)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {record.weekId}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontWeight="medium">{record.driverName}</Text>
                          {record.iban && (
                            <Text fontSize="xs" color="gray.500">
                              {record.iban.slice(0, 8)}...{record.iban.slice(-4)}
                            </Text>
                          )}
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm">{formatCurrency(record.uberTotal)}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm">{formatCurrency(record.boltTotal)}</Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" fontWeight="bold" color="green.600">
                            {formatCurrency(record.ganhosTotal)}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" color="orange.600">
                            {formatCurrency(record.ivaValor)}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" color="purple.600">
                            {formatCurrency(record.despesasAdm)}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" color="orange.600">
                            {formatCurrency(record.combustivel)}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" color="red.600">
                            {formatCurrency(record.viaverde)}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" color="purple.600">
                            {formatCurrency(record.aluguel)}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm" fontWeight="bold" color="blue.600">
                            {formatCurrency(record.repasse)}
                          </Text>
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={
                              record.paymentStatus === 'paid' ? 'green' : 
                              record.paymentStatus === 'cancelled' ? 'red' : 
                              'yellow'
                            }
                          >
                            {record.paymentStatus === 'paid' ? 'PAGO' :
                             record.paymentStatus === 'cancelled' ? 'CANCELADO' :
                             'PENDENTE'}
                          </Badge>
                          {record.paymentDate && (
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {formatDate(record.paymentDate.split('T')[0])}
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {record.paymentStatus === 'pending' && (
                              <Tooltip label="Marcar como Pago">
                                <IconButton
                                  aria-label="Marcar como pago"
                                  icon={<Icon as={FiCheck} />}
                                  size="sm"
                                  colorScheme="green"
                                  variant="ghost"
                                  onClick={() => handleMarkAsPaid(record.id)}
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Ver Detalhes">
                              <IconButton
                                aria-label="Ver detalhes"
                                icon={<Icon as={FiEye} />}
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  // TODO: Modal de detalhes
                                  toast({
                                    title: 'Detalhes',
                                    description: `Visualização detalhada de ${record.driverName}`,
                                    status: 'info',
                                    duration: 2000,
                                  });
                                }}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);

  if ('redirect' in authResult) {
    return authResult;
  }

  try {
    const db = getFirestore();

    // Buscar todos os registros semanais
    const snapshot = await db.collection('driverWeeklyRecords')
      .orderBy('weekStart', 'desc')
      .limit(500)
      .get();

    const weeklyRecords: DriverWeeklyRecord[] = [];
    snapshot.forEach((doc) => {
      weeklyRecords.push({ id: doc.id, ...doc.data() } as DriverWeeklyRecord);
    });

    // Gerar opções de semanas
    const weekOptions: WeekOption[] = [];
    const weeks = new Map<string, { start: string; end: string }>();
    
    weeklyRecords.forEach(record => {
      if (!weeks.has(record.weekId)) {
        weeks.set(record.weekId, {
          start: record.weekStart,
          end: record.weekEnd,
        });
      }
    });

    weeks.forEach((dates, weekId) => {
      const start = new Date(dates.start);
      const end = new Date(dates.end);

      weekOptions.push({
        label: `${start.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
        value: weekId,
        start: dates.start,
        end: dates.end,
      });
    });

    // Ordenar opções por data mais recente
    weekOptions.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    // Semana atual (mais recente)
    const currentWeek = weekOptions[0]?.value || 'all';

    return {
      props: {
        ...authResult.props,
        weeklyRecords,
        weekOptions,
        currentWeek,
      },
    };
  } catch (error) {
    console.error('Error fetching weekly records:', error);
    return {
      props: {
        ...authResult.props,
        weeklyRecords: [],
        weekOptions: [],
        currentWeek: 'all',
      },
    };
  }
};
