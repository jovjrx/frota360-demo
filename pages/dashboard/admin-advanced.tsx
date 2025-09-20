import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  useToast,
  SimpleGrid,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiUsers, FiBell, FiDatabase, FiShield, FiPlus, FiSend } from 'react-icons/fi';

import LoggedInLayout from '@/components/LoggedInLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DataTable } from '@/components/dashboard/DataTable';
import { withAdmin } from '@/lib/auth/withAdmin';
import { adminAPI } from '@/lib/api/admin';

interface AdminAdvancedPageProps {
  user: any;
}

function AdminAdvancedPage({ user }: AdminAdvancedPageProps) {
  const [motorists, setMotorists] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [notificationForm, setNotificationForm] = useState({
    type: 'system',
    title: '',
    message: '',
    recipients: 'all',
    selectedUsers: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [motoristsData, auditData, backupsData] = await Promise.all([
        adminAPI.getAllMotorists(),
        adminAPI.getAuditLogs(20),
        adminAPI.listBackups(5),
      ]);
      
      setMotorists(motoristsData);
      setAuditLogs(auditData.logs);
      setBackups(backupsData.backups);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: 'Erro',
        description: 'Preencha título e mensagem',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSending(true);
    try {
      let result;
      
      if (notificationForm.recipients === 'all') {
        const userIds = motorists.map(m => m.id);
        result = await adminAPI.sendBulkNotification(
          userIds,
          notificationForm.type,
          notificationForm.title,
          notificationForm.message,
          user.uid
        );
      } else {
        result = await adminAPI.sendNotification(
          notificationForm.selectedUsers[0],
          notificationForm.type,
          notificationForm.title,
          notificationForm.message,
          user.uid
        );
      }

      toast({
        title: 'Notificação enviada',
        description: 'Notificação enviada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNotificationForm({
        type: 'system',
        title: '',
        message: '',
        recipients: 'all',
        selectedUsers: [],
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a notificação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const result = await adminAPI.createBackup(user.uid);
      
      toast({
        title: 'Backup criado',
        description: `Backup ${result.backupId} criado com sucesso`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o backup',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <LoggedInLayout title="Gestão Avançada" subtitle="Carregando dados...">
        <LoadingSpinner message="Carregando dados administrativos..." />
      </LoggedInLayout>
    );
  }

  const motoristColumns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, row: any) => (
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium">{value}</Text>
          <Text fontSize="sm" color="gray.500">{row.email}</Text>
        </VStack>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (value: boolean) => (
        <Badge colorScheme={value ? 'green' : 'red'} variant="subtle">
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'documentsCount',
      label: 'Documentos',
      render: (value: number) => (
        <Text fontWeight="medium">{value}</Text>
      ),
    },
    {
      key: 'unreadNotifications',
      label: 'Notificações',
      render: (value: number) => (
        <Badge colorScheme={value > 0 ? 'red' : 'gray'} variant="subtle">
          {value}
        </Badge>
      ),
    },
  ];

  const auditColumns = [
    {
      key: 'type',
      label: 'Tipo',
      render: (value: string) => (
        <Badge colorScheme="blue" variant="subtle">
          {value}
        </Badge>
      ),
    },
    {
      key: 'action',
      label: 'Ação',
      render: (value: string) => (
        <Text fontWeight="medium">{value}</Text>
      ),
    },
    {
      key: 'details',
      label: 'Detalhes',
      render: (value: string) => (
        <Text fontSize="sm" color="gray.600" maxW="300px" isTruncated>
          {value}
        </Text>
      ),
    },
    {
      key: 'timestamp',
      label: 'Data',
      render: (value: number) => (
        <Text fontSize="sm" color="gray.500">
          {new Date(value).toLocaleString('pt-PT')}
        </Text>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Gestão Avançada - Conduz.pt</title>
        <meta name="description" content="Gestão avançada do sistema" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <LoggedInLayout 
        title="Gestão Avançada"
        subtitle="Ferramentas administrativas avançadas"
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Avançado' }
        ]}
      >
        <VStack spacing={8} align="stretch">
          {/* Ações Rápidas */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card p={6} borderRadius="xl" border="1px" borderColor="gray.200">
              <VStack spacing={4} align="center">
                <Box
                  p={3}
                  bg="green.100"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FiBell color="#38A169" size={24} />
                </Box>
                <VStack spacing={2} align="center">
                  <Text fontWeight="semibold" color="gray.900">
                    Enviar Notificação
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Envie notificações para motoristas
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiSend />}
                  colorScheme="green"
                  size="sm"
                  onClick={onOpen}
                >
                  Enviar
                </Button>
              </VStack>
            </Card>

            <Card p={6} borderRadius="xl" border="1px" borderColor="gray.200">
              <VStack spacing={4} align="center">
                <Box
                  p={3}
                  bg="blue.100"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FiDatabase color="#3182CE" size={24} />
                </Box>
                <VStack spacing={2} align="center">
                  <Text fontWeight="semibold" color="gray.900">
                    Criar Backup
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Faça backup dos dados do sistema
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  size="sm"
                  onClick={handleCreateBackup}
                >
                  Criar
                </Button>
              </VStack>
            </Card>

            <Card p={6} borderRadius="xl" border="1px" borderColor="gray.200">
              <VStack spacing={4} align="center">
                <Box
                  p={3}
                  bg="purple.100"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FiShield color="#805AD5" size={24} />
                </Box>
                <VStack spacing={2} align="center">
                  <Text fontWeight="semibold" color="gray.900">
                    Logs de Auditoria
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Monitore atividades do sistema
                  </Text>
                </VStack>
                <Badge colorScheme="purple" variant="subtle">
                  {auditLogs.length} logs
                </Badge>
              </VStack>
            </Card>
          </SimpleGrid>

          {/* Lista de Motoristas */}
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.900">
              Motoristas ({motorists.length})
            </Text>
            <DataTable
              columns={motoristColumns}
              data={motorists}
              emptyMessage="Nenhum motorista encontrado"
            />
          </Box>

          {/* Logs de Auditoria */}
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.900">
              Logs de Auditoria Recentes
            </Text>
            <DataTable
              columns={auditColumns}
              data={auditLogs}
              emptyMessage="Nenhum log encontrado"
            />
          </Box>

          {/* Backups */}
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.900">
              Backups Recentes
            </Text>
            {backups.length > 0 ? (
              <VStack spacing={3} align="stretch">
                {backups.map((backup: any) => (
                  <Card key={backup.id} p={4} borderRadius="lg" border="1px" borderColor="gray.200">
                    <HStack justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{backup.id}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(backup.timestamp).toLocaleString('pt-PT')}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Text fontSize="sm" color="gray.600">
                          {backup.stats.driversCount} motoristas
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {backup.stats.auditLogsCount} logs
                        </Text>
                      </VStack>
                    </HStack>
                  </Card>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500">Nenhum backup encontrado</Text>
            )}
          </Box>
        </VStack>

        {/* Modal de Notificação */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Enviar Notificação</ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    value={notificationForm.type}
                    onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                  >
                    <option value="system">Sistema</option>
                    <option value="announcement">Anúncio</option>
                    <option value="reminder">Lembrete</option>
                    <option value="warning">Aviso</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Destinatários</FormLabel>
                  <Select
                    value={notificationForm.recipients}
                    onChange={(e) => setNotificationForm({ ...notificationForm, recipients: e.target.value })}
                  >
                    <option value="all">Todos os motoristas</option>
                    <option value="selected">Motorista específico</option>
                  </Select>
                </FormControl>

                {notificationForm.recipients === 'selected' && (
                  <FormControl>
                    <FormLabel>Motorista</FormLabel>
                    <Select
                      onChange={(e) => setNotificationForm({ 
                        ...notificationForm, 
                        selectedUsers: [e.target.value] 
                      })}
                    >
                      <option value="">Selecione um motorista</option>
                      {motorists.map((motorist) => (
                        <option key={motorist.id} value={motorist.id}>
                          {motorist.name} ({motorist.email})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Título</FormLabel>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    placeholder="Título da notificação"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Mensagem</FormLabel>
                  <Textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    placeholder="Mensagem da notificação"
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="green"
                onClick={handleSendNotification}
                isLoading={sending}
                loadingText="Enviando..."
              >
                Enviar Notificação
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </LoggedInLayout>
    </>
  );
}

export default withAdmin(AdminAdvancedPage);
