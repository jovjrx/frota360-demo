import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Box,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Card,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { FiEdit3, FiEye, FiEyeOff, FiSave, FiUser } from 'react-icons/fi';

import LoggedInLayout from '@/components/LoggedInLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { withAuth } from '@/lib/auth/withAuth';
import { dashboardAPI } from '@/lib/api/dashboard';

interface ProfilePageProps {
  user: any;
}

function ProfilePage({ user }: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await dashboardAPI.getDriverData(user.uid);
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await dashboardAPI.updateProfile(user.uid, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
      });
      
      toast({
        title: 'Perfil atualizado',
        description: 'Seus dados foram salvos com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      loadProfile();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      await dashboardAPI.changePassword(user.uid, formData.newPassword);
      
      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a senha',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoggedInLayout title="Perfil" subtitle="Carregando seus dados...">
        <LoadingSpinner message="Carregando perfil..." />
      </LoggedInLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Meu Perfil - Conduz.pt</title>
        <meta name="description" content="Gerencie seus dados pessoais" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <LoggedInLayout 
        title="Meu Perfil"
        subtitle="Gerencie seus dados pessoais"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Perfil' }
        ]}
      >
        <VStack spacing={8} align="stretch">
          {/* Informações Pessoais */}
          <Card p={6} borderRadius="xl" border="1px" borderColor="gray.200">
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    p={2}
                    bg="green.100"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiUser color="#38A169" size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                      Informações Pessoais
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Atualize seus dados de contato
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  leftIcon={<FiSave />}
                  colorScheme="green"
                  onClick={handleSaveProfile}
                  isLoading={saving}
                  loadingText="Salvando..."
                >
                  Salvar Alterações
                </Button>
              </HStack>

              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Nome Completo</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+351 123 456 789"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>E-mail</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </FormControl>
              </VStack>
            </VStack>
          </Card>

          {/* Segurança */}
          <Card p={6} borderRadius="xl" border="1px" borderColor="gray.200">
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                    Segurança
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Gerencie sua senha e configurações de segurança
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiEdit3 />}
                  variant="outline"
                  onClick={onOpen}
                >
                  Alterar Senha
                </Button>
              </HStack>
            </VStack>
          </Card>

          {/* Modal de Alteração de Senha */}
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Alterar Senha</ModalHeader>
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Nova Senha</FormLabel>
                    <InputGroup>
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                      <InputRightElement>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          icon={showNewPassword ? <FiEyeOff /> : <FiEye />}
                          aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </FormControl>

                  <Alert status="info">
                    <AlertIcon />
                    <Text fontSize="sm">
                      A senha deve ter pelo menos 6 caracteres.
                    </Text>
                  </Alert>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleChangePassword}
                  isLoading={saving}
                  loadingText="Alterando..."
                >
                  Alterar Senha
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </LoggedInLayout>
    </>
  );
}

export default withAuth(ProfilePage);
