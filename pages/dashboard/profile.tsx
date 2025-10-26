import Head from 'next/head';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  Avatar,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Divider,
  Icon,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import PainelLayout from '@/components/layouts/DashboardLayout';
import StandardModal from '@/components/modals/StandardModal';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';

interface DriverProfileProps extends DashboardPageProps {
  motorista: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function DriverProfile({ 
  motorista, 
  translations,
}: DriverProfileProps) {
  const t = (key: string, fallback?: string) => {
    if (!translations?.common) return fallback || key;
    return getTranslation(translations.common, key) || fallback || key;
  };

  const tDashboard = (key: string, fallback?: string) => {
    if (!translations?.dashboard) return fallback || key;
    return getTranslation(translations.dashboard, key) || fallback || key;
  };

  const router = useRouter();
  const toast = useToast();
  
  // Estados para modais
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // Estados para formulários
  const [newName, setNewName] = useState(motorista?.fullName || '');
  const [newEmail, setNewEmail] = useState(motorista?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para mostrar/esconder senha
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar nome
  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast({
        title: t('error', 'Erro'),
        description: 'Nome não pode estar vazio',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/painel/update-name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar nome');
      }

      toast({
        title: 'Nome atualizado!',
        status: 'success',
        duration: 3000,
      });
      setIsEditNameOpen(false);
      router.reload();
    } catch (error: any) {
      toast({
        title: t('error', 'Erro'),
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Atualizar email
  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast({
        title: t('error', 'Erro'),
        description: 'Email inválido',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!currentPassword) {
      toast({
        title: t('error', 'Erro'),
        description: 'Senha atual é obrigatória',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/painel/update-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newEmail,
          currentPassword 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar email');
      }

      toast({
        title: 'Email atualizado!',
        description: 'Você será desconectado. Faça login com o novo email.',
        status: 'success',
        duration: 5000,
      });
      
      // Logout após 2 segundos
      setTimeout(() => {
        window.location.href = '/api/auth/logout';
      }, 2000);
    } catch (error: any) {
      toast({
        title: t('error', 'Erro'),
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Alterar senha
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: t('error', 'Erro'),
        description: 'Preencha todos os campos',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('error', 'Erro'),
        description: 'As senhas não coincidem',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('error', 'Erro'),
        description: 'A senha deve ter no mínimo 6 caracteres',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/painel/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword,
          newPassword 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao alterar senha');
      }

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
        status: 'success',
        duration: 3000,
      });
      
      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: t('error', 'Erro'),
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Perfil - Frota360.pt</title>
      </Head>
      
      <PainelLayout
        title="Perfil"
        subtitle="Gerencie suas credenciais de acesso"
        breadcrumbs={[{ label: 'Perfil' }]}
        translations={translations}
      >
        <VStack spacing={6} align="stretch">
          {/* Avatar e Nome */}
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Avatar 
                  size="2xl" 
                  name={motorista?.fullName || 'Motorista'} 
                  bg="green.500"
                />
                <Box textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold">
                    {motorista?.fullName}
                  </Text>
                  <Text color="gray.600">{motorista?.email}</Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Informações de Conta */}
          <Card>
            <CardHeader>
              <Heading size="md">Informações de Conta</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Nome */}
                <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                  <HStack>
                    <Icon as={FiUser} color="green.500" />
                    <Box>
                      <Text fontSize="sm" color="gray.600">Nome Completo</Text>
                      <Text fontWeight="medium">{motorista?.fullName}</Text>
                    </Box>
                  </HStack>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => {
                      setNewName(motorista?.fullName || '');
                      setIsEditNameOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                </HStack>

                <Divider />

                {/* Email */}
                <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                  <HStack>
                    <Icon as={FiMail} color="green.500" />
                    <Box>
                      <Text fontSize="sm" color="gray.600">Email de Login</Text>
                      <Text fontWeight="medium">{motorista?.email}</Text>
                    </Box>
                  </HStack>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => {
                      setNewEmail(motorista?.email || '');
                      setCurrentPassword('');
                      setIsEditEmailOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                </HStack>

                <Divider />

                {/* Senha */}
                <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                  <HStack>
                    <Icon as={FiLock} color="green.500" />
                    <Box>
                      <Text fontSize="sm" color="gray.600">Senha</Text>
                      <Text fontWeight="medium">••••••••</Text>
                    </Box>
                  </HStack>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setIsChangePasswordOpen(true);
                    }}
                  >
                    Alterar
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Modal: Editar Nome */}
        <StandardModal
          isOpen={isEditNameOpen}
          onClose={() => setIsEditNameOpen(false)}
          title="Editar Nome"
          size="md"
          onSave={handleUpdateName}
          saveText="Salvar"
          isLoading={isSaving}
        >
          <FormControl>
            <FormLabel>Nome Completo</FormLabel>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </FormControl>
        </StandardModal>

        {/* Modal: Editar Email */}
        <StandardModal
          isOpen={isEditEmailOpen}
          onClose={() => setIsEditEmailOpen(false)}
          title="Alterar Email"
          size="md"
          onSave={handleUpdateEmail}
          saveText="Salvar"
          isLoading={isSaving}
        >
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Novo Email</FormLabel>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Digite o novo email"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Senha Atual</FormLabel>
              <InputGroup>
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle password"
                    icon={showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Text fontSize="sm" color="orange.600">
              ⚠️ Após alterar o email, você será desconectado e precisará fazer login novamente.
            </Text>
          </VStack>
        </StandardModal>

        {/* Modal: Alterar Senha */}
        <StandardModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          title="Alterar Senha"
          size="md"
          onSave={handleChangePassword}
          saveText="Alterar Senha"
          isLoading={isSaving}
        >
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Senha Atual</FormLabel>
              <InputGroup>
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle password"
                    icon={showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Nova Senha</FormLabel>
              <InputGroup>
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle password"
                    icon={showNewPassword ? <FiEyeOff /> : <FiEye />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirmar Nova Senha</FormLabel>
              <InputGroup>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a nova senha novamente"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Toggle password"
                    icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </VStack>
        </StandardModal>
      </PainelLayout>
    </>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: true },
  async (context, user, driverId) => {
    return {};
  }
);
