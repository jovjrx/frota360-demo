import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withAdmin } from '@/lib/auth/withAdmin';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Badge,
  Icon,
  Flex,
  Spacer,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { 
  FiSettings, 
  FiGlobe, 
  FiDollarSign, 
  FiKey, 
  FiCreditCard, 
  FiSave,
  FiEdit,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import AdminLayout from '@/components/layouts/AdminLayout';

interface AdminConfigProps {
  config: any;
  translations: Record<string, any>;
  userData: any;
}

export default function AdminConfig({ 
  config, 
  translations,
  userData,
  tCommon
}: AdminConfigProps & { tCommon: (key: string) => string }) {
  const tAdmin = (key: string) => translations.admin?.[key] || key;
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [formData, setFormData] = useState({
    // Sistema
    timezone: config?.timezone || 'Europe/Lisbon',
    currency: config?.currency || 'EUR',
    currencySymbol: config?.currencySymbol || '€',
    currencyRate: config?.currencyRate || 1,
    
    // Pagamentos
    paymentSystemActive: config?.paymentSystemActive || false,
    paymentProvider: config?.paymentProvider || 'stripe',
    stripePublicKey: config?.stripePublicKey || '',
    stripeSecretKey: config?.stripeSecretKey || '',
    stripeWebhookSecret: config?.stripeWebhookSecret || '',
    
    // Integrações
    uberApiKey: config?.uberApiKey || '',
    uberApiSecret: config?.uberApiSecret || '',
    boltApiKey: config?.boltApiKey || '',
    boltApiSecret: config?.boltApiSecret || '',
    
    // Configurações Gerais
    companyName: config?.companyName || 'Conduz.pt',
    companyEmail: config?.companyEmail || 'admin@conduz.pt',
    companyPhone: config?.companyPhone || '+351 123 456 789',
    companyAddress: config?.companyAddress || 'Lisboa, Portugal',
    
    // Notificações
    emailNotifications: config?.emailNotifications || true,
    smsNotifications: config?.smsNotifications || false,
    pushNotifications: config?.pushNotifications || true,
    
    // Segurança
    twoFactorAuth: config?.twoFactorAuth || false,
    sessionTimeout: config?.sessionTimeout || 24,
    maxLoginAttempts: config?.maxLoginAttempts || 5,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Salvar configurações via API
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }

      toast({
        title: 'Configurações salvas!',
        description: 'As configurações foram atualizadas com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <Head>
        <title>Configurações do Sistema - Conduz.pt</title>
      </Head>
      
      <AdminLayout
        title="Configurações do Sistema"
        subtitle="Gerencie as configurações globais da plataforma"
        user={{
          name: userData?.name || 'Administrador',
          avatar: userData?.avatar,
          role: 'admin',
          status: 'active'
        }}
        notifications={0}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Configurações' }
        ]}
        alerts={[
          {
            type: 'info',
            title: 'Configurações do Sistema',
            description: 'Altere estas configurações com cuidado. Mudanças podem afetar o funcionamento da plataforma.'
          }
        ]}
      >
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Configurações do Sistema</Heading>
              <HStack>
                <Button
                  leftIcon={<Icon as={FiEye} />}
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? 'Ocultar' : 'Mostrar'} Chaves
                </Button>
                <Button
                  leftIcon={<Icon as={FiSave} />}
                  colorScheme="blue"
                  onClick={handleSave}
                  isLoading={isLoading}
                  loadingText="Salvando..."
                >
                  Salvar Configurações
                </Button>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <Tabs>
              <TabList>
                <Tab>Sistema</Tab>
                <Tab>Pagamentos</Tab>
                <Tab>Integrações</Tab>
                <Tab>Empresa</Tab>
                <Tab>Notificações</Tab>
                <Tab>Segurança</Tab>
              </TabList>

              <TabPanels>
                {/* Sistema */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Timezone</FormLabel>
                          <Select
                            value={formData.timezone}
                            onChange={(e) => handleInputChange('timezone', e.target.value)}
                          >
                            <option value="Europe/Lisbon">Lisboa (GMT+0/+1)</option>
                            <option value="Europe/London">Londres (GMT+0/+1)</option>
                            <option value="Europe/Paris">Paris (GMT+1/+2)</option>
                            <option value="Europe/Madrid">Madrid (GMT+1/+2)</option>
                            <option value="America/New_York">Nova York (GMT-5/-4)</option>
                          </Select>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>Moeda</FormLabel>
                          <Select
                            value={formData.currency}
                            onChange={(e) => handleInputChange('currency', e.target.value)}
                          >
                            <option value="EUR">Euro (€)</option>
                            <option value="USD">Dólar ($)</option>
                            <option value="GBP">Libra (£)</option>
                            <option value="BRL">Real (R$)</option>
                          </Select>
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>Símbolo da Moeda</FormLabel>
                          <Input
                            value={formData.currencySymbol}
                            onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                            placeholder="€"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>Taxa de Câmbio</FormLabel>
                          <NumberInput
                            value={formData.currencyRate}
                            onChange={(value) => handleInputChange('currencyRate', parseFloat(value))}
                            min={0.01}
                            max={1000}
                            precision={4}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </VStack>
                </TabPanel>

                {/* Pagamentos */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Sistema de Pagamentos</AlertTitle>
                        <AlertDescription>
                          Configure o sistema de pagamentos para permitir que motoristas paguem suas assinaturas automaticamente.
                        </AlertDescription>
                      </Box>
                    </Alert>

                    <FormControl>
                      <FormLabel>Sistema de Pagamentos Ativo</FormLabel>
                      <Switch
                        isChecked={formData.paymentSystemActive}
                        onChange={(e) => handleInputChange('paymentSystemActive', e.target.checked)}
                      />
                      <Text fontSize="sm" color="gray.600" mt={2}>
                        {formData.paymentSystemActive 
                          ? 'Motoristas podem pagar assinaturas automaticamente' 
                          : 'Apenas administradores podem marcar pagamentos como realizados'
                        }
                      </Text>
                    </FormControl>

                    <Divider />

                    <FormControl>
                      <FormLabel>Provedor de Pagamento</FormLabel>
                      <Select
                        value={formData.paymentProvider}
                        onChange={(e) => handleInputChange('paymentProvider', e.target.value)}
                      >
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="square">Square</option>
                      </Select>
                    </FormControl>

                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Chave Pública Stripe</FormLabel>
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.stripePublicKey}
                            onChange={(e) => handleInputChange('stripePublicKey', e.target.value)}
                            placeholder="pk_test_..."
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>Chave Secreta Stripe</FormLabel>
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.stripeSecretKey}
                            onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                            placeholder="sk_test_..."
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem colSpan={2}>
                        <FormControl>
                          <FormLabel>Webhook Secret Stripe</FormLabel>
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.stripeWebhookSecret}
                            onChange={(e) => handleInputChange('stripeWebhookSecret', e.target.value)}
                            placeholder="whsec_..."
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </VStack>
                </TabPanel>

                {/* Integrações */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Alert status="warning">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Integrações com Plataformas</AlertTitle>
                        <AlertDescription>
                          Configure as integrações com Uber, Bolt e outras plataformas para sincronizar dados automaticamente.
                        </AlertDescription>
                      </Box>
                    </Alert>

                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <FormControl>
                          <FormLabel>API Key Uber</FormLabel>
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.uberApiKey}
                            onChange={(e) => handleInputChange('uberApiKey', e.target.value)}
                            placeholder="Uber API Key"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>API Secret Uber</FormLabel>
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.uberApiSecret}
                            onChange={(e) => handleInputChange('uberApiSecret', e.target.value)}
                            placeholder="Uber API Secret"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>API Key Bolt</FormLabel>
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.boltApiKey}
                            onChange={(e) => handleInputChange('boltApiKey', e.target.value)}
                            placeholder="Bolt API Key"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>API Secret Bolt</FormLabel>
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={formData.boltApiSecret}
                            onChange={(e) => handleInputChange('boltApiSecret', e.target.value)}
                            placeholder="Bolt API Secret"
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </VStack>
                </TabPanel>

                {/* Empresa */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                      <GridItem>
                        <FormControl>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <Input
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            placeholder="Conduz.pt"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>Email da Empresa</FormLabel>
                          <Input
                            type="email"
                            value={formData.companyEmail}
                            onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                            placeholder="admin@conduz.pt"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>Telefone da Empresa</FormLabel>
                          <Input
                            value={formData.companyPhone}
                            onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                            placeholder="+351 123 456 789"
                          />
                        </FormControl>
                      </GridItem>
                      
                      <GridItem>
                        <FormControl>
                          <FormLabel>Endereço da Empresa</FormLabel>
                          <Input
                            value={formData.companyAddress}
                            onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                            placeholder="Lisboa, Portugal"
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>
                  </VStack>
                </TabPanel>

                {/* Notificações */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <FormControl>
                      <FormLabel>Notificações por Email</FormLabel>
                      <Switch
                        isChecked={formData.emailNotifications}
                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Notificações por SMS</FormLabel>
                      <Switch
                        isChecked={formData.smsNotifications}
                        onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Notificações Push</FormLabel>
                      <Switch
                        isChecked={formData.pushNotifications}
                        onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                      />
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Segurança */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <FormControl>
                      <FormLabel>Autenticação de Dois Fatores</FormLabel>
                      <Switch
                        isChecked={formData.twoFactorAuth}
                        onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Timeout de Sessão (horas)</FormLabel>
                      <NumberInput
                        value={formData.sessionTimeout}
                        onChange={(value) => handleInputChange('sessionTimeout', parseInt(value))}
                        min={1}
                        max={168}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Máximo de Tentativas de Login</FormLabel>
                      <NumberInput
                        value={formData.maxLoginAttempts}
                        onChange={(value) => handleInputChange('maxLoginAttempts', parseInt(value))}
                        min={3}
                        max={10}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get session from Iron Session
    const { getSession } = await import('@/lib/session/ironSession');
    const session = await getSession(context.req, context.res);
    
    if (!session.userId) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(session.userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    if (!userData || userData.role !== 'admin') {
      return {
        redirect: {
          destination: '/drivers',
          permanent: false,
        },
      };
    }

    // Extract locale from middleware header
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    const translations = await loadTranslations(locale, ['common', 'admin']);

    // Get system configuration
    const configDoc = await adminDb.collection('system_config').doc('main').get();
    const config = configDoc.exists ? configDoc.data() : {};

    return {
      props: {
        config,
        translations,
        userData,
      },
    };
  } catch (error) {
    console.error('Error loading admin config:', error);
    return {
      props: {
        config: {},
        translations: { common: {}, admin: {} },
        userData: null,
      },
    };
  }
};
