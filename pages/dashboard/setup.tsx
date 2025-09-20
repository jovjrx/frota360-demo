import React, { useState } from 'react';
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
  Alert,
  AlertIcon,
  Card,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FiUserPlus, FiMail, FiLock } from 'react-icons/fi';

import LoggedInLayout from '@/components/LoggedInLayout';
import { withAdmin } from '@/lib/auth/withAdmin';
import { adminAPI } from '@/lib/api/admin';

interface SetupPageProps {
  user: any;
}

function SetupPage({ user }: SetupPageProps) {
  const [email, setEmail] = useState('conduzcontacto@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await adminAPI.createAdminUser(email, password);
      
      if (result.success) {
        toast({
          title: 'Usuário admin criado com sucesso!',
          description: 'Agora você pode fazer login com este email.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setPassword('');
      } else {
        toast({
          title: 'Erro ao criar usuário',
          description: result.error || 'Erro desconhecido',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar usuário',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Configuração de Admin - Conduz.pt</title>
        <meta name="description" content="Configuração de usuário admin" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <LoggedInLayout 
        title="Configuração de Admin"
        subtitle="Criar usuário administrativo"
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Setup' }
        ]}
      >
        <VStack spacing={8} align="stretch">
          {/* Aviso de Segurança */}
          <Alert status="warning">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">
                Esta página permite criar o usuário admin inicial.
              </Text>
              <Text fontSize="sm">
                Use apenas durante a configuração inicial do sistema. 
                Delete esta página após a configuração para segurança.
              </Text>
            </VStack>
          </Alert>

          {/* Formulário */}
          <Card p={8} borderRadius="xl" border="1px" borderColor="gray.200">
            <VStack spacing={6} align="stretch">
              <VStack spacing={2} align="start">
                <HStack spacing={3}>
                  <Box
                    p={2}
                    bg="green.100"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiUserPlus color="#38A169" size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                      Criar Usuário Admin
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Configure as credenciais do administrador
                    </Text>
                  </VStack>
                </HStack>
              </VStack>

              <form onSubmit={handleCreateAdmin}>
                <VStack spacing={6}>
                  <FormControl isRequired>
                    <FormLabel>Email do Admin</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@conduz.pt"
                      size="lg"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Senha</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      size="lg"
                      minLength={6}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="green"
                    size="lg"
                    isLoading={loading}
                    loadingText="Criando..."
                    leftIcon={<FiUserPlus />}
                    width="full"
                  >
                    Criar Usuário Admin
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Card>

          {/* Instruções */}
          <Card p={6} borderRadius="xl" border="1px" borderColor="gray.200" bg="gray.50">
            <VStack spacing={4} align="start">
              <Text fontWeight="semibold" color="gray.900">
                Instruções:
              </Text>
              <VStack spacing={2} align="start" fontSize="sm" color="gray.600">
                <Text>1. Preencha o email e senha desejados</Text>
                <Text>2. Clique em "Criar Usuário Admin"</Text>
                <Text>3. Após a criação, faça login normalmente</Text>
                <Text>4. Delete esta página após a configuração inicial</Text>
              </VStack>
            </VStack>
          </Card>
        </VStack>
      </LoggedInLayout>
    </>
  );
}

export default withAdmin(SetupPage);
