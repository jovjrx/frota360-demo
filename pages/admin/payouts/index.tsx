import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withAdmin } from '@/lib/auth/rbac';
import { store } from '@/lib/store';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  useToast,
  Checkbox,
} from '@chakra-ui/react';
import { FiSearch, FiDollarSign, FiDownload, FiCheck } from 'react-icons/fi';
import { useState } from 'react';

interface PayoutsPageProps {
  payouts: any[];
  drivers: any[];
}

export default function PayoutsPage({ payouts: initialPayouts, drivers }: PayoutsPageProps) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const filteredPayouts = payouts.filter(payout => {
    const matchesFilter = filter === 'all' || payout.status === filter;
    const driver = drivers.find(d => d.id === payout.driverId);
    const matchesSearch = driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver?.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleMarkPaid = async () => {
    if (selectedPayouts.length === 0) {
      toast({
        title: 'Nenhum pagamento selecionado',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/payouts/mark-paid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutIds: selectedPayouts }),
      });

      if (response.ok) {
        setPayouts(prev => prev.map(payout => 
          selectedPayouts.includes(payout.id) 
            ? { ...payout, status: 'paid', paidAt: Date.now() }
            : payout
        ));
        setSelectedPayouts([]);
        
        toast({
          title: 'Pagamentos marcados como pagos',
          description: `${selectedPayouts.length} pagamentos processados`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to mark payouts as paid');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao marcar pagamentos como pagos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayouts(filteredPayouts.filter(p => p.status === 'pending').map(p => p.id));
    } else {
      setSelectedPayouts([]);
    }
  };

  const handleSelectPayout = (payoutId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayouts(prev => [...prev, payoutId]);
    } else {
      setSelectedPayouts(prev => prev.filter(id => id !== payoutId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <>
      <Head>
        <title>Gerenciar Pagamentos - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg="gray.50">
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  Gerenciar Pagamentos
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {filteredPayouts.length} pagamentos encontrados
                </Text>
              </VStack>
              <HStack spacing={2}>
                <Button 
                  leftIcon={<FiDownload />} 
                  variant="outline"
                  size="sm"
                >
                  Exportar CSV
                </Button>
                <Button 
                  leftIcon={<FiDollarSign />} 
                  colorScheme="green"
                  onClick={onOpen}
                >
                  Calcular Pagamentos
                </Button>
              </HStack>
            </HStack>
          </Box>
        </Box>

        {/* Main Content */}
        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={6} align="stretch">
            {/* Filters */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <HStack spacing={4}>
                  <InputGroup maxW="300px">
                    <InputLeftElement>
                      <FiSearch />
                    </InputLeftElement>
                    <Input
                      placeholder="Buscar motoristas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  <Select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    maxW="200px"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="paid">Pagos</option>
                    <option value="failed">Falharam</option>
                  </Select>
                </HStack>
              </CardBody>
            </Card>

            {/* Bulk Actions */}
            {selectedPayouts.length > 0 && (
              <Card bg="blue.50" borderColor="blue.200">
                <CardBody>
                  <HStack justifyContent="space-between">
                    <Text fontWeight="medium">
                      {selectedPayouts.length} pagamentos selecionados
                    </Text>
                    <Button 
                      leftIcon={<FiCheck />} 
                      colorScheme="green"
                      onClick={handleMarkPaid}
                    >
                      Marcar como Pagos
                    </Button>
                  </HStack>
                </CardBody>
              </Card>
            )}

            {/* Payouts Table */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>
                          <Checkbox
                            isChecked={selectedPayouts.length === filteredPayouts.filter(p => p.status === 'pending').length}
                            isIndeterminate={selectedPayouts.length > 0 && selectedPayouts.length < filteredPayouts.filter(p => p.status === 'pending').length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </Th>
                        <Th>Motorista</Th>
                        <Th>Período</Th>
                        <Th>Receita Bruta</Th>
                        <Th>Comissão</Th>
                        <Th>Taxas</Th>
                        <Th>Líquido</Th>
                        <Th>Status</Th>
                        <Th>Data de Pagamento</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredPayouts.map((payout) => {
                        const driver = drivers.find(d => d.id === payout.driverId);
                        return (
                          <Tr key={payout.id}>
                            <Td>
                              {payout.status === 'pending' && (
                                <Checkbox
                                  isChecked={selectedPayouts.includes(payout.id)}
                                  onChange={(e) => handleSelectPayout(payout.id, e.target.checked)}
                                />
                              )}
                            </Td>
                            <Td>
                              <VStack align="flex-start" spacing={0}>
                                <Text fontWeight="medium">
                                  {driver?.name || 'Motorista não encontrado'}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {driver?.email || payout.driverId.slice(0, 8)}...
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {new Date(payout.periodStart).toLocaleDateString('pt-BR')}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {new Date(payout.periodEnd).toLocaleDateString('pt-BR')}
                              </Text>
                            </Td>
                            <Td>{formatCurrency(payout.grossCents)}</Td>
                            <Td>{formatCurrency(payout.commissionCents)}</Td>
                            <Td>{formatCurrency(payout.feesCents)}</Td>
                            <Td>
                              <Text fontWeight="medium">
                                {formatCurrency(payout.netCents)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(payout.status)}>
                                {getStatusLabel(payout.status)}
                              </Badge>
                            </Td>
                            <Td>
                              {payout.paidAt ? 
                                new Date(payout.paidAt).toLocaleDateString('pt-BR') : 
                                '-'
                              }
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </VStack>
        </Box>

        {/* Calculate Payouts Modal */}
        <CalculatePayoutsModal isOpen={isOpen} onClose={onClose} />
      </Box>
    </>
  );
}

interface CalculatePayoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CalculatePayoutsModal({ isOpen, onClose }: CalculatePayoutsModalProps) {
  const [formData, setFormData] = useState({
    periodStart: '',
    periodEnd: '',
    defaultCommissionPercent: 10,
  });
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/payouts/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Pagamentos calculados',
          description: 'Pagamentos foram calculados com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        window.location.reload();
      } else {
        throw new Error('Failed to calculate payouts');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao calcular pagamentos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Calcular Pagamentos</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Data Início</FormLabel>
                  <Input
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Data Fim</FormLabel>
                  <Input
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Comissão Padrão (%)</FormLabel>
                <Input
                  type="number"
                  value={formData.defaultCommissionPercent}
                  onChange={(e) => setFormData({ ...formData, defaultCommissionPercent: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <Button type="submit" colorScheme="green">
                  Calcular Pagamentos
                </Button>
                <Button onClick={onClose}>Cancelar</Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const [payouts, drivers] = await Promise.all([
      store.payouts.findAll(),
      store.drivers.findAll(),
    ]);
    
    return {
      props: {
        payouts: payouts.sort((a, b) => b.createdAt - a.createdAt),
        drivers,
      },
    };
  } catch (error) {
    console.error('Error loading payouts:', error);
    return {
      props: {
        payouts: [],
        drivers: [],
      },
    };
  }
};
