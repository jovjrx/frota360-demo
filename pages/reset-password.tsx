import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { loadTranslations, createTranslationFunction } from '../lib/translations';
import { confirmPasswordReset } from 'firebase/auth';
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
  InputRightElement,
  Progress,
} from '@chakra-ui/react';
import { Title } from '@/components/Title';
import { Container } from '@/components/Container';
import { FiLock, FiArrowRight, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

interface ResetPasswordPageProps {
  translations: Record<string, any>;
}

export default function ResetPasswordPage({ translations }: ResetPasswordPageProps) {
  const router = useRouter();
  const t = createTranslationFunction(translations.common);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há código de recuperação na URL
    const { oobCode: code } = router.query;
    if (code && typeof code === 'string') {
      setOobCode(code);
    } else {
      // Se não há código, redirecionar para login
      router.push('/login?error=invalid-reset-link');
    }
  }, [router]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    return {
      minLength,
      hasNumber,
      hasLetter,
      isValid: minLength && hasNumber && hasLetter
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError('A senha deve ter pelo menos 6 caracteres, incluindo números e letras.');
      setIsLoading(false);
      return;
    }

    if (!oobCode) {
      setError('Link de recuperação inválido.');
      setIsLoading(false);
      return;
    }

    try {
      // Confirmar redefinição de senha
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      if (err.code === 'auth/expired-action-code') {
        setError('Este link de recuperação expirou. Solicite um novo.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('Link de recuperação inválido ou já utilizado.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Use uma senha mais forte.');
      } else {
        setError('Erro ao redefinir senha. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Senha Redefinida - Conduz.pt</title>
          <meta name="description" content="Sua senha foi redefinida com sucesso" />
        </Head>

        <Container softBg maxW="md">
          <Title
            title="Senha Redefinida!"
            description="Sua senha foi alterada com sucesso"
            feature="SUCESSO"
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
                    Senha redefinida com sucesso!
                  </Text>
                  <Text color="gray.600">
                    Sua nova senha foi definida. Agora você pode fazer login com ela.
                  </Text>
                </VStack>

                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Sua conta está segura novamente. Faça login para continuar.
                  </Text>
                </Alert>

                <Button
                  as={Link}
                  href="/login"
                  leftIcon={<FiArrowRight />}
                  colorScheme="green"
                  w="full"
                  size="lg"
                >
                  Fazer Login
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </>
    );
  }

  if (!oobCode) {
    return (
      <>
        <Head>
          <title>Link Inválido - Conduz.pt</title>
        </Head>
        <Container softBg maxW="md">
          <Title
            title="Link Inválido"
            description="Este link de recuperação não é válido"
            feature="ERRO"
          />
          <VStack spacing={8} align="stretch">
            <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
              <VStack spacing={6} align="center" textAlign="center">
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Este link de recuperação é inválido ou expirou.
                  </Text>
                </Alert>
                
                <Button
                  as={Link}
                  href="/forgot-password"
                  colorScheme="blue"
                  w="full"
                  size="lg"
                >
                  Solicitar Novo Link
                </Button>
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
        <title>Redefinir Senha - Conduz.pt</title>
        <meta name="description" content="Defina uma nova senha para sua conta" />
      </Head>

      <Container softBg maxW="md">
        <Title
          title="Redefinir Senha"
          description="Digite uma nova senha para sua conta"
          feature="SEGURANÇA"
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

                <FormControl id="password" isRequired>
                  <FormLabel>Nova Senha</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      size="lg"
                      required
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  
                  {/* Validação de senha */}
                  {password && (
                    <Box mt={2}>
                      <Progress
                        value={passwordValidation.isValid ? 100 : 60}
                        colorScheme={passwordValidation.isValid ? 'green' : 'orange'}
                        size="sm"
                        borderRadius="md"
                      />
                      <VStack spacing={1} mt={2} align="start">
                        <Text fontSize="xs" color={passwordValidation.minLength ? 'green.600' : 'red.600'}>
                          {passwordValidation.minLength ? '✓' : '✗'} Pelo menos 6 caracteres
                        </Text>
                        <Text fontSize="xs" color={passwordValidation.hasNumber ? 'green.600' : 'red.600'}>
                          {passwordValidation.hasNumber ? '✓' : '✗'} Contém números
                        </Text>
                        <Text fontSize="xs" color={passwordValidation.hasLetter ? 'green.600' : 'red.600'}>
                          {passwordValidation.hasLetter ? '✓' : '✗'} Contém letras
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </FormControl>

                <FormControl id="confirmPassword" isRequired>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      size="lg"
                      required
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="Redefinindo..."
                  w="full"
                  isDisabled={!passwordValidation.isValid || password !== confirmPassword}
                >
                  Redefinir Senha
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
