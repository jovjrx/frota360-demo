import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Head from 'next/head';
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
  Icon,
  InputGroup,
  InputRightElement,
  Select,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import Link from 'next/link';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiUser, FiPhone, FiCalendar, FiMapPin } from 'react-icons/fi';

interface SignupPageProps {
  translations: Record<string, any>;
}

export default function SignupPage({ translations }: SignupPageProps) {
  const router = useRouter();
  const t = createTranslationFunction(translations.common);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Cadastro de Motorista | Conduz.pt - Seja Motorista TVDE</title>
        <meta name="description" content="Cadastre-se como motorista na plataforma Conduz.pt. Onboarding rápido, suporte 7/7 e comissões transparentes." />
        <meta name="keywords" content="cadastro motorista, registro TVDE, ser motorista, cadastro Conduz" />
      </Head>

      <Box py={16} bg="gray.50">
        <Container maxW="4xl">
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
                  {t('signup.title')}
                </Heading>
                <Text color="gray.600">
                  {t('signup.subtitle')}
                </Text>
              </VStack>
          </VStack>

          {/* Formulário */}
          <Box bg="white" p={8} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>
                {/* Informações Pessoais */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={4}>
                    {t('signup.personalInfo')}
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <GridItem>
                      <FormControl id="firstName" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.firstName')}</FormLabel>
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="João"
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl id="lastName" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.lastName')}</FormLabel>
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Silva"
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                  
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mt={6}>
                    <GridItem>
                      <FormControl id="phone" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.phone')}</FormLabel>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+351 912 345 678"
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl id="birthDate" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.birthDate')}</FormLabel>
                        <Input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mt={6}>
                    <GridItem>
                      <FormControl id="city" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.city')}</FormLabel>
                        <Input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Lisboa"
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Box>

                <Divider />

                {/* Informações de Condução */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={4}>
                    {t('signup.drivingInfo')}
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <GridItem>
                      <FormControl id="licenseNumber" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.licenseNumber')}</FormLabel>
                        <Input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="123456789"
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl id="licenseExpiry" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.licenseExpiry')}</FormLabel>
                        <Input
                          type="date"
                          value={licenseExpiry}
                          onChange={(e) => setLicenseExpiry(e.target.value)}
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mt={6}>
                    <GridItem>
                      <FormControl id="vehicleType">
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('signup.vehicleOptional')}</FormLabel>
                        <Select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          placeholder="Selecione o tipo de veículo"
                          size="lg"
                          height="50px"
                          fontSize="md"
                        >
                          <option value="car">Automóvel</option>
                          <option value="motorcycle">Motociclo</option>
                          <option value="van">Furgão</option>
                          <option value="truck">Camião</option>
                        </Select>
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Box>

                <Divider />

                {/* Informações de Conta */}
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={4}>
                    {t('signup.accountInfo')}
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <GridItem>
                      <FormControl id="email" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.email')}</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          size="lg"
                          height="50px"
                          fontSize="md"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>

                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mt={6}>
                    <GridItem>
                      <FormControl id="password" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.password')}</FormLabel>
                        <InputGroup>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            size="lg"
                            height="50px"
                            fontSize="md"
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
                    </GridItem>
                    <GridItem>
                      <FormControl id="confirmPassword" isRequired>
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">{t('user.confirmPassword')}</FormLabel>
                        <InputGroup>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            size="lg"
                            height="50px"
                            fontSize="md"
                          />
                          <InputRightElement h="full">
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
                    </GridItem>
                  </Grid>
                </Box>

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
                  isLoading={loading}
                  loadingText="Criando conta..."
                  rightIcon={<FiArrowRight />}
                >
{t('signup.createAccount')}
                </Button>
              </Stack>
            </form>
          </Box>

          {/* Links */}
          <VStack spacing={4}>
            <Divider />
            <Text color="gray.600" fontSize="sm">
{t('signup.alreadyHaveAccount')}{' '}
              <ChakraLink as={Link} href="/login" color="green.500" fontWeight="medium">
                {t('signup.loginLink')}
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
