import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
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
import { withPublicSSR, PublicPageProps } from '@/lib/ssr';
import { PUBLIC } from '@/translations';

export default function ForgotPasswordPage({ tPage }: PublicPageProps) {
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
        setError(tPage(PUBLIC.AUTH.FORGOT_PASSWORD.ERROR_USER_NOT_FOUND));
      } else if (err.code === 'auth/invalid-email') {
        setError(tPage(PUBLIC.AUTH.FORGOT_PASSWORD.ERROR_INVALID_EMAIL));
      } else if (err.code === 'auth/too-many-requests') {
        setError(tPage(PUBLIC.AUTH.FORGOT_PASSWORD.ERROR_TOO_MANY_REQUESTS));
      } else {
        setError(tPage(PUBLIC.AUTH.FORGOT_PASSWORD.ERROR_GENERIC));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>{tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUCCESS_TITLE)} - Frota360.pt</title>
          <meta name="description" content={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUCCESS_DESCRIPTION)} />
        </Head>

        <Container softBg maxW="md">
          <Title
            title={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUCCESS_TITLE)}
            description={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUCCESS_DESCRIPTION)}
            feature={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.FEATURE)}
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
                    {tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUCCESS_CHECK_INBOX)}
                  </Text>
                  <Text color="gray.600">
                    {email}
                  </Text>
                </VStack>

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      {tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUCCESS_INSTRUCTIONS)}
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
                    {tPage(PUBLIC.AUTH.FORGOT_PASSWORD.BACK_TO_LOGIN)}
                  </Button>
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
        <title>{tPage(PUBLIC.AUTH.FORGOT_PASSWORD.TITLE)} - Frota360.pt</title>
        <meta name="description" content={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.DESCRIPTION)} />
      </Head>

      <Container softBg maxW="md">
        <Title
          title={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.TITLE)}
          description={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUBTITLE)}
          feature={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.FEATURE)}
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
                  <FormLabel>{tPage(PUBLIC.AUTH.FORGOT_PASSWORD.EMAIL)}</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiMail color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.EMAIL_PLACEHOLDER)}
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
                  loadingText={tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUBMIT)}
                  w="full"
                >
                  {tPage(PUBLIC.AUTH.FORGOT_PASSWORD.SUBMIT)}
                </Button>
              </Stack>
            </form>

            <Divider my={6} />

            <VStack spacing={3}>
              <Button
                as={Link}
                href="/login"
                leftIcon={<FiArrowLeft />}
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

