import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withAdmin } from '@/lib/auth/rbac';
import { store } from '@/lib/store';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { 
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiPause,
  FiPlay,
  FiMoreVertical,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUser,
  FiFileText,
  FiDollarSign
} from 'react-icons/fi';
import Link from 'next/link';
import { loadTranslations } from '@/lib/translations';
import { useState, useMemo } from 'react';

interface DriversManagementProps {
  drivers: any[];
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    suspended: number;
  };
  tCommon: any;
  tAdmin: any;
}

export default function DriversManagement({ 
  drivers, 
  stats,
  tCommon,
  tAdmin 
}: DriversManagementProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = 
        driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    };
  }, [drivers, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/drivers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          status: newStatus,
        }),
      };

      if (response.ok) {
        toast({
          title: 'Status atualizado',
          description: newStatus === 'approved' 
            ? 'Motorista aprovado com sucesso'
            : newStatus === 'rejected'
            ? 'Motorista rejeitado com sucesso'
            : `Status alterado para ${getStatusText(newStatus)}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        };
        // Refresh page or update drivers list
        window.location.reload();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do motorista',
        status: 'error',
        duration: 5000,
        isClosable: true,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleViewDriver = (driver: any) => {
    setSelectedDriver(driver);
    onOpen();
  };

  const exportDrivers = () => {
    // Implementation for CSV export
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'Status', 'Data de Criação'],
      ...filteredDrivers.map(driver => [
        driver.name || '',
        driver.email || '',
        driver.phone || '',
        getStatusText(driver.status),
        new Date(driver.createdAt).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' };
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motoristas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Gerenciar Motoristas - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={6} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <Flex align="center">
              <VStack align="flex-start" spacing={1}>
                <Heading size="lg" color="gray.800">
                  Gerenciar Motoristas
                </Heading>
                <Text color="gray.600">
                  Gerencie todos os motoristas da plataforma
                </Text>
              </VStack>
              <Spacer />
              <HStack spacing={4}>
                <Button leftIcon={<FiDownload />} variant="outline" onClick={exportDrivers}>
                  Exportar CSV
                </Button>
                <Button leftIcon={<FiPlus />} colorScheme="purple">
                  Adicionar Motorista
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Box>

        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={6} align="stretch">
            {/* Stats Cards */}
            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total</StatLabel>
                    <StatNumber>{stats.total}</StatNumber>
                    <StatHelpText>Motoristas</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Aprovados</StatLabel>
                    <StatNumber color="green.500">{stats.approved}</StatNumber>
                    <StatHelpText>Ativos</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Pendentes</StatLabel>
                    <StatNumber color="yellow.500">{stats.pending}</StatNumber>
                    <StatHelpText>Aguardando</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Rejeitados</StatLabel>
                    <StatNumber color="red.500">{stats.rejected}</StatNumber>
                    <StatHelpText>Negados</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Suspensos</StatLabel>
                    <StatNumber color="orange.500">{stats.suspended}</StatNumber>
                    <StatHelpText>Bloqueados</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Filters */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <HStack spacing={4} wrap="wrap">
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
                    maxW="200px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                    <option value="suspended">Suspensos</option>
                  </Select>

                  <Text fontSize="sm" color="gray.600">
                    {filteredDrivers.length} de {drivers.length} motoristas
                  </Text>
                </HStack>
              </CardBody>
            </Card>

            {/* Drivers Table */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody p={0}>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Motorista</Th>
                        <Th>Contacto</Th>
                        <Th>Status</Th>
                        <Th>Data de Criação</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredDrivers.map((driver) => (
                        <Tr key={driver.id}>
                          <Td>
                            <HStack>
                              <Avatar 
                                size="sm" 
                                name={driver.name || 'Motorista'} 
                                src={driver.avatar}
                              />
                              <VStack align="flex-start" spacing={0}>
                                <Text fontWeight="medium">
                                  {driver.name || 'Sem nome'}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  ID: {driver.id.slice(0, 8)}...
                                </Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="flex-start" spacing={0}>
                              <HStack>
                                <FiMail size={12} />
                                <Text fontSize="sm">{driver.email}</Text>
                              </HStack>
                              {driver.phone && (
                                <HStack>
                                  <FiPhone size={12} />
                                  <Text fontSize="sm">{driver.phone}</Text>
                                </HStack>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(driver.status)}>
                              {getStatusText(driver.status)}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack>
                              <FiCalendar size={12} />
                              <Text fontSize="sm">
                                {new Date(driver.createdAt).toLocaleDateString('pt-BR')}
                              </Text>
                            </HStack>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Ver detalhes"
                                icon={<FiEye />}
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDriver(driver)}
                              />
                              
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  aria-label="Mais ações"
                                  icon={<FiMoreVertical />}
                                  size="sm"
                                  variant="outline"
                                />
                                <MenuList>
                                  {driver.status === 'pending' && (
                                    <>
                                      <MenuItem 
                                        icon={<FiCheck />}
                                        onClick={() => handleStatusChange(driver.id, 'approved')}
                                      >
                                        Aprovar
                                      </MenuItem>
                                      <MenuItem 
                                        icon={<FiX />}
                                        onClick={() => handleStatusChange(driver.id, 'rejected')}
                                      >
                                        Rejeitar
                                      </MenuItem>
                                    </>
                                  )}
                                  
                                  {driver.status === 'approved' && (
                                    <MenuItem 
                                      icon={<FiPause />}
                                      onClick={() => handleStatusChange(driver.id, 'suspended')}
                                    >
                                      Suspender
                                    </MenuItem>
                                  )}
                                  
                                  {driver.status === 'suspended' && (
                                    <MenuItem 
                                      icon={<FiPlay />}
                                      onClick={() => handleStatusChange(driver.id, 'approved')}
                                    >
                                      Reativar
                                    </MenuItem>
                                  )}
                                  
                                  <MenuItem icon={<FiEdit />}>
                                    Editar
                                  </MenuItem>
                                  <MenuItem icon={<FiFileText />}>
                                    Ver Documentos
                                  </MenuItem>
                                  <MenuItem icon={<FiDollarSign />}>
                                    Ver Pagamentos
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

                {filteredDrivers.length === 0 && (
                  <Box p={8} textAlign="center">
                    <Text color="gray.500">
                      Nenhum motorista encontrado com os filtros aplicados.
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </VStack>
        </Box>

        {/* Driver Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Detalhes do Motorista
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedDriver && (
                <Tabs>
                  <TabList>
                    <Tab>Informações Gerais</Tab>
                    <Tab>Documentos</Tab>
                    <Tab>Histórico</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack>
                          <Avatar 
                            size="lg" 
                            name={selectedDriver.name || 'Motorista'} 
                            src={selectedDriver.avatar}
                          />
                          <VStack align="flex-start" spacing={1}>
                            <Text fontSize="xl" fontWeight="bold">
                              {selectedDriver.name || 'Sem nome'}
                            </Text>
                            <Badge colorScheme={getStatusColor(selectedDriver.status)}>
                              {getStatusText(selectedDriver.status)}
                            </Badge>
                          </VStack>
                        </HStack>

                        <SimpleGrid columns={2} spacing={4}>
                          <Box>
                            <Text fontSize="sm" color="gray.500">Email</Text>
                            <Text>{selectedDriver.email}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.500">Telefone</Text>
                            <Text>{selectedDriver.phone || 'Não informado'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.500">Data de Criação</Text>
                            <Text>
                              {new Date(selectedDriver.createdAt).toLocaleDateString('pt-BR')}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.500">Última Atualização</Text>
                            <Text>
                              {new Date(selectedDriver.updatedAt).toLocaleDateString('pt-BR')}
                            </Text>
                          </Box>
                        </SimpleGrid>

                        {selectedDriver.address && (
                          <Box>
                            <Text fontSize="sm" color="gray.500">Morada</Text>
                            <Text>{selectedDriver.address}</Text>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>

                    <TabPanel>
                      <VStack spacing={3} align="stretch">
                        <Alert status="info">
                          <AlertIcon />
                          <AlertDescription fontSize="sm">
                            Documentos enviados pelo motorista para verificação.
                          </AlertDescription>
                        </Alert>
                        
                        <Text color="gray.500" textAlign="center" py={4}>
                          Funcionalidade de documentos será implementada em breve.
                        </Text>
                      </VStack>
                    </TabPanel>

                    <TabPanel>
                      <VStack spacing={3} align="stretch">
                        <Text color="gray.500" textAlign="center" py={4}>
                          Histórico de atividades do motorista será implementado em breve.
                        </Text>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Fechar
              </Button>
              {selectedDriver && selectedDriver.status === 'pending' && (
                <HStack>
                  <Button 
                    colorScheme="red" 
                    onClick={() => {
                      handleStatusChange(selectedDriver.id, 'rejected');
                      onClose();
                    }}
                  >
                    Rejeitar
                  </Button>
                  <Button 
                    colorScheme="green" 
                    onClick={() => {
                      handleStatusChange(selectedDriver.id, 'approved');
                      onClose();
                    }}
                  >
                    Aprovar
                  </Button>
                </HStack>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Load translations
    const translations = await loadTranslations(context.locale || 'pt', ['common', 'admin']);

    // Get all drivers
    // Mock drivers data
    const drivers = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '+351 912 345 678',
        status: 'approved',
        createdAt: '2024-01-15',
        lastActivity: '2024-01-20',
        earnings: 2450.75,
        trips: 156,
        rating: 4.8
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '+351 913 456 789',
        status: 'pending',
        createdAt: '2024-01-18',
        lastActivity: '2024-01-18',
        earnings: 0,
        trips: 0,
        rating: 0
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@example.com',
        phone: '+351 914 567 890',
        status: 'suspended',
        createdAt: '2024-01-10',
        lastActivity: '2024-01-19',
        earnings: 1850.25,
        trips: 98,
        rating: 4.2
      }
    ];

    // Calculate stats
    const stats = {
      total: drivers.length,
      approved: drivers.filter(d => d.status === 'approved').length,
      pending: drivers.filter(d => d.status === 'pending').length,
      rejected: drivers.filter(d => d.status === 'rejected').length,
      suspended: drivers.filter(d => d.status === 'suspended').length,
    };

    return {
      props: {
        drivers,
        stats,
        translations,
      },
    };
  } catch (error) {
    console.error('Error loading drivers management:', error);
    return {
      props: {
        drivers: [],
        stats: {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          suspended: 0,
        },
        translations: {},
      },
    };
  }
};
