import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Text,
  VStack,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  Divider,
  InputGroup,
  InputRightElement,
  Select,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { Title } from '@/components/Title';
import { Container } from '@/components/Container';
import Link from 'next/link';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

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
      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Criar documento do motorista no Firestore
      const driverData = {
        uid: user.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        phone: phone,
        birthDate: birthDate,
        city: city,
        licenseNumber: licenseNumber,
        licenseExpiry: licenseExpiry,
        vehicleType: vehicleType || null,
        status: 'pending', // pending, active, inactive, suspended
        isActive: false, // Para controle rápido de ativação
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'self', // self, admin
        lastLoginAt: null,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        totalTrips: 0,
        rating: 0,
        // Campos adicionais para administração
        statusUpdatedAt: null,
        statusUpdatedBy: null,
        notes: '',
        documents: {
          license: {
            uploaded: false,
            verified: false,
            url: null
          },
          insurance: {
            uploaded: false,
            verified: false,
            url: null
          },
          vehicle: {
            uploaded: false,
            verified: false,
            url: null
          }
        }
      };

      // Salvar dados do motorista no Firestore
      await addDoc(collection(db, 'drivers'), driverData);

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
          userType: 'driver',
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Erro ao criar sessão');
      }

      // Redirecionar para o dashboard do motorista
      router.push('/drivers');
    } catch (err: any) {
      console.error('Erro ao criar conta:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está sendo usado.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
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

      <Container softBg maxW="4xl">
        <Title
          title={t('signup.title')}
          description={t('signup.subtitle')}
          feature="CADASTRO"
        />
        <VStack spacing={8} align="stretch">
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