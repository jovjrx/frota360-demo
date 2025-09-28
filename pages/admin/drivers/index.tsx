import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { adminDb } from '@/lib/firebaseAdmin';
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
  Textarea,
  Icon,
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
  FiDollarSign,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import Link from 'next/link';
import { loadTranslations } from '@/lib/translations';
import { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import StandardModal from '@/components/modals/StandardModal';
import { FormControl, FormLabel } from '@chakra-ui/react';

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
  userData,
  tCommon
}: DriversManagementProps & { tCommon: (key: string) => string }) {
  const tAdmin = (key: string) => translations.admin?.[key] || key;
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driversList, setDriversList] = useState(drivers);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredDrivers = useMemo(() => {
    return driversList.filter(driver => {
      const matchesSearch = 
        driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [driversList, searchTerm, statusFilter]);

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

  const handleActivateDriver = async (driverId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/drivers/activate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          status,
          reason: `Status alterado para ${status}`
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status do motorista');
      }

      toast({
        title: 'Status atualizado!',
        description: `Motorista ${status === 'active' ? 'aprovado' : 'desativado'} com sucesso.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Atualizar lista local
      setDriversList(prev => prev.map(driver => 
        driver.id === driverId 
          ? { ...driver, status }
          : driver
      ));

      // Fechar modal se estiver aberto
      onClose();

    } catch (error) {
      console.error('Erro ao ativar motorista:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do motorista.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/driver-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driverId, 
          action: newStatus === 'active' ? 'approve' : 'reject',
          rejectionReason: newStatus === 'rejected' ? 'Documentos não atendem aos requisitos' : undefined
        }),
      });

      if (response.ok) {
        toast({
          title: 'Status atualizado!',
          description: `Motorista ${newStatus === 'active' ? 'aprovado' : 'rejeitado'} com sucesso.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Atualizar lista local ou recarregar página
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      toast({
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar o status do motorista.',
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

  const handleSubscriptionAction = async (action: string, planId?: string) => {
    if (!selectedDriver) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscription-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driverId: selectedDriver.id, 
          action,
          planId
        }),
      });

      if (response.ok) {
        const actionText = {
          'create_subscription': 'criada',
          'renew_subscription': 'renovada',
          'reactivate_subscription': 'reativada',
          'cancel_subscription': 'cancelada'
        }[action] || 'atualizada';

        toast({
          title: 'Assinatura atualizada!',
          description: `A assinatura foi ${actionText} com sucesso.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Reload page to show updated data
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerenciar assinatura');
      }
    } catch (error) {
      toast({
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Não foi possível gerenciar a assinatura.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
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
      
      <AdminLayout
        title="Gerenciar Motoristas"
        subtitle="Gerencie todos os motoristas da plataforma"
        user={{
          name: userData?.name || 'Administrador',
          avatar: userData?.avatar,
          role: 'admin',
          status: 'active'
        }}
        notifications={0}
        breadcrumbs={[
          { label: 'Motoristas' }
        ]}
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
      >
        {/* Filters and Actions */}
        <Card bg="white" borderColor="gray.200">
          <CardBody>
            <HStack spacing={4} justify="space-between">
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
              <HStack spacing={4}>
                <Button leftIcon={<FiDownload />} variant="outline" onClick={exportDrivers}>
                  Exportar CSV
                </Button>
                <Button leftIcon={<FiPlus />} colorScheme="purple">
                  Adicionar Motorista
                </Button>
              </HStack>
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
                          <Spacer />
                          <VStack spacing={2}>
                            {selectedDriver.status === 'pending' && (
                              <Button
                                colorScheme="green"
                                size="sm"
                                onClick={() => handleActivateDriver(selectedDriver.id, 'active')}
                                leftIcon={<Icon as={FiCheckCircle} />}
                              >
                                Aprovar
                              </Button>
                            )}
                            {selectedDriver.status === 'active' && (
                              <Button
                                colorScheme="orange"
                                size="sm"
                                onClick={() => handleActivateDriver(selectedDriver.id, 'inactive')}
                                leftIcon={<Icon as={FiPause} />}
                              >
                                Desativar
                              </Button>
                            )}
                            {selectedDriver.status === 'inactive' && (
                              <Button
                                colorScheme="green"
                                size="sm"
                                onClick={() => handleActivateDriver(selectedDriver.id, 'active')}
                                leftIcon={<Icon as={FiPlay} />}
                              >
                                Reativar
                              </Button>
                            )}
                            <Button
                              colorScheme="red"
                              size="sm"
                              onClick={() => handleActivateDriver(selectedDriver.id, 'suspended')}
                              leftIcon={<Icon as={FiXCircle} />}
                            >
                              Suspender
                            </Button>
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
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Status dos documentos do motorista
                    </Text>
                    
                    {/* Document Status Cards */}
                    <SimpleGrid columns={2} spacing={4}>
                      <Card bg="green.50" borderColor="green.200">
                        <CardBody>
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">Carta de Condução</Text>
                              <Text fontSize="xs" color="green.600">Verificada</Text>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                      
                      <Card bg="yellow.50" borderColor="yellow.200">
                        <CardBody>
                          <HStack>
                            <Icon as={FiFileText} color="yellow.500" />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">Seguro do Veículo</Text>
                              <Text fontSize="xs" color="yellow.600">Pendente</Text>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                      
                      <Card bg="red.50" borderColor="red.200">
                        <CardBody>
                          <HStack>
                            <Icon as={FiXCircle} color="red.500" />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">Certificado TVDE</Text>
                              <Text fontSize="xs" color="red.600">Rejeitado</Text>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                      
                      <Card bg="gray.50" borderColor="gray.200">
                        <CardBody>
                          <HStack>
                            <Icon as={FiFileText} color="gray.500" />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">Inspeção Técnica</Text>
                              <Text fontSize="xs" color="gray.600">Não enviado</Text>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                    
                    {/* Plan Information */}
                    {selectedDriver.selectedPlan && (
                      <Card bg="blue.50" borderColor="blue.200">
                        <CardBody>
                          <VStack align="flex-start" spacing={2}>
                            <Text fontSize="sm" fontWeight="medium" color="blue.700">
                              Plano Selecionado
                            </Text>
                            <Text fontSize="lg" fontWeight="bold" color="blue.800">
                              {selectedDriver.planName || 'Plano não definido'}
                            </Text>
                            <Text fontSize="sm" color="blue.600">
                              €{((selectedDriver.planPrice || 0) / 100).toFixed(2)}/mês
                            </Text>
                            
                            {/* Subscription Management Actions */}
                            <HStack spacing={2} mt={2}>
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => handleSubscriptionAction('create_subscription', selectedDriver.selectedPlan)}
                              >
                                Criar Assinatura
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="blue"
                                onClick={() => handleSubscriptionAction('renew_subscription')}
                              >
                                Renovar
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="orange"
                                onClick={() => handleSubscriptionAction('reactivate_subscription')}
                              >
                                Reativar
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleSubscriptionAction('cancel_subscription')}
                              >
                                Cancelar
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
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
            // Implementar edição com campos administrativos
            console.log('Editar motorista:', selectedDriver);
          }}
          saveText="Salvar Alterações"
        >
          {selectedDriver && (
            <Tabs>
              <TabList>
                <Tab>Informações Básicas</Tab>
                <Tab>Campos Administrativos</Tab>
                <Tab>Documentos</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
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
                      <FormLabel>Cidade</FormLabel>
                      <Input defaultValue={selectedDriver.city} />
                    </FormControl>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Status</FormLabel>
                      <Select defaultValue={selectedDriver.status}>
                        <option value="pending">Pendente</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="suspended">Suspenso</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Ganhos Semanais</FormLabel>
                      <Input type="number" defaultValue={selectedDriver.weeklyEarnings} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Ganhos Mensais</FormLabel>
                      <Input type="number" defaultValue={selectedDriver.monthlyEarnings} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Total de Corridas</FormLabel>
                      <Input type="number" defaultValue={selectedDriver.totalTrips} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Avaliação</FormLabel>
                      <Input type="number" step="0.1" defaultValue={selectedDriver.rating} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Último Pagamento</FormLabel>
                      <Input type="date" defaultValue={selectedDriver.lastPayoutAt ? new Date(selectedDriver.lastPayoutAt).toISOString()?.split('T')[0] || '' : ''} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Valor do Último Pagamento</FormLabel>
                      <Input type="number" step="0.01" defaultValue={selectedDriver.lastPayoutAmount} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Notas Administrativas</FormLabel>
                      <Textarea defaultValue={selectedDriver.notes} />
                    </FormControl>
                      </VStack>
                    </TabPanel>
                    <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Status dos documentos será exibido aqui.
                        </Text>
                    <FormControl>
                      <FormLabel>CNH Verificada</FormLabel>
                      <Select defaultValue={selectedDriver.documents?.license?.verified ? 'true' : 'false'}>
                        <option value="false">Não Verificada</option>
                        <option value="true">Verificada</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Seguro Verificado</FormLabel>
                      <Select defaultValue={selectedDriver.documents?.insurance?.verified ? 'true' : 'false'}>
                        <option value="false">Não Verificado</option>
                        <option value="true">Verificado</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Veículo Verificado</FormLabel>
                      <Select defaultValue={selectedDriver.documents?.vehicle?.verified ? 'true' : 'false'}>
                        <option value="false">Não Verificado</option>
                        <option value="true">Verificado</option>
                      </Select>
                    </FormControl>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
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
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get session from Iron Session
    const { getSession } = await import('@/lib/session/ironSession');
    const session = await getSession(context.req, context.res);
    
    if (!session.userId) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(session.userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    if (!userData || userData.role !== 'admin') {
      return {
        redirect: {
          destination: '/drivers',
          permanent: false,
        },
      };
    }

    // Extract locale from middleware header
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    // Load translations
    const translations = await loadTranslations(locale, ['common', 'admin']);

    // Get all drivers from Firestore
    const driversSnap = await adminDb.collection('drivers').get();
    const drivers = driversSnap.docs.map((doc: any) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt.toISOString(), // Convert to string for JSON serialization
      };
    });

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
        userData: { name: 'Administrador' },
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