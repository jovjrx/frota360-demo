import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import { store } from '@/lib/store';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  useColorModeValue,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Avatar,
  AvatarBadge,
  IconButton,
  useToast,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
  Select,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { 
  FiCamera,
  FiSave,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiShield,
  FiSettings,
  FiEdit
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import { useState } from 'react';

interface ProfilePageProps {
  driver: any;
  tCommon: any;
  tDriver: any;
}

export default function ProfilePage({ 
  driver, 
  tCommon,
  tDriver 
}: ProfilePageProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    address: driver?.address || '',
    city: driver?.city || '',
    postalCode: driver?.postalCode || '',
    dateOfBirth: driver?.dateOfBirth || '',
    licenseNumber: driver?.licenseNumber || '',
    taxNumber: driver?.taxNumber || '',
    bankAccount: driver?.bankAccount || '',
    emergencyContact: driver?.emergencyContact || '',
    emergencyPhone: driver?.emergencyPhone || '',
  };

  const [preferences, setPreferences] = useState({
    emailNotifications: driver?.preferences?.emailNotifications ?? true,
    smsNotifications: driver?.preferences?.smsNotifications ?? false,
    pushNotifications: driver?.preferences?.pushNotifications ?? true,
    language: driver?.preferences?.language || 'pt',
    timezone: driver?.preferences?.timezone || 'Europe/Lisbon',
  };

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/drivers/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          preferences,
        }),
      };

      if (response.ok) {
        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram salvas com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        };
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar perfil. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      };
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  return (
    <>
      <Head>
        <title>Meu Perfil - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={6} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <VStack spacing={2} align="center">
              <Heading size="lg" color="gray.800">
                Meu Perfil
              </Heading>
              <Text color="gray.600" textAlign="center">
                Gerencie suas informações pessoais e preferências
              </Text>
            </VStack>
          </Box>
        </Box>

        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <Tabs variant="enclosed" colorScheme="purple">
            <TabList>
              <Tab>Informações Pessoais</Tab>
              <Tab>Documentos</Tab>
              <Tab>Preferências</Tab>
              <Tab>Segurança</Tab>
            </TabList>

            <TabPanels>
              {/* Personal Information Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  {/* Profile Header */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                      <HStack spacing={6} align="center">
                        <Box position="relative">
                          <Avatar 
                            size="xl" 
                            name={driver?.name || 'Motorista'} 
                            src={driver?.avatar}
                          >
                            <AvatarBadge boxSize="1.25em" bg="green.500" />
                          </Avatar>
                          <IconButton
                            aria-label="Alterar foto"
                            icon={<FiCamera />}
                            size="sm"
                            colorScheme="purple"
                            borderRadius="full"
                            position="absolute"
                            bottom="0"
                            right="0"
                          />
                        </Box>
                        <VStack align="flex-start" spacing={1}>
                          <Heading size="lg">{driver?.name || 'Motorista'}</Heading>
                          <Text color="gray.600">{driver?.email}</Text>
                          <HStack>
                            <Badge colorScheme={getStatusColor(driver?.status)}>
                              {getStatusText(driver?.status)}
                            </Badge>
                            <Text fontSize="sm" color="gray.500">
                              Membro desde {new Date(driver?.createdAt).toLocaleDateString('pt-BR')}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>

                  {/* Personal Details */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Informações Pessoais</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Nome Completo</FormLabel>
                          <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Seu nome completo"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Email</FormLabel>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="seu@email.com"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Telefone</FormLabel>
                          <Input
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+351 912 345 678"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <Input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Morada</FormLabel>
                          <Input
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Rua, número, andar"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Cidade</FormLabel>
                          <Input
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="Lisboa"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Código Postal</FormLabel>
                          <Input
                            value={formData.postalCode}
                            onChange={(e) => handleInputChange('postalCode', e.target.value)}
                            placeholder="1000-001"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>NIF</FormLabel>
                          <Input
                            value={formData.taxNumber}
                            onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                            placeholder="123456789"
                          />
                        </FormControl>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Emergency Contact */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Contacto de Emergência</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Nome do Contacto</FormLabel>
                          <Input
                            value={formData.emergencyContact}
                            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                            placeholder="Nome do contacto de emergência"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Telefone de Emergência</FormLabel>
                          <Input
                            value={formData.emergencyPhone}
                            onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                            placeholder="+351 912 345 678"
                          />
                        </FormControl>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Banking Information */}
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Informações Bancárias</Heading>
                    </CardHeader>
                    <CardBody>
                      <FormControl>
                        <FormLabel>IBAN</FormLabel>
                        <Input
                          value={formData.bankAccount}
                          onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                          placeholder="PT50 0000 0000 0000 0000 0000 0"
                        />
                      </FormControl>
                    </CardBody>
                  </Card>

                  <Button
                    colorScheme="purple"
                    size="lg"
                    leftIcon={<FiSave />}
                    onClick={handleSaveProfile}
                    isLoading={loading}
                    alignSelf="flex-start"
                  >
                    Salvar Alterações
                  </Button>
                </VStack>
              </TabPanel>

              {/* Documents Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Documentos</Heading>
                    </CardHeader>
                    <CardBody>
                      <Alert status="info" mb={4}>
                        <AlertIcon />
                        <AlertDescription>
                          Mantenha seus documentos atualizados para garantir o funcionamento adequado da sua conta.
                        </AlertDescription>
                      </Alert>

                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Carta de Condução</Text>
                            <Text fontSize="sm" color="gray.600">Número: {formData.licenseNumber || 'Não informado'}</Text>
                          </VStack>
                          <Badge colorScheme="green">Aprovado</Badge>
                        </HStack>

                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Certificado TVDE</Text>
                            <Text fontSize="sm" color="gray.600">Válido até: 31/12/2024</Text>
                          </VStack>
                          <Badge colorScheme="green">Aprovado</Badge>
                        </HStack>

                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Seguro do Veículo</Text>
                            <Text fontSize="sm" color="gray.600">Válido até: 15/06/2024</Text>
                          </VStack>
                          <Badge colorScheme="yellow">Expira em breve</Badge>
                        </HStack>

                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Certificado de Registo</Text>
                            <Text fontSize="sm" color="gray.600">Documento do veículo</Text>
                          </VStack>
                          <Badge colorScheme="green">Aprovado</Badge>
                        </HStack>
                      </VStack>

                      <Button mt={4} leftIcon={<FiEdit />} colorScheme="blue" variant="outline">
                        Atualizar Documentos
                      </Button>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Preferences Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Notificações</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Notificações por Email</Text>
                            <Text fontSize="sm" color="gray.600">Receber atualizações por email</Text>
                          </VStack>
                          <Switch
                            isChecked={preferences.emailNotifications}
                            onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                            colorScheme="purple"
                          />
                        </HStack>

                        <HStack justify="space-between">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Notificações SMS</Text>
                            <Text fontSize="sm" color="gray.600">Receber SMS importantes</Text>
                          </VStack>
                          <Switch
                            isChecked={preferences.smsNotifications}
                            onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                            colorScheme="purple"
                          />
                        </HStack>

                        <HStack justify="space-between">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Notificações Push</Text>
                            <Text fontSize="sm" color="gray.600">Notificações no navegador</Text>
                          </VStack>
                          <Switch
                            isChecked={preferences.pushNotifications}
                            onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                            colorScheme="purple"
                          />
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Localização e Idioma</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Idioma</FormLabel>
                          <Select
                            value={preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          >
                            <option value="pt">Português</option>
                            <option value="en">English</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Fuso Horário</FormLabel>
                          <Select
                            value={preferences.timezone}
                            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          >
                            <option value="Europe/Lisbon">Lisboa (GMT+0)</option>
                            <option value="Europe/London">Londres (GMT+0)</option>
                            <option value="Europe/Madrid">Madrid (GMT+1)</option>
                          </Select>
                        </FormControl>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  <Button
                    colorScheme="purple"
                    size="lg"
                    leftIcon={<FiSave />}
                    onClick={handleSaveProfile}
                    isLoading={loading}
                    alignSelf="flex-start"
                  >
                    Salvar Preferências
                  </Button>
                </VStack>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card bg={cardBg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">Segurança da Conta</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Palavra-passe</Text>
                            <Text fontSize="sm" color="gray.600">Última alteração há 30 dias</Text>
                          </VStack>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Alterar
                          </Button>
                        </HStack>

                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Autenticação de Dois Fatores</Text>
                            <Text fontSize="sm" color="gray.600">Adicione uma camada extra de segurança</Text>
                          </VStack>
                          <Button size="sm" colorScheme="green" variant="outline">
                            Ativar
                          </Button>
                        </HStack>

                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="md">
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="medium">Sessões Ativas</Text>
                            <Text fontSize="sm" color="gray.600">Gerencie dispositivos conectados</Text>
                          </VStack>
                          <Button size="sm" colorScheme="red" variant="outline">
                            Ver Sessões
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    
    
    // Load translations
    const translations = await loadTranslations(context.locale || 'pt', ['common', 'driver']);
    const { common: tCommon, driver: tDriver } = translations;

    // Get driver data
    const driver = { id: "demo-driver-1", name: "João Silva", email: "motorista@conduz.pt", status: "approved" };

    return {
      props: {
        driver,
        tCommon,
        tDriver,
      },
    };
  } catch (error) {
    console.error('Error loading profile page:', error);
    return {
      props: {
        driver: null,
        tCommon: {},
        tDriver: {},
      },
    };
  }
};
