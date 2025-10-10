import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
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
import { withPublicSSR, PublicPageProps } from '@/lib/ssr';
import { PUBLIC } from '@/translations';

export default function LoginPage({ tPage }: PublicPageProps) {
  const router = useRouter();
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
        router.push(sessionData.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      console.error('Erro de login:', err);
      if (err.code === 'auth/user-not-found') {
        setError(tPage(PUBLIC.AUTH.LOGIN.ERROR_USER_NOT_FOUND));
      } else if (err.code === 'auth/wrong-password') {
        setError(tPage(PUBLIC.AUTH.LOGIN.ERROR_WRONG_PASSWORD));
      } else if (err.code === 'auth/invalid-email') {
        setError(tPage(PUBLIC.AUTH.LOGIN.ERROR_INVALID_CREDENTIALS));
      } else if (err.code === 'auth/too-many-requests') {
        setError(tPage(PUBLIC.AUTH.LOGIN.ERROR_TOO_MANY_REQUESTS));
      } else {
        setError(tPage(PUBLIC.AUTH.LOGIN.ERROR_GENERIC));
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
        <title>{tPage(PUBLIC.AUTH.LOGIN.TITLE)} - Conduz.pt</title>
        <meta name="description" content={tPage(PUBLIC.AUTH.LOGIN.SUBTITLE)} />
      </Head>

      <Container softBg maxW="md">
        <Title
          title={tPage(PUBLIC.AUTH.LOGIN.TITLE)}
          description={tPage(PUBLIC.AUTH.LOGIN.SUBTITLE)}
          feature="LOGIN"
        />
        <VStack spacing={8} align="stretch">
          <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>

                {/* Email */}
                <FormControl id="email" isRequired>
                  <FormLabel>{tPage(PUBLIC.AUTH.LOGIN.EMAIL)}</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={tPage(PUBLIC.AUTH.LOGIN.EMAIL_PLACEHOLDER)}
                    size="lg"
                  />
                </FormControl>

                {/* Password */}
                <FormControl id="password" isRequired>
                  <FormLabel>{tPage(PUBLIC.AUTH.LOGIN.PASSWORD)}</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={tPage(PUBLIC.AUTH.LOGIN.PASSWORD_PLACEHOLDER)}
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
                  loadingText={tPage(PUBLIC.AUTH.LOGIN.SUBMIT)}
                  rightIcon={<FiArrowRight />}
                >
                  {tPage(PUBLIC.AUTH.LOGIN.SUBMIT)}
                </Button>
              </Stack>
            </form>
          </Box>

          {/* Links */}
          <VStack spacing={4}>
            <Divider />
            <Text color="gray.600" fontSize="sm" textAlign="center">
              <ChakraLink as={Link} href="/forgot-password" color="blue.500" fontWeight="medium">
                {tPage(PUBLIC.AUTH.LOGIN.FORGOT_PASSWORD)}
              </ChakraLink>
            </Text>
          </VStack>
        </VStack>
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('auth', undefined, true);