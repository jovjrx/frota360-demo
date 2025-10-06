import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
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
  IconButton,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiEdit,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiCreditCard,
  FiTruck,
  FiDollarSign,
  FiPlus,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { PageProps } from '@/interface/Global';

interface Driver {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  type?: string;
  integrations?: {
    uber?: {
      uuid?: string | null;
      name?: string | null;
    };
    bolt?: {
      id?: string | null;
      email?: string | null;
    };
  };
  cards?: {
    myprio?: string | null;
    viaverde?: string | null;
  };
  banking?: {
    iban?: string | null;
    accountHolder?: string | null;
  };
  vehicle?: {
    plate?: string;
    make?: string;
    model?: string;
    year?: number;
  };
}

interface DriversPageProps extends PageProps {
  initialDrivers: Driver[];
}

export default function DriversPage({ initialDrivers }: DriversPageProps) {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const toast = useToast();

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/drivers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar motoristas',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDrivers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [filterStatus, filterType, searchQuery]);

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    onOpen();
  };

  const handleSave = async () => {
    if (!editingDriver) return;

    try {
      const response = await fetch(`/api/admin/drivers/${editingDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDriver),
      });

      if (response.ok) {
        toast({
          title: 'Motorista atualizado',
          status: 'success',
          duration: 2000,
        });
        onClose();
        fetchDrivers();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro ao atualizar',
          description: error.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const updateField = (path: string, value: any) => {
    if (!editingDriver) return;

    const pathParts = path.split('.');
    const updated = { ...editingDriver };
    
    let current: any = updated;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const key = pathParts[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    setEditingDriver(updated);
  };

  const getStatusBadge = (status?: string) => {
    const colorMap: Record<string, string> = {
      active: 'green',
      pending: 'yellow',
      inactive: 'gray',
      suspended: 'red',
    };
    return (
      <Badge colorScheme={colorMap[status || 'pending'] || 'gray'}>
        {status === 'active' ? 'Ativo' :
         status === 'pending' ? 'Pendente' :
         status === 'inactive' ? 'Inativo' :
         status === 'suspended' ? 'Suspenso' :
         status || 'N/A'}
      </Badge>
    );
  };

  const getTypeBadge = (type?: string) => {
    return (
      <Badge colorScheme={type === 'renter' ? 'blue' : 'purple'}>
        {type === 'renter' ? 'Locatário' : 'Afiliado'}
      </Badge>
    );
  };

  const filteredDrivers = drivers;

  return (
    <AdminLayout
      title="Gestão de Motoristas"
      subtitle="Configure integrações, cartões e dados bancários dos motoristas"
      breadcrumbs={[{ label: 'Motoristas' }]}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="red"
          onClick={() => router.push('/admin/drivers/add')}
        >
          Adicionar Motorista
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        {/* Filtros */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <Box flex={1} minW="250px">
                <HStack>
                  <Icon as={FiSearch} color="gray.400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </HStack>
              </Box>

              <Box minW="150px">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">Todos Status</option>
                  <option value="active">Ativo</option>
                  <option value="pending">Pendente</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </Select>
              </Box>

              <Box minW="150px">
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">Todos Tipos</option>
                  <option value="affiliate">Afiliado</option>
                  <option value="renter">Locatário</option>
                </Select>
              </Box>

              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={fetchDrivers}
                isLoading={isLoading}
              >
                Atualizar
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Tabela de Motoristas */}
        <Card>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Email</Th>
                    <Th>Status</Th>
                    <Th>Tipo</Th>
                    <Th>Uber UUID</Th>
                    <Th>Bolt ID</Th>
                    <Th>Cartão myprio</Th>
                    <Th>IBAN</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredDrivers.length === 0 ? (
                    <Tr>
                      <Td colSpan={9} textAlign="center" py={8}>
                        <Text color="gray.500">
                          {isLoading ? 'Carregando...' : 'Nenhum motorista encontrado'}
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <Tr key={driver.id}>
                        <Td>
                          <Text fontWeight="medium">{driver.fullName || driver.name || 'N/A'}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{driver.email || 'N/A'}</Text>
                        </Td>
                        <Td>{getStatusBadge(driver.status)}</Td>
                        <Td>{getTypeBadge(driver.type)}</Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {driver.integrations?.uber?.uuid || '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {driver.integrations?.bolt?.id || '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {driver.cards?.myprio || '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {driver.banking?.iban ? 
                              `${driver.banking.iban.slice(0, 8)}...${driver.banking.iban.slice(-4)}` : 
                              '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Tooltip label="Editar">
                            <IconButton
                              aria-label="Editar motorista"
                              icon={<Icon as={FiEdit} />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(driver)}
                            />
                          </Tooltip>
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

      {/* Modal de Edição */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Motorista</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingDriver && (
              <Tabs>
                <TabList>
                  <Tab>
                    <Icon as={FiUser} mr={2} />
                    Básico
                  </Tab>
                  <Tab>
                    <Icon as={FiCreditCard} mr={2} />
                    Integrações
                  </Tab>
                  <Tab>
                    <Icon as={FiTruck} mr={2} />
                    Veículo
                  </Tab>
                  <Tab>
                    <Icon as={FiDollarSign} mr={2} />
                    Bancário
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Tab Básico */}
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={editingDriver.status || 'pending'}
                          onChange={(e) => updateField('status', e.target.value)}
                        >
                          <option value="pending">Pendente</option>
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                          <option value="suspended">Suspenso</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          value={editingDriver.type || 'affiliate'}
                          onChange={(e) => updateField('type', e.target.value)}
                        >
                          <option value="affiliate">Afiliado</option>
                          <option value="renter">Locatário</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Nome</FormLabel>
                        <Input
                          value={editingDriver.fullName || editingDriver.name || ''}
                          onChange={(e) => updateField('fullName', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={editingDriver.email || ''}
                          onChange={(e) => updateField('email', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Telefone</FormLabel>
                        <Input
                          value={editingDriver.phone || ''}
                          onChange={(e) => updateField('phone', e.target.value)}
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>

                  {/* Tab Integrações */}
                  <TabPanel>
                    <VStack spacing={4}>
                      <Box w="100%" p={4} borderWidth={1} borderRadius="md">
                        <Heading size="sm" mb={3}>Uber</Heading>
                        <VStack spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">UUID do Motorista</FormLabel>
                            <Input
                              placeholder="Ex: 12345678-1234-1234-1234-123456789012"
                              value={editingDriver.integrations?.uber?.uuid || ''}
                              onChange={(e) => updateField('integrations.uber.uuid', e.target.value)}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Este ID é usado para vincular dados da planilha do Uber
                            </Text>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">Nome no Uber (opcional)</FormLabel>
                            <Input
                              placeholder="Nome como aparece no Uber"
                              value={editingDriver.integrations?.uber?.name || ''}
                              onChange={(e) => updateField('integrations.uber.name', e.target.value)}
                            />
                          </FormControl>
                        </VStack>
                      </Box>

                      <Box w="100%" p={4} borderWidth={1} borderRadius="md">
                        <Heading size="sm" mb={3}>Bolt</Heading>
                        <VStack spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">Driver ID</FormLabel>
                            <Input
                              placeholder="Ex: 123456"
                              value={editingDriver.integrations?.bolt?.id || ''}
                              onChange={(e) => updateField('integrations.bolt.id', e.target.value)}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Este ID é usado para vincular dados da planilha do Bolt
                            </Text>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">Email no Bolt (opcional)</FormLabel>
                            <Input
                              type="email"
                              placeholder="Email no Bolt"
                              value={editingDriver.integrations?.bolt?.email || ''}
                              onChange={(e) => updateField('integrations.bolt.email', e.target.value)}
                            />
                          </FormControl>
                        </VStack>
                      </Box>

                      <Box w="100%" p={4} borderWidth={1} borderRadius="md">
                        <Heading size="sm" mb={3}>Cartões</Heading>
                        <VStack spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">Cartão myprio</FormLabel>
                            <Input
                              placeholder="Número do cartão myprio"
                              value={editingDriver.cards?.myprio || ''}
                              onChange={(e) => updateField('cards.myprio', e.target.value)}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Usado para vincular dados de abastecimento
                            </Text>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">Cartão ViaVerde</FormLabel>
                            <Input
                              placeholder="Número do cartão ViaVerde"
                              value={editingDriver.cards?.viaverde || ''}
                              onChange={(e) => updateField('cards.viaverde', e.target.value)}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Usado para vincular dados de portagens
                            </Text>
                          </FormControl>
                        </VStack>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Tab Veículo */}
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Matrícula</FormLabel>
                        <Input
                          placeholder="Ex: AB-12-CD"
                          value={editingDriver.vehicle?.plate || ''}
                          onChange={(e) => updateField('vehicle.plate', e.target.value)}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Usado para vincular dados de ViaVerde
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Marca</FormLabel>
                        <Input
                          placeholder="Ex: Toyota"
                          value={editingDriver.vehicle?.make || ''}
                          onChange={(e) => updateField('vehicle.make', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Modelo</FormLabel>
                        <Input
                          placeholder="Ex: Prius"
                          value={editingDriver.vehicle?.model || ''}
                          onChange={(e) => updateField('vehicle.model', e.target.value)}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Ano</FormLabel>
                        <Input
                          type="number"
                          placeholder="Ex: 2020"
                          value={editingDriver.vehicle?.year || ''}
                          onChange={(e) => updateField('vehicle.year', parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>

                  {/* Tab Bancário */}
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>IBAN</FormLabel>
                        <Input
                          placeholder="PT50 0000 0000 0000 0000 0000 0"
                          value={editingDriver.banking?.iban || ''}
                          onChange={(e) => updateField('banking.iban', e.target.value)}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          IBAN completo para transferências semanais
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Titular da Conta</FormLabel>
                        <Input
                          placeholder="Nome do titular"
                          value={editingDriver.banking?.accountHolder || ''}
                          onChange={(e) => updateField('banking.accountHolder', e.target.value)}
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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

    const snapshot = await db.collection('drivers')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const initialDrivers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      props: {
        ...authResult.props,
        initialDrivers,
      },
    };
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return {
      props: {
        ...authResult.props,
        initialDrivers: [],
      },
    };
  }
};
