import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { withPublicSSR, PublicPageProps } from '@/lib/ssr';
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
import { PUBLIC } from '@/translations';

export default function ResetPasswordPage({ tPage }: PublicPageProps) {
  const router = useRouter();
  const t = tPage!;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há código de recuperação na URL
    const { oobCode: code, token: customToken } = router.query as Record<string, string>;
    if (code && typeof code === 'string') setOobCode(code);
    if (customToken && typeof customToken === 'string') setToken(customToken);
    if (!code && !customToken) router.push('/login?error=invalid-reset-link');
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
      setError(tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_PASSWORDS_DONT_MATCH));
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError(tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_WEAK_PASSWORD));
      setIsLoading(false);
      return;
    }

    if (!oobCode && !token) {
      setError(tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_INVALID_CODE));
      setIsLoading(false);
      return;
    }

    try {
      if (oobCode) {
        // Fluxo Firebase (oobCode)
        await confirmPasswordReset(auth, oobCode, password);
        setSuccess(true);
      } else if (token) {
        // Fluxo customizado (API própria)
        const resp = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: password })
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || 'Erro ao redefinir senha');
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      if (err.code === 'auth/expired-action-code') {
        setError(tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_EXPIRED_CODE));
      } else if (err.code === 'auth/invalid-action-code') {
        setError(tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_INVALID_CODE));
      } else if (err.code === 'auth/weak-password') {
        setError(tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_WEAK_PASSWORD));
      } else {
        setError(tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_GENERIC));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>{tPage(PUBLIC.AUTH.RESET_PASSWORD.SUCCESS_TITLE)} - Frota360.pt</title>
          <meta name="description" content={tPage(PUBLIC.AUTH.RESET_PASSWORD.SUCCESS_DESCRIPTION)} />
        </Head>

        <Container softBg maxW="md">
          <Title
            title={tPage(PUBLIC.AUTH.RESET_PASSWORD.SUCCESS_TITLE)}
            description={tPage(PUBLIC.AUTH.RESET_PASSWORD.SUCCESS_DESCRIPTION)}
            feature={tPage(PUBLIC.AUTH.RESET_PASSWORD.FEATURE)}
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
                    {tPage(PUBLIC.AUTH.RESET_PASSWORD.SUCCESS_TITLE)}
                  </Text>
                  <Text color="gray.600">
                    {tPage(PUBLIC.AUTH.RESET_PASSWORD.SUCCESS_DESCRIPTION)}
                  </Text>
                </VStack>

                <Button
                  as={Link}
                  href="/login"
                  leftIcon={<FiArrowRight />}
                  colorScheme="green"
                  w="full"
                  size="lg"
                >
                  {tPage(PUBLIC.AUTH.RESET_PASSWORD.GO_TO_LOGIN)}
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
          <title>{tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_INVALID_CODE)} - Frota360.pt</title>
        </Head>
        <Container softBg maxW="md">
          <Title
            title={tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_INVALID_CODE)}
            description={tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_NO_CODE)}
            feature={tPage(PUBLIC.AUTH.RESET_PASSWORD.FEATURE)}
          />
          <VStack spacing={8} align="stretch">
            <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
              <VStack spacing={6} align="center" textAlign="center">
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    {tPage(PUBLIC.AUTH.RESET_PASSWORD.ERROR_EXPIRED_CODE)}
                  </Text>
                </Alert>
                
                <Button
                  as={Link}
                  href="/forgot-password"
                  colorScheme="blue"
                  w="full"
                  size="lg"
                >
                  {tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUBMIT)}
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
        <title>{tPage(PUBLIC.AUTH.RESET_PASSWORD.TITLE)} - Frota360.pt</title>
        <meta name="description" content={tPage(PUBLIC.AUTH.RESET_PASSWORD.DESCRIPTION)} />
      </Head>

      <Container softBg maxW="md">
        <Title
          title={tPage(PUBLIC.AUTH.RESET_PASSWORD.TITLE)}
          description={tPage(PUBLIC.AUTH.RESET_PASSWORD.SUBTITLE)}
          feature={tPage(PUBLIC.AUTH.RESET_PASSWORD.FEATURE)}
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
                  <FormLabel>{tPage(PUBLIC.AUTH.RESET_PASSWORD.NEW_PASSWORD)}</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tPage(PUBLIC.AUTH.RESET_PASSWORD.NEW_PASSWORD_PLACEHOLDER)}
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
                          {passwordValidation.minLength ? '✓' : '✗'} {tPage(PUBLIC.AUTH.RESET_PASSWORD.PASSWORD_REQUIREMENTS.LENGTH)}
                        </Text>
                        <Text fontSize="xs" color={passwordValidation.hasNumber ? 'green.600' : 'red.600'}>
                          {passwordValidation.hasNumber ? '✓' : '✗'} {tPage(PUBLIC.AUTH.RESET_PASSWORD.PASSWORD_REQUIREMENTS.NUMBER)}
                        </Text>
                        <Text fontSize="xs" color={passwordValidation.hasLetter ? 'green.600' : 'red.600'}>
                          {passwordValidation.hasLetter ? '✓' : '✗'} {tPage(PUBLIC.AUTH.RESET_PASSWORD.PASSWORD_REQUIREMENTS.LOWERCASE)}
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </FormControl>

                <FormControl id="confirmPassword" isRequired>
                  <FormLabel>{tPage(PUBLIC.AUTH.RESET_PASSWORD.CONFIRM_PASSWORD)}</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={tPage(PUBLIC.AUTH.RESET_PASSWORD.CONFIRM_PASSWORD_PLACEHOLDER)}
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
                  loadingText={tPage(PUBLIC.AUTH.RESET_PASSWORD.SUBMIT)}
                  w="full"
                  isDisabled={!passwordValidation.isValid || password !== confirmPassword}
                >
                  {tPage(PUBLIC.AUTH.RESET_PASSWORD.SUBMIT)}
                </Button>
              </Stack>
            </form>

            <Divider my={6} />

            <VStack spacing={3}>
              <Button
                as={Link}
                href="/login"
                variant="outline"
                w="full"
              >
                {tPage(PUBLIC.AUTH.FORGOT_PASSWORD.BACK_TO_LOGIN)}
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('auth', undefined, true);
