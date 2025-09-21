import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withAdmin } from '@/lib/auth/withAdmin';
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
  FormControl,
  FormLabel,
  Textarea,
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
import StandardLayout from '@/components/layouts/StandardLayout';
import StandardModal from '@/components/modals/StandardModal';

interface DriversManagementProps {
  drivers: any[];
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    suspended: number;
  };
  translations: Record<string, any>;
  userData: any;
}

export default function DriversManagement({ 
  drivers, 
  stats,
  translations,
  userData
}: DriversManagementProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
  const tAdmin = (key: string) => translations.admin?.[key] || key;
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = 
        driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'suspended': return 'red';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'suspended': return 'Suspenso';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Status atualizado!',
          description: `Motorista ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Atualizar lista local ou recarregar página
        window.location.reload();
      } else {
        throw new Error('Erro ao atualizar status');
      }
    } catch (error) {
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o status do motorista.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDriver = (driver: any) => {
    setSelectedDriver(driver);
    onOpen();
  };

  const handleEditDriver = (driver: any) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
  };

  const handleDeleteDriver = (driver: any) => {
    setSelectedDriver(driver);
    setIsDeleteModalOpen(true);
  };

  const exportDrivers = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'Status', 'Data de Cadastro'],
      ...filteredDrivers.map(driver => [
        driver.name || '',
        driver.email || '',
        driver.phone || '',
        getStatusText(driver.status),
        new Date(driver.createdAt).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
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
      
      <StandardLayout
        title="Gerenciar Motoristas"
        subtitle="Gerencie todos os motoristas da plataforma"
        user={{
          name: userData?.name || 'Administrador',
          role: 'admin',
          status: 'active'
        }}
        notifications={0}
        stats={[
          {
            label: 'Total',
            value: stats.total,
            helpText: 'Motoristas',
            color: 'gray.500'
          },
          {
            label: 'Aprovados',
            value: stats.approved,
            helpText: 'Ativos',
            color: 'green.500'
          },
          {
            label: 'Pendentes',
            value: stats.pending,
            helpText: 'Aguardando',
            color: 'yellow.500'
          },
          {
            label: 'Rejeitados',
            value: stats.rejected,
            helpText: 'Negados',
            color: 'red.500'
          },
          {
            label: 'Suspensos',
            value: stats.suspended,
            helpText: 'Bloqueados',
            color: 'red.500'
          }
        ]}
        actions={
              <HStack spacing={4}>
                <Button leftIcon={<FiDownload />} variant="outline" onClick={exportDrivers}>
                  Exportar CSV
                </Button>
                <Button leftIcon={<FiPlus />} colorScheme="purple">
                  Adicionar Motorista
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
                      placeholder="Buscar motoristas..."
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
                    <option value="pending">Pendentes</option>
                <option value="active">Aprovados</option>
                    <option value="suspended">Suspensos</option>
                <option value="inactive">Inativos</option>
                  </Select>
                </HStack>
              </CardBody>
            </Card>

            {/* Drivers Table */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Lista de Motoristas ({filteredDrivers.length})</Heading>
          </CardHeader>
          <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Motorista</Th>
                    <Th>Contato</Th>
                        <Th>Status</Th>
                    <Th>Cadastro</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredDrivers.map((driver) => (
                        <Tr key={driver.id}>
                          <Td>
                            <HStack>
                          <Avatar size="sm" name={driver.name} />
                              <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">{driver.name}</Text>
                            <Text fontSize="sm" color="gray.600">ID: {driver.id}</Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                        <VStack align="flex-start" spacing={1}>
                                <Text fontSize="sm">{driver.email}</Text>
                          <Text fontSize="sm" color="gray.600">{driver.phone}</Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(driver.status)}>
                              {getStatusText(driver.status)}
                            </Badge>
                          </Td>
                          <Td>
                              <Text fontSize="sm">
                                {new Date(driver.createdAt).toLocaleDateString('pt-BR')}
                              </Text>
                          </Td>
                          <Td>
                              <Menu>
                          <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                                <MenuList>
                            <MenuItem icon={<FiEye />} onClick={() => handleViewDriver(driver)}>
                              Ver Detalhes
                            </MenuItem>
                            <MenuItem icon={<FiEdit />} onClick={() => handleEditDriver(driver)}>
                              Editar
                            </MenuItem>
                                  {driver.status === 'pending' && (
                                    <>
                                <MenuItem icon={<FiCheck />} onClick={() => handleStatusChange(driver.id, 'active')}>
                                        Aprovar
                                      </MenuItem>
                                <MenuItem icon={<FiX />} onClick={() => handleStatusChange(driver.id, 'inactive')}>
                                        Rejeitar
                                      </MenuItem>
                                    </>
                                  )}
                            <MenuItem icon={<FiTrash2 />} onClick={() => handleDeleteDriver(driver)} color="red.500">
                              Excluir
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

        {/* Driver Details Modal */}
        <StandardModal
          isOpen={isOpen}
          onClose={onClose}
          title="Detalhes do Motorista"
          size="xl"
          showSave={false}
        >
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
                      <Avatar size="lg" name={selectedDriver.name} />
                          <VStack align="flex-start" spacing={1}>
                        <Text fontSize="lg" fontWeight="bold">{selectedDriver.name}</Text>
                        <Text color="gray.600">{selectedDriver.email}</Text>
                            <Badge colorScheme={getStatusColor(selectedDriver.status)}>
                              {getStatusText(selectedDriver.status)}
                            </Badge>
                          </VStack>
                        </HStack>

                        <SimpleGrid columns={2} spacing={4}>
                          <Box>
                            <Text fontSize="sm" color="gray.500">Telefone</Text>
                            <Text>{selectedDriver.phone || 'Não informado'}</Text>
                          </Box>
                          <Box>
                        <Text fontSize="sm" color="gray.500">Data de Cadastro</Text>
                        <Text>{new Date(selectedDriver.createdAt).toLocaleDateString('pt-BR')}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Última Atividade</Text>
                        <Text>{new Date(selectedDriver.lastActivity).toLocaleDateString('pt-BR')}</Text>
                          </Box>
                          <Box>
                        <Text fontSize="sm" color="gray.500">Avaliação</Text>
                        <Text>{selectedDriver.rating || 'N/A'}</Text>
                          </Box>
                        </SimpleGrid>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                  <Text>Documentos do motorista serão exibidos aqui.</Text>
                    </TabPanel>
                    <TabPanel>
                  <Text>Histórico de atividades será exibido aqui.</Text>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              )}
        </StandardModal>

        {/* Edit Driver Modal */}
        <StandardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Motorista"
          onSave={async () => {
            // Implementar edição
            console.log('Editar motorista:', selectedDriver);
          }}
          saveText="Salvar Alterações"
        >
          {selectedDriver && (
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Nome</FormLabel>
                <Input defaultValue={selectedDriver.name} />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input defaultValue={selectedDriver.email} />
              </FormControl>
              <FormControl>
                <FormLabel>Telefone</FormLabel>
                <Input defaultValue={selectedDriver.phone} />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select defaultValue={selectedDriver.status}>
                  <option value="pending">Pendente</option>
                  <option value="active">Aprovado</option>
                  <option value="inactive">Rejeitado</option>
                  <option value="suspended">Suspenso</option>
                </Select>
              </FormControl>
            </VStack>
          )}
        </StandardModal>

        {/* Delete Driver Modal */}
        <StandardModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Excluir Motorista"
          onDelete={async () => {
            // Implementar exclusão
            console.log('Excluir motorista:', selectedDriver);
          }}
          showSave={false}
          showDelete={true}
          deleteText="Excluir Motorista"
        >
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>
              Tem certeza que deseja excluir o motorista <strong>{selectedDriver?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
        </StandardModal>
      </StandardLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Load translations
    const translations = await loadTranslations('pt', ['common', 'admin']);

    // Get all drivers
    const drivers = await store.drivers.findAll();

    const stats = {
      total: drivers.length,
      approved: drivers.filter(d => d.status === 'active').length,
      pending: drivers.filter(d => d.status === 'pending').length,
      rejected: drivers.filter(d => d.status === 'inactive').length,
      suspended: drivers.filter(d => d.status === 'suspended').length,
    };

    return {
      props: {
        drivers,
        stats,
        translations,
        userData: { name: 'Administrador' }, // Mock data
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
        translations: { common: {}, admin: {} },
        userData: { name: 'Administrador' },
      },
    };
  }
};