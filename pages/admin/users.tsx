import { useState, useMemo, useCallback } from 'react';
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
  useDisclosure,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiMoreVertical,
  FiTrash2,
  FiDownload,
} from 'react-icons/fi';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { getUsers, getUsersStats } from '@/lib/admin/adminQueries';
import StandardModal from '@/components/modals/StandardModal';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';

type UserAction = 'update_user' | 'delete_user' | 'change_role';
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

export default function UsersManagement({ tPage, tAdmin, initialUsers, initialStats }: UsersPageProps) {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(() => initialStats ?? { total: 0, admins: 0, drivers: 0 });
  const [actionInProgress, setActionInProgress] = useState<UserAction | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

  const tAdminBase = useMemo(() => createSafeTranslator(tPage ?? tAdmin), [tAdmin, tPage]);

  const t = useMemo(
    () => (key: string, fallback: string, variables?: Record<string, any>) =>
      tAdminBase(key, fallback, variables),
    [tAdminBase]
  );

  const refreshUsersData = useCallback(async () => {
    const response = await fetch('/api/admin/user-management');

    if (!response.ok) {
      throw new Error(
        t(
          'users.toasts.error.refresh',
          'Não foi possível atualizar a lista de usuários. Tente novamente em instantes.'
        )
      );
    }

    const data = await response.json();

    setUsers(Array.isArray(data.users) ? data.users : []);
    setStats(data.stats ?? { total: 0, admins: 0, drivers: 0 });

    return data as { users?: User[]; stats?: { total: number; admins: number; drivers: number } };
  }, [t]);

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
      case 'admin':
        return t('users.roles.admin', 'Administrador');
      case 'driver':
        return t('users.roles.driver', 'Motorista');
      default:
        return t('users.roles.unknown', 'Desconhecido');
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

  const handleUserAction = async (action: UserAction, userData?: any) => {
    if (!selectedUser) return;

    setLoading(true);
    setActionInProgress(action);

    const selectedUserId = selectedUser.id;
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
          update_user: t('users.toasts.actions.updated', 'atualizado'),
          delete_user: t('users.toasts.actions.deleted', 'excluído'),
          change_role: t('users.toasts.actions.roleChanged', 'role alterado'),
        }[action] || t('users.toasts.actions.updated', 'atualizado');

        const refreshed = await refreshUsersData();

        if (action === 'update_user') {
          const updatedUser = refreshed?.users?.find((user: User) => user.id === selectedUserId);
          if (updatedUser) {
            setSelectedUser(updatedUser);
          }
        }

        if (action === 'delete_user') {
          setSelectedUser(null);
        }

        toast({
          title: t('users.toasts.success.title', 'Usuário atualizado!'),
          description: t('users.toasts.success.description', 'O usuário foi {{action}} com sucesso.', {
            action: actionText,
          }),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || t('users.toasts.error.generic', 'Erro ao gerenciar usuário'));
      }
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : t('users.toasts.error.description', 'Não foi possível gerenciar o usuário.');

      toast({
        title: t('users.toasts.error.title', 'Erro!'),
        description,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      throw error instanceof Error ? error : new Error(description);
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      [
        t('users.export.headers.name', 'Nome'),
        t('users.export.headers.email', 'Email'),
        t('users.export.headers.role', 'Role'),
        t('users.export.headers.createdAt', 'Data de Criação'),
      ],
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
    a.download = t('users.export.filename', 'usuarios.csv');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout
      title={t('users.title', 'Gerenciar Usuários')}
      subtitle={t('users.subtitle', 'Gerencie todos os usuários do sistema (admins e motoristas)')}
      breadcrumbs={[
        { label: t('users.breadcrumb', 'Usuários') }
      ]}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>{t('users.stats.total', 'Total de Usuários')}</StatLabel>
              <StatNumber>{stats.total ?? 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>{t('users.stats.admins', 'Administradores')}</StatLabel>
              <StatNumber>{stats.admins ?? 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>{t('users.stats.drivers', 'Motoristas')}</StatLabel>
              <StatNumber>{stats.drivers ?? 0}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card mb={6}>
        <CardBody>
          <HStack spacing={4} justify="space-between">
            <HStack spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <FiSearch />
                </InputLeftElement>
                <Input
                  placeholder={t('users.search.placeholder', 'Buscar usuários...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">{t('users.filter.roles.all', 'Todos os Roles')}</option>
                <option value="admin">{t('users.filter.roles.admin', 'Administradores')}</option>
                <option value="driver">{t('users.filter.roles.driver', 'Motoristas')}</option>
              </Select>
            </HStack>
            <HStack spacing={4}>
              <Button leftIcon={<FiDownload />} variant="outline" onClick={exportUsers}>
                {t('users.actions.exportCsv', 'Exportar CSV')}
              </Button>
              <Button leftIcon={<FiPlus />} colorScheme="purple">
                {t('users.actions.addUser', 'Adicionar Usuário')}
              </Button>
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">{t('users.table.title', 'Lista de Usuários')} ({filteredUsers.length})</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>{t('users.table.headers.user', 'Usuário')}</Th>
                  <Th>{t('users.table.headers.contact', 'Contato')}</Th>
                  <Th>{t('users.table.headers.role', 'Role')}</Th>
                  <Th>{t('users.table.headers.createdAt', 'Criação')}</Th>
                  <Th>{t('users.table.headers.actions', 'Ações')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.length === 0 ? (
                  <Tr>
                    <Td colSpan={5}>
                      <Text textAlign="center" color="gray.500">
                        {t(
                          'users.table.empty',
                          'Nenhum usuário encontrado. Ajuste os filtros ou tente outra busca.'
                        )}
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredUsers.map((user) => (
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
                              {t('users.table.actions.viewDetails', 'Ver Detalhes')}
                            </MenuItem>
                            <MenuItem icon={<FiEdit />} onClick={() => handleEditUser(user)}>
                              {t('users.table.actions.edit', 'Editar')}
                            </MenuItem>
                            <MenuItem
                              icon={<FiTrash2 />}
                              onClick={() => handleDeleteUser(user)}
                              color="red.500"
                            >
                              {t('users.table.actions.delete', 'Excluir')}
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* User Details Modal */}
      <StandardModal
        isOpen={isViewModalOpen}
        onClose={onViewModalClose}
        title={t('users.modals.view.title', 'Detalhes do Usuário')}
        size="xl"
        showSave={false}
      >
        {selectedUser && (
          <Tabs>
            <TabList>
              <Tab>{t('users.modals.view.tabs.general', 'Informações Gerais')}</Tab>
              <Tab>{t('users.modals.view.tabs.permissions', 'Permissões')}</Tab>
              <Tab>{t('users.modals.view.tabs.history', 'Histórico')}</Tab>
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
                      <Text fontSize="sm" color="gray.500">
                        {t('users.modals.view.labels.createdAt', 'Data de Criação')}
                      </Text>
                      <Text>{new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        {t('users.modals.view.labels.updatedAt', 'Última Atualização')}
                      </Text>
                      <Text>{new Date(selectedUser.updatedAt).toLocaleDateString('pt-BR')}</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </TabPanel>
              <TabPanel>
                <Text>{t('users.modals.view.permissionsPlaceholder', 'Permissões do usuário serão exibidas aqui.')}</Text>
              </TabPanel>
              <TabPanel>
                <Text>{t('users.modals.view.historyPlaceholder', 'Histórico de atividades será exibido aqui.')}</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </StandardModal>

      {/* Edit User Modal */}
      <StandardModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        title={t('users.modals.edit.title', 'Editar Usuário')}
        disableAutoToast
        onSave={async () => {
          const nameInput = document.getElementById('edit-name') as HTMLInputElement;
          const emailInput = document.getElementById('edit-email') as HTMLInputElement;
          const roleSelect = document.getElementById('edit-role') as HTMLSelectElement;

          if (!nameInput.value || !emailInput.value || !roleSelect.value) {
            toast({
              title: t('users.modals.edit.requiredFields.title', 'Campos obrigatórios'),
              description: t('users.modals.edit.requiredFields.description', 'Por favor, preencha todos os campos.'),
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
        isLoading={loading && actionInProgress === 'update_user'}
        saveText={t('users.modals.edit.saveButton', 'Salvar Alterações')}
      >
        {selectedUser && (
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>{t('users.fields.name', 'Nome')}</FormLabel>
              <Input id="edit-name" defaultValue={selectedUser.name} />
            </FormControl>
            <FormControl>
              <FormLabel>{t('users.fields.email', 'Email')}</FormLabel>
              <Input id="edit-email" defaultValue={selectedUser.email} />
            </FormControl>
            <FormControl>
              <FormLabel>{t('users.fields.role', 'Role')}</FormLabel>
              <Select id="edit-role" defaultValue={selectedUser.role}>
                <option value="admin">{t('users.roles.admin', 'Administrador')}</option>
                <option value="driver">{t('users.roles.driver', 'Motorista')}</option>
              </Select>
            </FormControl>
          </VStack>
        )}
      </StandardModal>

      {/* Delete User Modal */}
      <StandardModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        title={t('users.modals.delete.title', 'Excluir Usuário')}
        disableAutoToast
        onDelete={async () => {
          await handleUserAction('delete_user');
        }}
        showSave={false}
        showDelete={true}
        isDeleting={loading && actionInProgress === 'delete_user'}
        deleteText={t('users.modals.delete.confirmButton', 'Excluir Usuário')}
      >
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>
            {t('users.modals.delete.confirmation', 'Tem certeza que deseja excluir o usuário')}{' '}
            <strong>{selectedUser?.name}</strong>?{' '}
            {t('users.modals.delete.note', 'Esta ação não pode ser desfeita.')}
          </AlertDescription>
        </Alert>
      </StandardModal>
    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Carregar dados iniciais diretamente do Firestore
  const [users, stats] = await Promise.all([
    getUsers(),
    getUsersStats(),
  ]);

  return {
    initialUsers: users,
    initialStats: stats,
  };
});

