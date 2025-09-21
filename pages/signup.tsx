import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc, updateDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
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
      // 1. PRIMEIRO: Criar documento do motorista no Firestore (sem UID ainda)
      const driverData = {
        uid: '', // Será preenchido depois
        userId: '', // Será preenchido depois
        email: email,
        firstName: firstName,
        lastName: lastName,
        name: `${firstName} ${lastName}`,
        fullName: `${firstName} ${lastName}`,
        phone: phone,
        birthDate: birthDate || null,
        city: city || null,
        licenseNumber: licenseNumber || null,
        licenseExpiry: licenseExpiry || null,
        vehicleType: vehicleType || null,
        
        // Campos administrativos (valores padrão)
        status: 'pending',
        isActive: false,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        totalTrips: 0,
        rating: 0,
        statusUpdatedAt: null,
        statusUpdatedBy: null,
        notes: '',
        lastPayoutAt: null,
        lastPayoutAmount: 0,
        
        // Campos técnicos
        locale: 'pt',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'self',
        lastLoginAt: null,
        
        // Documentos (estrutura padrão)
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

      console.log('1. Criando documento do motorista no Firestore...', driverData);
      const driverDocRef = await addDoc(collection(db, 'drivers'), driverData);
      console.log('✅ Documento do motorista criado com ID:', driverDocRef.id);

      // 2. SEGUNDO: Criar usuário no Firebase Auth
      console.log('2. Criando usuário no Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Usuário Firebase criado com UID:', user.uid);

      // 3. TERCEIRO: Atualizar documento do motorista com UID
      console.log('3. Atualizando documento do motorista com UID...');
      await updateDoc(driverDocRef, {
        uid: user.uid,
        userId: user.uid
      });
      console.log('✅ Documento do motorista atualizado com UID');

      // 4. QUARTO: Criar sessão no servidor
      console.log('4. Criando sessão no servidor...');
      const idToken = await user.getIdToken();
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
      console.log('✅ Sessão criada com sucesso');

      // 5. QUINTO: Redirecionar para o dashboard do motorista
      console.log('5. Redirecionando para dashboard...');
      router.push('/drivers');

    } catch (err: any) {
      console.error('❌ Erro no processo de cadastro:', err);
      
      // ROLLBACK: Se houve erro após criar o documento em drivers, deletá-lo
      if (err.code === 'auth/email-already-in-use') {
        console.log('🔄 Email já existe, verificando se precisa limpar documento...');
        // Verificar se existe documento órfão em drivers
        const driversSnap = await getDocs(query(
          collection(db, 'drivers'),
          where('email', '==', email),
          where('uid', '==', '')
        ));
        
        if (!driversSnap.empty) {
          console.log('🗑️ Deletando documento órfão em drivers...');
          await deleteDoc(driversSnap.docs[0].ref);
          console.log('✅ Documento órfão deletado');
        }
        
        setError('Este email já está cadastrado. Tente fazer login.');
        return;
      }
      
      // Se houve erro após criar documento em drivers, tentar deletá-lo
      if (err.message.includes('Firebase Auth') || err.message.includes('sessão')) {
        console.log('🔄 Erro após criar documento, tentando rollback...');
        try {
          const driversSnap = await getDocs(query(
            collection(db, 'drivers'),
            where('email', '==', email),
            where('uid', '==', '')
          ));
          
          if (!driversSnap.empty) {
            console.log('🗑️ Deletando documento órfão em drivers...');
            await deleteDoc(driversSnap.docs[0].ref);
            console.log('✅ Rollback realizado com sucesso');
          }
        } catch (rollbackError) {
          console.error('❌ Erro no rollback:', rollbackError);
        }
      }
      
      if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está cadastrado. Tente fazer login.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
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
                      <FormControl id="birthDate">
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">
                          {t('user.birthDate')} <Text as="span" color="gray.500" fontSize="sm">(opcional)</Text>
                        </FormLabel>
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
                      <FormControl id="city">
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">
                          {t('user.city')} <Text as="span" color="gray.500" fontSize="sm">(opcional)</Text>
                        </FormLabel>
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
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={2}>
                    {t('signup.drivingInfo')}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Os campos de condução são opcionais. Você pode preenchê-los agora ou depois no seu painel.
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <GridItem>
                      <FormControl id="licenseNumber">
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">
                          {t('user.licenseNumber')} <Text as="span" color="gray.500" fontSize="sm">(opcional)</Text>
                        </FormLabel>
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
                      <FormControl id="licenseExpiry">
                        <FormLabel fontSize="md" fontWeight="semibold" color="gray.700">
                          {t('user.licenseExpiry')} <Text as="span" color="gray.500" fontSize="sm">(opcional)</Text>
                        </FormLabel>
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