import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, FormControl, FormLabel, Input, Heading, VStack, useToast, Text, Link as ChakraLink } from '@chakra-ui/react';
import Link from 'next/link';
import { getTranslation } from '@/lib/translations';
import { withGuestSSR } from '@/lib/auth/withGuestSSR';

interface LoginPageProps {
  translations: Record<string, any>;
  locale: string;
}

export default function DriverLoginPage({ translations, locale }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tPage = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/driver/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || tPage('login.error.generic'));
      }

      toast({
        title: tPage('login.success.title'),
        description: tPage('login.success.description'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push('/driver/dashboard');
    } catch (error: any) {
      toast({
        title: tPage('login.error.title'),
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack minH="100vh" justify="center" bg="gray.50">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <VStack spacing={4} align="stretch">
          <Heading as="h1" size="xl" textAlign="center" mb={6}>
            {tPage('login.title')}
          </Heading>
          <Text textAlign="center" color="gray.600">
            {tPage('login.subtitle')}
          </Text>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email">
                <FormLabel>{t('email')}</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tPage('login.email_placeholder')}
                  required
                />
              </FormControl>
              <FormControl id="password">
                <FormLabel>{t('password')}</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tPage('login.password_placeholder')}
                  required
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" size="lg" width="full" isLoading={loading}>
                {tPage('login.button')}
              </Button>
            </VStack>
          </form>
          <Text textAlign="center" mt={4}>
            <ChakraLink as={Link} href="/forgot-password" color="blue.500">
              {tPage('login.forgot_password')}
            </ChakraLink>
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
}

export const getServerSideProps = withGuestSSR(async (context, user) => {
  // No specific data needed for the login page, just ensure it's a guest session
  return {};
});

