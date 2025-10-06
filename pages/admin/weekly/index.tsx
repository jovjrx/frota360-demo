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
  Input,
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
import { loadTranslations, getTranslation } from '@/lib/translations';
import AdminLayout from '@/components/layouts/AdminLayout';
import { ADMIN, COMMON } from '@/translations';
import { PageProps } from '@/interface/Global';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

interface WeeklyPayoutProps extends PageProps {
  translations: {
    common: any;
    admin: any;
  };
  locale: string;
  weeklyRecords: DriverWeeklyRecord[];
  weekOptions: WeekOption[];
  currentWeek: string;
}

export default function WeeklyPayoutPage({ 
  translations, 
  locale, 
  tCommon, 
  tPage, 
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

  const t = tCommon || ((key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables);
  });

  const tAdmin = tPage || ((key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.admin, key, variables);
  });

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
      const response = await fetch('/api/admin/weekly-records/sync');
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
    const matchesWeek = filterWeek === 'all' || record.weekStart === filterWeek;
    const matchesDriver = filterDriver === 'all' || record.driverId === filterDriver;
    const matchesStatus = filterStatus === 'all' || record.paymentStatus === filterStatus;
    return matchesWeek && matchesDriver && matchesStatus;
  });

  // Calcular totais
  const totals = filteredRecords.reduce((acc, record) => ({
    grossTotal: acc.grossTotal + record.grossTotal,
    commissionAmount: acc.commissionAmount + record.commissionAmount,
    fuel: acc.fuel + record.fuel,
    netPayout: acc.netPayout + record.netPayout,
  }), { grossTotal: 0, commissionAmount: 0, fuel: 0, netPayout: 0 });

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
                Exportar Excel
              </Button>
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Resumo */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Bruto</StatLabel>
              <StatNumber color="green.600">{formatCurrency(totals.grossTotal)}</StatNumber>
              <StatHelpText>{filteredRecords.length} registros</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Comissões (7%)</StatLabel>
              <StatNumber color="purple.600">{formatCurrency(totals.commissionAmount)}</StatNumber>
              <StatHelpText>
                {totals.grossTotal ? ((totals.commissionAmount / totals.grossTotal) * 100).toFixed(1) : 0}% do bruto
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Combustível</StatLabel>
              <StatNumber color="orange.600">{formatCurrency(totals.fuel)}</StatNumber>
              <StatHelpText>
                {totals.grossTotal ? ((totals.fuel / totals.grossTotal) * 100).toFixed(1) : 0}% do bruto
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Valor Líquido</StatLabel>
              <StatNumber color="blue.600">{formatCurrency(totals.netPayout)}</StatNumber>
              <StatHelpText>A transferir</StatHelpText>
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
                  <Th isNumeric>Uber Viagens</Th>
                  <Th isNumeric>Uber Gorjetas</Th>
                  <Th isNumeric>Uber Portagens</Th>
                  <Th isNumeric>Bolt Viagens</Th>
                  <Th isNumeric>Bolt Gorjetas</Th>
                  <Th isNumeric>Total Bruto</Th>
                  <Th isNumeric>Combustível</Th>
                  <Th isNumeric>Comissão 7%</Th>
                  <Th isNumeric>Valor Líquido</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRecords.length === 0 ? (
                  <Tr>
                    <Td colSpan={13} textAlign="center" py={8}>
                      <Text color="gray.500">Nenhum registro encontrado</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredRecords.map((record) => (
                    <Tr key={record.id}>
                      <Td>
                        <Text fontSize="xs" fontWeight="medium">
                          {formatDate(record.weekStart)} - {formatDate(record.weekEnd)}
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
                        <Text fontSize="sm">{formatCurrency(record.uberTrips)}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm">{formatCurrency(record.uberTips)}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm">{formatCurrency(record.uberTolls)}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm">{formatCurrency(record.boltTrips)}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm">{formatCurrency(record.boltTips)}</Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                          {formatCurrency(record.grossTotal)}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm" color="orange.600">
                          {formatCurrency(record.fuel)}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm" color="purple.600">
                          {formatCurrency(record.commissionAmount)}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm" fontWeight="bold" color="blue.600">
                          {formatCurrency(record.netPayout)}
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
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();

    // Buscar registros semanais dos últimos 8 semanas
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const weeklyRecordsRef = db.collection('weeklyRecords');
    const snapshot = await weeklyRecordsRef
      .where('weekStart', '>=', eightWeeksAgo.toISOString().split('T')[0])
      .orderBy('weekStart', 'desc')
      .get();

    const weeklyRecords: DriverWeeklyRecord[] = [];
    snapshot.forEach((doc) => {
      weeklyRecords.push({ id: doc.id, ...doc.data() } as DriverWeeklyRecord);
    });

    // Gerar opções de semanas
    const weekOptions: WeekOption[] = [];
    const weeks = new Set(weeklyRecords.map(r => r.weekStart));
    
    weeks.forEach(weekStart => {
      const start = new Date(weekStart);
      const record = weeklyRecords.find(r => r.weekStart === weekStart);
      const end = record ? new Date(record.weekEnd) : new Date(start);
      end.setDate(start.getDate() + 6);

      weekOptions.push({
        label: `${start.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
        value: weekStart,
        start: weekStart,
        end: record?.weekEnd || end.toISOString().split('T')[0],
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
