import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { loadTranslations, createTranslationFunction } from '../lib/translations';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  Container,
  VStack,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  Divider,
  Select,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

interface LoginPageProps {
  translations: Record<string, any>;
}

export default function LoginPage({ translations }: LoginPageProps) {
  const router = useRouter();
  const t = createTranslationFunction(translations.common);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'driver' as 'driver' | 'admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulação de autenticação para demonstração
      if (
        (formData.userType === 'admin' && formData.email === 'admin@conduz.pt' && formData.password === 'admin123') ||
        (formData.userType === 'driver' && formData.email === 'motorista@conduz.pt' && formData.password === 'driver123')
      ) {
        // Definir cookies de autenticação
        document.cookie = `auth-token=demo-token-${formData.userType}; path=/; max-age=86400; secure; samesite=strict`;
        document.cookie = `user-type=${formData.userType}; path=/; max-age=86400; secure; samesite=strict`;

        // Redirecionar baseado no tipo de usuário
        const redirectPath = router.query.redirect as string;
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push(formData.userType === 'admin' ? '/admin/dashboard' : '/drivers/dashboard');
        }
      } else {
        setError('Credenciais inválidas. Use as credenciais de demonstração.');
      }
    } catch (err) {
      setError(t('messages.error.network'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Head>
        <title>{t('navigation.login')} - Conduz.pt</title>
        <meta name="description" content="Faça login na plataforma Conduz.pt" />
      </Head>

      <Box py={16} bg="white">
        <Container maxW="md">
          <VStack spacing={8} align="stretch">
            {/* Logo e Título */}
            <VStack spacing={4} textAlign="center">
              <Box
                w="60px"
                h="60px"
                bg="green.500"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontWeight="bold"
                fontSize="2xl"
              >
                C
              </Box>
              <VStack spacing={2}>
                <Heading size="lg" color="gray.900">
                  {t('navigation.login')}
                </Heading>
                <Text color="gray.600">
                  Acesse a sua conta na plataforma
                </Text>
              </VStack>
            </VStack>


            {/* Formulário */}
            <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
              <form onSubmit={handleSubmit}>
                <Stack spacing={6}>
                  {/* User Type Selection */}
                  <FormControl id="userType" isRequired>
                    <FormLabel>Tipo de Utilizador</FormLabel>
                    <Select
                      value={formData.userType}
                      onChange={handleInputChange}
                      name="userType"
                      size="lg"
                    >
                      <option value="driver">Motorista</option>
                      <option value="admin">Administrador</option>
                    </Select>
                  </FormControl>

                  {/* Email */}
                  <FormControl id="email" isRequired>
                    <FormLabel>{t('user.email')}</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      size="lg"
                    />
                  </FormControl>

                  {/* Password */}
                  <FormControl id="password" isRequired>
                    <FormLabel>{t('user.password')}</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        size="lg"
                      />
                      <InputRightElement h="full">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    colorScheme="green"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Entrando..."
                    rightIcon={<FiArrowRight />}
                  >
                    {t('navigation.login')}
                  </Button>
                </Stack>
              </form>
            </Box>

            {/* Links */}
            <VStack spacing={4}>
              <Divider />
              <Text color="gray.600" fontSize="sm">
                Não tem uma conta?{' '}
                <ChakraLink as={Link} href="/signup" color="green.500" fontWeight="medium">
                  Criar conta
                </ChakraLink>
              </Text>
            </VStack>

          </VStack>
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const translations = await loadTranslations(locale || 'pt', ['common']);

  return {
    props: {
      translations,
    },
  };
};
