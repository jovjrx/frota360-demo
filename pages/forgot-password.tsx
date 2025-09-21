import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { loadTranslations, createTranslationFunction } from '../lib/translations';
import { sendPasswordResetEmail } from 'firebase/auth';
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
  Alert,
  AlertIcon,
  Divider,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { Title } from '@/components/Title';
import { Container } from '@/components/Container';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';

interface ForgotPasswordPageProps {
  translations: Record<string, any>;
}

export default function ForgotPasswordPage({ translations }: ForgotPasswordPageProps) {
  const router = useRouter();
  const t = createTranslationFunction(translations.common);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Enviar email de recuperação de senha
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao enviar email de recuperação:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Não encontramos uma conta com este email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao enviar email. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Email Enviado - Conduz.pt</title>
          <meta name="description" content="Email de recuperação de senha enviado" />
        </Head>

        <Container softBg maxW="md">
          <Title
            title="Email Enviado!"
            description="Verifique sua caixa de entrada"
            feature="RECUPERAÇÃO"
          />
          <VStack spacing={8} align="stretch">
            <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
              <VStack spacing={6} align="center" textAlign="center">
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="green.100"
                  color="green.600"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                >
                  <FiCheck />
                </Box>
                
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                    Email de recuperação enviado!
                  </Text>
                  <Text color="gray.600">
                    Enviamos um link para redefinir sua senha para:
                  </Text>
                  <Text fontWeight="medium" color="blue.600">
                    {email}
                  </Text>
                </VStack>

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      <strong>Próximos passos:</strong>
                    </Text>
                    <Text fontSize="sm">
                      1. Verifique sua caixa de entrada<br/>
                      2. Clique no link do email<br/>
                      3. Defina uma nova senha
                    </Text>
                  </Box>
                </Alert>

                <VStack spacing={3} w="full">
                  <Button
                    as={Link}
                    href="/login"
                    leftIcon={<FiArrowLeft />}
                    variant="outline"
                    w="full"
                    size="lg"
                  >
                    Voltar ao Login
                  </Button>
                  
                  <Text fontSize="sm" color="gray.500">
                    Não recebeu o email? Verifique a pasta de spam ou{' '}
                    <Button
                      variant="link"
                      colorScheme="blue"
                      size="sm"
                      onClick={() => {
                        setSuccess(false);
                        setEmail('');
                      }}
                    >
                      tente novamente
                    </Button>
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Esqueci a Senha - Conduz.pt</title>
        <meta name="description" content="Recupere sua senha da plataforma Conduz.pt" />
      </Head>

      <Container softBg maxW="md">
        <Title
          title="Esqueci a Senha"
          description="Digite seu email para receber um link de recuperação"
          feature="RECUPERAÇÃO"
        />
        <VStack spacing={8} align="stretch">
          <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>
                {error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}

                <FormControl id="email" isRequired>
                  <FormLabel>Email</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiMail color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      size="lg"
                      required
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="Enviando..."
                  w="full"
                >
                  Enviar Link de Recuperação
                </Button>
              </Stack>
            </form>

            <Divider my={6} />

            <VStack spacing={3}>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Lembrou da sua senha?
              </Text>
              <Button
                as={Link}
                href="/login"
                leftIcon={<FiArrowLeft />}
                variant="outline"
                w="full"
              >
                Voltar ao Login
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale = 'pt' }) => {
  try {
    const translations = await loadTranslations(locale, ['common']);
    return {
      props: {
        translations: { common: translations.common },
      },
    };
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {
      props: {
        translations: { common: {} },
      },
    };
  }
};
