import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { loadTranslations, createTranslationFunction } from '../lib/translations';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  VStack,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  Divider,
  Select,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { Title } from '@/components/Title';
import { Container } from '@/components/Container';
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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Autenticação com Firebase
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Obter ID token para criar sessão no servidor
      const idToken = await user.getIdToken();

      // Criar sessão no servidor
      const sessionResponse = await fetch('/api/auth/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: idToken,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Erro ao criar sessão');
      }

      const sessionData = await sessionResponse.json();

      // Redirecionar baseado no tipo de usuário
      const redirectPath = router.query.redirect as string;
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        router.push(sessionData.role === 'admin' ? '/admin' : '/drivers');
      }
    } catch (err: any) {
      console.error('Erro de login:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado. Verifique o email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
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

      <Container softBg maxW="md">
        <Title
          title={t('navigation.login')}
          description="Acesse a sua conta na plataforma"
          feature="ACESSO"
        />
        <VStack spacing={8} align="stretch">
          <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>

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
            <Text color="gray.600" fontSize="sm" textAlign="center">
              <ChakraLink as={Link} href="/forgot-password" color="blue.500" fontWeight="medium">
                Esqueci a senha
              </ChakraLink>
            </Text>
            <Text color="gray.600" fontSize="sm">
              Não tem uma conta?{' '}
              <ChakraLink as={Link} href="/signup" color="green.500" fontWeight="medium">
                  Criar conta
              </ChakraLink>
            </Text>
          </VStack>
        </VStack>
      </Container>
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