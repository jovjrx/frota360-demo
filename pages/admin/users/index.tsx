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
  FiDollarSign,
  FiShield,
  FiUsers
} from 'react-icons/fi';
import Link from 'next/link';
import { loadTranslations } from '@/lib/translations';
import { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import StandardModal from '@/components/modals/StandardModal';

interface UsersManagementProps {
  users: any[];
  stats: {
    total: number;
    admins: number;
    drivers: number;
  };
  translations: Record<string, any>;
  userData: any;
}

export default function UsersManagement({ 
  users, 
  stats,
  translations,
  userData
}: UsersManagementProps) {
  const tCommon = (key: string) => translations.common?.[key] || key;
  const tAdmin = (key: string) => translations.admin?.[key] || key;
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'blue';
      case 'driver': return 'green';
      default: return 'gray';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'driver': return 'Motorista';
      default: return 'Desconhecido';
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Nome', 'Email', 'Role', 'Data de Criação'],
      ...filteredUsers.map(user => [
        user.name || '',
        user.email || '',
        getRoleText(user.role),
        new Date(user.createdAt).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head>
        <title>Gerenciar Usuários - Conduz.pt</title>
      </Head>
      
      <AdminLayout
        title="Gerenciar Usuários"
        subtitle="Gerencie todos os usuários do sistema (admins e motoristas)"
        user={{
          name: userData?.name || 'Administrador',
          avatar: userData?.avatar,
          role: 'admin',
          status: 'active'
        }}
        notifications={0}
        breadcrumbs={[
          { label: 'Usuários' }
        ]}
        stats={[
          {
            label: 'Total',
            value: stats.total,
            helpText: 'Usuários',
            color: 'gray.500'
          },
          {
            label: 'Administradores',
            value: stats.admins,
            helpText: 'Admins',
            color: 'blue.500'
          },
          {
            label: 'Motoristas',
            value: stats.drivers,
            helpText: 'Drivers',
            color: 'green.500'
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
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  maxW="200px"
                >
                  <option value="all">Todos os Roles</option>
                  <option value="admin">Administradores</option>
                  <option value="driver">Motoristas</option>
                </Select>
              </HStack>
              <HStack spacing={4}>
                <Button leftIcon={<FiDownload />} variant="outline" onClick={exportUsers}>
                  Exportar CSV
                </Button>
                <Button leftIcon={<FiPlus />} colorScheme="purple">
                  Adicionar Usuário
                </Button>
              </HStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Users Table */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Lista de Usuários ({filteredUsers.length})</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Usuário</Th>
                    <Th>Contato</Th>
                    <Th>Role</Th>
                    <Th>Criação</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map((user) => (
                    <Tr key={user.id}>
                      <Td>
                        <HStack>
                          <Avatar size="sm" name={user.name} bg={`${getRoleColor(user.role)}.500`} />
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">{user.name}</Text>
                            <Text fontSize="sm" color="gray.600">ID: {user.id}</Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{user.email}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getRoleColor(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </Text>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
                          <MenuList>
                            <MenuItem icon={<FiEye />} onClick={() => handleViewUser(user)}>
                              Ver Detalhes
                            </MenuItem>
                            <MenuItem icon={<FiEdit />} onClick={() => handleEditUser(user)}>
                              Editar
                            </MenuItem>
                            <MenuItem icon={<FiTrash2 />} onClick={() => handleDeleteUser(user)} color="red.500">
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

        {/* User Details Modal */}
        <StandardModal
          isOpen={isOpen}
          onClose={onClose}
          title="Detalhes do Usuário"
          size="xl"
          showSave={false}
        >
          {selectedUser && (
            <Tabs>
              <TabList>
                <Tab>Informações Gerais</Tab>
                <Tab>Permissões</Tab>
                <Tab>Histórico</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <Avatar size="lg" name={selectedUser.name} bg={`${getRoleColor(selectedUser.role)}.500`} />
                      <VStack align="flex-start" spacing={1}>
                        <Text fontSize="lg" fontWeight="bold">{selectedUser.name}</Text>
                        <Text color="gray.600">{selectedUser.email}</Text>
                        <Badge colorScheme={getRoleColor(selectedUser.role)}>
                          {getRoleText(selectedUser.role)}
                        </Badge>
                      </VStack>
                    </HStack>
                    
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Data de Criação</Text>
                        <Text>{new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Última Atualização</Text>
                        <Text>{new Date(selectedUser.updatedAt).toLocaleDateString('pt-BR')}</Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <Text>Permissões do usuário serão exibidas aqui.</Text>
                </TabPanel>
                <TabPanel>
                  <Text>Histórico de atividades será exibido aqui.</Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </StandardModal>

        {/* Edit User Modal */}
        <StandardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Usuário"
          onSave={async () => {
            // Implementar edição
            console.log('Editar usuário:', selectedUser);
          }}
          saveText="Salvar Alterações"
        >
          {selectedUser && (
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Nome</FormLabel>
                <Input defaultValue={selectedUser.name} />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input defaultValue={selectedUser.email} />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select defaultValue={selectedUser.role}>
                  <option value="admin">Administrador</option>
                  <option value="driver">Motorista</option>
                </Select>
              </FormControl>
            </VStack>
          )}
        </StandardModal>

        {/* Delete User Modal */}
        <StandardModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Excluir Usuário"
          onDelete={async () => {
            // Implementar exclusão
            console.log('Excluir usuário:', selectedUser);
          }}
          showSave={false}
          showDelete={true}
          deleteText="Excluir Usuário"
        >
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.name}</strong>? 
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
    // Load translations
    const translations = await loadTranslations('pt', ['common', 'admin']);

    // Get all users (admins)
    const usersSnap = await store.users.findAll();
    const users = usersSnap.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    const stats = {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      drivers: 0, // Drivers não estão na coleção users
    };

    return {
      props: {
        users,
        stats,
        translations,
        userData: { name: 'Administrador' }, // Mock data
      },
    };
  } catch (error) {
    console.error('Error loading users management:', error);
    return {
      props: {
        users: [],
        stats: {
          total: 0,
          admins: 0,
          drivers: 0,
        },
        translations: { common: {}, admin: {} },
        userData: { name: 'Administrador' },
      },
    };
  }
};
