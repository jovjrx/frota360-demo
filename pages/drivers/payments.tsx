import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  Avatar,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Icon,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FiDollarSign, 
  FiDownload, 
  FiCalendar,
  FiSearch,
  FiFilter,
  FiTrendingUp,
  FiCreditCard,
  FiClock
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import StandardLayout from '@/components/layouts/StandardLayout';
import { useState, useMemo } from 'react';

interface DriverPaymentsProps {
  driver: any;
  payments: any[];
  translations: Record<string, any>;
  userData: any;
}

export default function DriverPayments({ 
  driver, 
  payments,
  translations,
  userData
}: DriverPaymentsProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
  const tDriver = (key: string) => translations.driver?.[key] || key;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = 
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      
      const matchesPeriod = periodFilter === 'all' || 
        (periodFilter === 'this_month' && isThisMonth(payment.date)) ||
        (periodFilter === 'last_month' && isLastMonth(payment.date));
      
      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [payments, searchTerm, statusFilter, periodFilter]);

  const isThisMonth = (date: string) => {
    const paymentDate = new Date(date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && 
           paymentDate.getFullYear() === now.getFullYear();
  };

  const isLastMonth = (date: string) => {
    const paymentDate = new Date(date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    return paymentDate.getMonth() === lastMonth.getMonth() && 
           paymentDate.getFullYear() === lastMonth.getFullYear();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'processing': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'failed': return 'Falhou';
      default: return 'Desconhecido';
    }
  };

  const totalEarnings = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyEarnings = payments
    .filter(p => p.status === 'paid' && isThisMonth(p.date))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const exportPayments = () => {
    const csvContent = [
      ['ID', 'Data', 'Descrição', 'Valor', 'Status'],
      ...filteredPayments.map(payment => [
        payment.id,
        new Date(payment.date).toLocaleDateString('pt-BR'),
        payment.description || '',
        `€${payment.amount.toFixed(2)}`,
        getStatusText(payment.status)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pagamentos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Pagamentos - Conduz.pt</title>
      </Head>
      
      <StandardLayout
        title="Meus Pagamentos"
        subtitle="Acompanhe seus ganhos e pagamentos"
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={0}
        stats={[
          {
            label: 'Total Recebido',
            value: `€${totalEarnings.toFixed(2)}`,
            helpText: 'Todos os tempos',
            color: 'green.500'
          },
          {
            label: 'Este Mês',
            value: `€${monthlyEarnings.toFixed(2)}`,
            helpText: 'Janeiro 2024',
            color: 'blue.500'
          },
          {
            label: 'Pendente',
            value: `€${pendingAmount.toFixed(2)}`,
            helpText: 'Aguardando pagamento',
            color: 'yellow.500'
          },
          {
            label: 'Total de Pagamentos',
            value: payments.length,
            helpText: 'Histórico completo',
            color: 'purple.500'
          }
        ]}
        actions={
          <HStack spacing={4}>
            <Button leftIcon={<FiDownload />} variant="outline" onClick={exportPayments}>
              Exportar CSV
            </Button>
          </HStack>
        }
      >
        {/* Filters */}
        <Card bg="white" borderColor="gray.200">
          <CardBody>
            <HStack spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <FiSearch />
                </InputLeftElement>
                <Input
                  placeholder="Buscar pagamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">Todos os Status</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="failed">Falhou</option>
              </Select>
              <Select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">Todos os Períodos</option>
                <option value="this_month">Este Mês</option>
                <option value="last_month">Mês Passado</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Payments Table */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Histórico de Pagamentos ({filteredPayments.length})</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Data</Th>
                    <Th>Descrição</Th>
                    <Th>Valor</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPayments.map((payment) => (
                    <Tr key={payment.id}>
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          #{payment.id}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(payment.date).toLocaleDateString('pt-BR')}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {payment.description || 'Pagamento semanal'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="bold" color="green.500">
                          €{payment.amount.toFixed(2)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(payment.status)}>
                          {getStatusText(payment.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button size="xs" leftIcon={<FiDownload />} variant="outline">
                            Comprovante
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            
            {filteredPayments.length === 0 && (
              <Box textAlign="center" py={8}>
                <Icon as={FiDollarSign} boxSize={12} color="gray.300" mb={4} />
                <Text color="gray.500">Nenhum pagamento encontrado</Text>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Payment Methods */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Métodos de Pagamento</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                <HStack>
                  <Icon as={FiCreditCard} color="blue.500" />
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="medium">Conta Bancária</Text>
                    <Text fontSize="sm" color="gray.600">
                      **** **** **** 1234
                    </Text>
                  </VStack>
                </HStack>
                <Badge colorScheme="green">Ativo</Badge>
              </HStack>
              
              <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                <HStack>
                  <Icon as={FiClock} color="yellow.500" />
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="medium">Próximo Pagamento</Text>
                    <Text fontSize="sm" color="gray.600">
                      Segunda-feira, 29 de Janeiro
                    </Text>
                  </VStack>
                </HStack>
                <Text fontSize="sm" fontWeight="bold" color="green.500">
                  €{pendingAmount.toFixed(2)}
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </StandardLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const translations = await loadTranslations('pt', ['common', 'driver']);

    // Mock data - replace with actual data fetching
    const driver = {
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      status: 'active',
      avatar: null,
    };

    const payments = [
      {
        id: 'P001',
        date: '2024-01-22',
        amount: 450.75,
        status: 'paid',
        description: 'Pagamento semanal - Semana 3',
      },
      {
        id: 'P002',
        date: '2024-01-15',
        amount: 320.50,
        status: 'paid',
        description: 'Pagamento semanal - Semana 2',
      },
      {
        id: 'P003',
        date: '2024-01-08',
        amount: 280.25,
        status: 'paid',
        description: 'Pagamento semanal - Semana 1',
      },
      {
        id: 'P004',
        date: '2024-01-29',
        amount: 380.00,
        status: 'pending',
        description: 'Pagamento semanal - Semana 4',
      },
      {
        id: 'P005',
        date: '2023-12-25',
        amount: 150.00,
        status: 'paid',
        description: 'Bônus de Natal',
      },
    ];

    return {
      props: {
        driver,
        payments,
        translations,
        userData: driver,
      },
    };
  } catch (error) {
    console.error('Error loading driver payments:', error);
    return {
      props: {
        driver: null,
        payments: [],
        translations: { common: {}, driver: {} },
        userData: null,
      },
    };
  }
};
