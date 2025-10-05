import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useDisclosure,
  useToast,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { 
  FiSearch,
  FiEdit,
  FiEye,
  FiFilter,
  FiUser,
  FiMail,
  FiPhone,
  FiTruck,
  FiCalendar,
  FiDollarSign
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import LoggedInLayout from '@/components/LoggedInLayout';
import { ADMIN } from '@/translations';
import { PageProps } from '@/interface/Global';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'affiliate' | 'renter';
  status: 'active' | 'inactive' | 'suspended';
  vehicle?: {
    id: string;
    plate: string;
    make: string;
    model: string;
  };
  joinDate: string;
  totalEarnings: number;
  iban?: string;
}

interface DriverFilters {
  status: string;
  type: string;
  search: string;
}

interface AdminDriversProps {
  translations: {
    common: any;
    page: any;
  };
  locale: string;
}

export default function AdminDrivers({ translations, locale }: AdminDriversProps) {
  const tCommon = (key: string) => getTranslation(translations.common, key);
  const tPage = (key: string) => getTranslation(translations.page, key);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DriverFilters>({
    status: '',
    type: '',
    search: ''
  });
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
  const toast = useToast();
  
  const tAdmin = tPage;
  const t = tCommon;

  // Mock data - substituir por chamada à API
  useEffect(() => {
    const mockDrivers: Driver[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+351 912 345 678',
        type: 'affiliate',
        status: 'active',
        vehicle: {
          id: 'v1',
          plate: 'AX-42-DO',
          make: 'Toyota',
          model: 'Corolla'
        },
        joinDate: '2024-01-15',
        totalEarnings: 2847.50,
        iban: 'PT50000700000066615972323'
      },
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '+351 923 456 789',
        type: 'renter',
        status: 'active',
        joinDate: '2024-02-01',
        totalEarnings: 1923.75
      },
      {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro.costa@email.com',
        phone: '+351 934 567 890',
        type: 'affiliate',
        status: 'suspended',
        vehicle: {
          id: 'v2',
          plate: 'BY-53-EF',
          make: 'Nissan',
          model: 'Leaf'
        },
        joinDate: '2024-01-20',
        totalEarnings: 1567.25
      }
    ];
    
    setDrivers(mockDrivers);
    setFilteredDrivers(mockDrivers);
    setLoading(false);
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = drivers;
    
    if (filters.status) {
      filtered = filtered.filter(driver => driver.status === filters.status);
    }
    
    if (filters.type) {
      filtered = filtered.filter(driver => driver.type === filters.type);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(driver => 
        driver.name.toLowerCase().includes(searchLower) ||
        driver.email.toLowerCase().includes(searchLower) ||
        driver.phone.includes(searchLower)
      );
    }
    
    setFilteredDrivers(filtered);
  }, [drivers, filters]);

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    onDetailOpen();
  };

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    onEditOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'affiliate': return 'blue';
      case 'renter': return 'orange';
      default: return 'gray';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  if (loading) {
    return (
      <LoggedInLayout>
        <Container maxW="container.xl">
          <Center h="400px">
            <Spinner size="xl" />
          </Center>
        </Container>
      </LoggedInLayout>
    );
  }

  return (
    <LoggedInLayout>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Box>
              <Heading size="lg">{tAdmin('drivers.title')}</Heading>
              <Text color="gray.600">{tAdmin('drivers.subtitle')}</Text>
            </Box>
            <Button colorScheme="blue" leftIcon={<Icon as={FiUser} />}>
              {tAdmin('drivers.addDriver')}
            </Button>
          </HStack>

          {/* Estatísticas */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Total Motoristas</Text>
                  <Text fontSize="2xl" fontWeight="bold">{drivers.length}</Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Ativos</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {drivers.filter(d => d.status === 'active').length}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Afiliados</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {drivers.filter(d => d.type === 'affiliate').length}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">Locatários</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {drivers.filter(d => d.type === 'renter').length}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filtros */}
          <Card>
            <CardBody>
              <HStack spacing={4} flexWrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Pesquisar motorista..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </InputGroup>
                
                <Select
                  placeholder={tAdmin('drivers.filters.status')}
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  maxW="200px"
                >
                  <option value="active">{tAdmin('drivers.status.active')}</option>
                  <option value="inactive">{tAdmin('drivers.status.inactive')}</option>
                  <option value="suspended">{tAdmin('drivers.status.suspended')}</option>
                </Select>
                
                <Select
                  placeholder={tAdmin('drivers.filters.type')}
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  maxW="200px"
                >
                  <option value="affiliate">{tAdmin('drivers.type.affiliate')}</option>
                  <option value="renter">{tAdmin('drivers.type.renter')}</option>
                </Select>
                
                <Button
                  leftIcon={<Icon as={FiFilter} />}
                  variant="outline"
                  onClick={() => setFilters({ status: '', type: '', search: '' })}
                >
                  Limpar Filtros
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Tabela de Motoristas */}
          <Card>
            <CardBody p={0}>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>{tAdmin('drivers.table.name')}</Th>
                    <Th>{tAdmin('drivers.table.email')}</Th>
                    <Th>{tAdmin('drivers.table.phone')}</Th>
                    <Th>{tAdmin('drivers.table.type')}</Th>
                    <Th>{tAdmin('drivers.table.status')}</Th>
                    <Th>{tAdmin('drivers.table.vehicle')}</Th>
                    <Th>{tAdmin('drivers.table.joinDate')}</Th>
                    <Th isNumeric>{tAdmin('drivers.table.totalEarnings')}</Th>
                    <Th>{tAdmin('drivers.table.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredDrivers.map((driver) => (
                    <Tr key={driver.id}>
                      <Td fontWeight="medium">{driver.name}</Td>
                      <Td>{driver.email}</Td>
                      <Td>{driver.phone}</Td>
                      <Td>
                        <Badge colorScheme={getTypeColor(driver.type)}>
                          {tAdmin(`drivers.type.${driver.type}`)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(driver.status)}>
                          {tAdmin(`drivers.status.${driver.status}`)}
                        </Badge>
                      </Td>
                      <Td>
                        {driver.vehicle ? (
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">{driver.vehicle.plate}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {driver.vehicle.make} {driver.vehicle.model}
                            </Text>
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.500">-</Text>
                        )}
                      </Td>
                      <Td>{formatDate(driver.joinDate)}</Td>
                      <Td isNumeric fontWeight="medium">
                        {formatCurrency(driver.totalEarnings)}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Ver detalhes"
                            icon={<FiEye />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(driver)}
                          />
                          <IconButton
                            aria-label="Editar"
                            icon={<FiEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDriver(driver)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </VStack>

        {/* Modal de Detalhes */}
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{tAdmin('drivers.driverDetails')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedDriver && (
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>{tAdmin('drivers.table.name')}</FormLabel>
                      <Text>{selectedDriver.name}</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel>{tAdmin('drivers.table.email')}</FormLabel>
                      <Text>{selectedDriver.email}</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel>{tAdmin('drivers.table.phone')}</FormLabel>
                      <Text>{selectedDriver.phone}</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel>{tAdmin('drivers.table.type')}</FormLabel>
                      <Badge colorScheme={getTypeColor(selectedDriver.type)}>
                        {tAdmin(`drivers.type.${selectedDriver.type}`)}
                      </Badge>
                    </FormControl>
                    <FormControl>
                      <FormLabel>{tAdmin('drivers.table.status')}</FormLabel>
                      <Badge colorScheme={getStatusColor(selectedDriver.status)}>
                        {tAdmin(`drivers.status.${selectedDriver.status}`)}
                      </Badge>
                    </FormControl>
                    <FormControl>
                      <FormLabel>{tAdmin('drivers.table.joinDate')}</FormLabel>
                      <Text>{formatDate(selectedDriver.joinDate)}</Text>
                    </FormControl>
                  </SimpleGrid>
                  
                  {selectedDriver.vehicle && (
                    <FormControl>
                      <FormLabel>{tAdmin('drivers.table.vehicle')}</FormLabel>
                      <Card>
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <Text fontWeight="medium">{selectedDriver.vehicle.plate}</Text>
                            <Text>{selectedDriver.vehicle.make} {selectedDriver.vehicle.model}</Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    </FormControl>
                  )}
                  
                  <FormControl>
                    <FormLabel>{tAdmin('drivers.table.totalEarnings')}</FormLabel>
                    <Text fontSize="xl" fontWeight="bold" color="green.500">
                      {formatCurrency(selectedDriver.totalEarnings)}
                    </Text>
                  </FormControl>
                  
                  {selectedDriver.iban && (
                    <FormControl>
                      <FormLabel>IBAN</FormLabel>
                      <Text fontFamily="mono">{selectedDriver.iban}</Text>
                    </FormControl>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onDetailClose}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal de Edição */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{tAdmin('drivers.editDriver')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Formulário de edição será implementado aqui...</Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue">
                Salvar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </LoggedInLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  return checkAdminAuth(context);
};
