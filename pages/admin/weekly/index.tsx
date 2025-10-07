import { useState, useEffect } from 'react';
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
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiUpload,
  FiFileText,
} from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { PageProps } from '@/interface/Global';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getWeekOptions } from '@/lib/admin/adminQueries';


interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

interface DriverRecord {
  driverId: string;
  driverName: string;
  driverType: string;
  vehicle: string;
  weekStart: string;
  weekEnd: string;
  uberTotal: number;
  boltTotal: number;
  ganhosTotal: number;
  iva: number;
  ganhosMenosIva: number;
  despesasAdm: number;
  combustivel: number;
  portagens: number;
  aluguel: number;
  valorLiquido: number;
  iban: string;
  status: string;
}

interface WeeklyPageProps extends PageProps {
  weekOptions: WeekOption[];
  currentWeek: string;
}

const getWeekOptions = (): WeekOption[] => {
  const options: WeekOption[] = [];
  const today = new Date();
  
  // Gerar últimas 12 semanas
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1 - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    options.push({
      label: `${weekStart.toLocaleDateString('pt-PT')} - ${weekEnd.toLocaleDateString('pt-PT')}`,
      value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    });
  }
  
  return options;
};

export default function WeeklyNewPage({ weekOptions, currentWeek }: WeeklyPageProps) {
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [records, setRecords] = useState<DriverRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  const toast = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const loadWeekData = async () => {
    const selectedWeek = weekOptions.find(w => w.value === filterWeek);
    if (!selectedWeek) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/weekly/process-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: selectedWeek.start,
          weekEnd: selectedWeek.end,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Tente novamente',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeekData();
  }, [filterWeek]);

  const handleGenerateResumos = async () => {
    setIsGeneratingResumos(true);
    try {
      const selectedWeek = weekOptions.find(w => w.value === filterWeek);
      if (!selectedWeek) {
        toast({
          title: 'Erro',
          description: 'Selecione uma semana',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const response = await fetch('/api/admin/weekly/generate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: selectedWeek.start,
          weekEnd: selectedWeek.end,
          records, // Passar registros já processados
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar resumos');
      }

      // Download do arquivo ZIP
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resumos_${selectedWeek.start}_a_${selectedWeek.end}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Resumos gerados com sucesso!',
        description: 'O arquivo ZIP contém o Excel e os PDFs individuais',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao gerar resumos:', error);
      toast({
        title: 'Erro ao gerar resumos',
        description: 'Tente novamente',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsGeneratingResumos(false);
    }
  };

  // Calcular totais
  const totals = records.reduce((acc, record) => ({
    ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
    iva: acc.iva + record.iva,
    despesasAdm: acc.despesasAdm + record.despesasAdm,
    combustivel: acc.combustivel + record.combustivel,
    portagens: acc.portagens + record.portagens,
    aluguel: acc.aluguel + record.aluguel,
    valorLiquido: acc.valorLiquido + record.valorLiquido,
  }), {
    ganhosTotal: 0,
    iva: 0,
    despesasAdm: 0,
    combustivel: 0,
    portagens: 0,
    aluguel: 0,
    valorLiquido: 0,
  });

  return (
    <AdminLayout
      title="Controle Semanal de Repasses"
      subtitle="Gestão de pagamentos semanais aos motoristas"
      breadcrumbs={[{ label: 'Controle Semanal' }]}
    >
      <VStack spacing={6} align="stretch">
        {/* Alerta */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Nova estrutura: Dados processados em tempo real das collections raw
        </Alert>

        {/* Filtros e Ações */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap" justify="space-between">
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">Semana:</Text>
                  <Select 
                    value={filterWeek} 
                    onChange={(e) => setFilterWeek(e.target.value)} 
                    w="300px"
                  >
                    {weekOptions.map(week => (
                      <option key={week.value} value={week.value}>
                        {week.label}
                      </option>
                    ))}
                  </Select>
                </Box>
              </HStack>

              <HStack spacing={2}>
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => window.location.href = '/admin/weekly/import-new'}
                  colorScheme="blue"
                  size="sm"
                >
                  Importar Dados
                </Button>
                <Button
                  leftIcon={<Icon as={FiRefreshCw} />}
                  onClick={loadWeekData}
                  isLoading={isLoading}
                  size="sm"
                >
                  Atualizar
                </Button>
                <Button
                  leftIcon={<Icon as={FiFileText} />}
                  onClick={handleGenerateResumos}
                  colorScheme="purple"
                  size="sm"
                  isLoading={isGeneratingResumos}
                  loadingText="Gerando..."
                  isDisabled={records.length === 0}
                >
                  Gerar Resumos
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
                <StatHelpText fontSize="xs">{records.length} motoristas</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Total Descontos</StatLabel>
                <StatNumber fontSize="lg" color="red.600">
                  {formatCurrency(totals.iva + totals.despesasAdm + totals.combustivel + totals.portagens + totals.aluguel)}
                </StatNumber>
                <StatHelpText fontSize="xs">IVA + Desp. + Comb. + Port. + Alug.</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Combustível</StatLabel>
                <StatNumber fontSize="lg" color="orange.600">{formatCurrency(totals.combustivel)}</StatNumber>
                <StatHelpText fontSize="xs">Prio</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel fontSize="xs">Valor Líquido</StatLabel>
                <StatNumber fontSize="lg" color="blue.600">{formatCurrency(totals.valorLiquido)}</StatNumber>
                <StatHelpText fontSize="xs">Total a pagar</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabela de Registros */}
        <Card>
          <CardHeader>
            <Heading size="md">Registros da Semana</Heading>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4} color="gray.600">Carregando dados...</Text>
              </Box>
            ) : records.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.600">Nenhum registro encontrado para esta semana</Text>
                <Button
                  mt={4}
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => window.location.href = '/admin/weekly/import-new'}
                  colorScheme="blue"
                >
                  Importar Dados
                </Button>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Motorista</Th>
                      <Th>Tipo</Th>
                      <Th isNumeric>Uber</Th>
                      <Th isNumeric>Bolt</Th>
                      <Th isNumeric>Ganhos Total</Th>
                      <Th isNumeric>IVA 6%</Th>
                      <Th isNumeric>Desp. Adm 7%</Th>
                      <Th isNumeric>Combustível</Th>
                      <Th isNumeric>Portagens</Th>
                      <Th isNumeric>Aluguel</Th>
                      <Th isNumeric>Valor Líquido</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {records.map((record, index) => (
                      <Tr key={index}>
                        <Td>
                          <Text fontWeight="medium">{record.driverName}</Text>
                          <Text fontSize="xs" color="gray.600">{record.vehicle}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={record.driverType === 'Locatário' ? 'purple' : 'green'}>
                            {record.driverType}
                          </Badge>
                        </Td>
                        <Td isNumeric>{formatCurrency(record.uberTotal)}</Td>
                        <Td isNumeric>{formatCurrency(record.boltTotal)}</Td>
                        <Td isNumeric fontWeight="bold">{formatCurrency(record.ganhosTotal)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.iva)}</Td>
                        <Td isNumeric color="red.600">-{formatCurrency(record.despesasAdm)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.combustivel)}</Td>
                        <Td isNumeric color="orange.600">-{formatCurrency(record.portagens)}</Td>
                        <Td isNumeric color="purple.600">-{formatCurrency(record.aluguel)}</Td>
                        <Td isNumeric fontWeight="bold" color="blue.600">
                          {formatCurrency(record.valorLiquido)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>
    </AdminLayout>
  );
}



export const getServerSideProps = withAdminSSR(async (context, user) => {
  const weekOptions = getWeekOptions(12);
  const currentWeek = weekOptions[0].value;
  
  return {
    weekOptions,
    currentWeek,
  };
});
