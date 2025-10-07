import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
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
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
} from 'react-icons/fi';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { useTranslations } from '@/hooks/useTranslations';
import { getTranslation } from '@/lib/translations';
import StandardModal from '@/components/modals/StandardModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver';
  createdAt: string;
  updatedAt: string;
}

interface UsersPageProps extends AdminPageProps {
  initialUsers: User[];
  initialStats: {
    total: number;
    admins: number;
    drivers: number;
  };
}

export default function UsersManagement({ user, translations, locale, initialUsers, initialStats }: UsersPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

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

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    onViewModalOpen();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onEditModalOpen();
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    onDeleteModalOpen();
  };

  const handleUserAction = async (action: string, userData?: any) => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/user-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action,
          userData
        }),
      });

      if (response.ok) {
        const actionText = {
          'update_user': 'atualizado',
          'delete_user': 'excluído',
          'change_role': 'role alterado'
        }[action] || 'atualizado';

        toast({
          title: 'Usuário atualizado!',
          description: `O usuário foi ${actionText} com sucesso.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        router.replace(router.asPath); // Recarregar dados via SSR
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerenciar usuário');
      }
    } catch (error) {
      toast({
        title: 'Erro!',
        description: error instanceof Error ? error.message : 'Não foi possível gerenciar o usuário.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      onEditModalClose();
      onDeleteModalClose();
    }
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
    <AdminLayout
      title="Gerenciar Usuários"
      subtitle="Gerencie todos os usuários do sistema (admins e motoristas)"
      breadcrumbs={[
        { label: 'Usuários' }
      ]}
    >
      <Card mb={6}>
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

      <Card>
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
        isOpen={isViewModalOpen}
        onClose={onViewModalClose}
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
        onClose={onEditModalClose}
        title="Editar Usuário"
        onSave={async () => {
          const nameInput = document.getElementById('edit-name') as HTMLInputElement;
          const emailInput = document.getElementById('edit-email') as HTMLInputElement;
          const roleSelect = document.getElementById('edit-role') as HTMLSelectElement;

          if (!nameInput.value || !emailInput.value || !roleSelect.value) {
            toast({
              title: 'Campos obrigatórios',
              description: 'Por favor, preencha todos os campos.',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
            return;
          }

          await handleUserAction('update_user', {
            name: nameInput.value,
            email: emailInput.value,
            role: roleSelect.value
          });
        }}
        saveText="Salvar Alterações"
      >
        {selectedUser && (
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Nome</FormLabel>
              <Input id="edit-name" defaultValue={selectedUser.name} />
            </FormControl>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input id="edit-email" defaultValue={selectedUser.email} />
            </FormControl>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Select id="edit-role" defaultValue={selectedUser.role}>
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
        onClose={onDeleteModalClose}
        title="Excluir Usuário"
        onDelete={async () => {
          await handleUserAction('delete_user');
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
  );
}

export const getServerSideProps = withAdminSSR<UsersPageProps>(async (context, user) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cookieHeader = context.req.headers.cookie || '';

  try {
    const response = await fetch(`${baseUrl}/api/admin/user-management`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    return {
      props: {
        initialUsers: data.users || [],
        initialStats: data.stats || { total: 0, admins: 0, drivers: 0 },
      },
    };
  } catch (error) {
    console.error('Error fetching users for SSR:', error);
    return {
      props: {
        initialUsers: [],
        initialStats: { total: 0, admins: 0, drivers: 0 },
      },
    };
  }
});

