import { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Box,
  Heading,
  useBreakpointValue,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
} from '@chakra-ui/react';
import {
  FiUser,
  FiCreditCard,
  FiTruck,
  FiDollarSign,
  FiLock,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';

interface Driver {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  type?: string;
  rentalFee?: number;
  birthDate?: string;
  city?: string;
  integrations?: {
    uber?: {
      key?: string | null;
      enabled?: boolean;
    };
    bolt?: {
      key?: string | null;
      enabled?: boolean;
    };
    myprio?: {
      key?: string | null;
      enabled?: boolean;
    };
    viaverde?: {
      key?: string | null;
      enabled?: boolean;
    };
  };
  banking?: {
    iban?: string | null;
    accountHolder?: string | null;
  };
  vehicle?: {
    plate?: string;
    make?: string;
    model?: string;
    year?: number;
  };
}

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver | null;
  onSave: (driverData: any) => Promise<any>;
  tCommon: any;
  tPage: any;
}

export default function DriverModal({
  isOpen,
  onClose,
  driver,
  onSave,
  tCommon,
  tPage,
}: DriverModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Detectar se é mobile para ajustar abas
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  
  const isEditMode = !!driver?.id;
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    type: 'affiliate' as 'affiliate' | 'renter',
    status: 'active',
    birthDate: '',
    city: '',
    rentalFee: 0,
    iban: '',
    accountHolder: '',
    vehiclePlate: '',
    vehicleModel: '',
    vehicleMake: '',
    vehicleYear: '',
    uberUuid: '',
    uberEnabled: false,
    boltEmail: '',
    boltEnabled: false,
    myprioCard: '',
    myprioEnabled: false,
    viaverdeEnabled: false,
  });

  // Preencher dados quando modal abrir
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && driver) {
        setFormData({
          fullName: driver.fullName || driver.name || '',
          email: driver.email || '',
          phone: driver.phone || '',
          type: (driver.type as 'affiliate' | 'renter') || 'affiliate',
          status: driver.status || 'active',
          birthDate: driver.birthDate || '',
          city: driver.city || '',
          rentalFee: driver.rentalFee || 0,
          iban: driver.banking?.iban || '',
          accountHolder: driver.banking?.accountHolder || '',
          vehiclePlate: driver.vehicle?.plate || '',
          vehicleModel: driver.vehicle?.model || '',
          vehicleMake: driver.vehicle?.make || '',
          vehicleYear: driver.vehicle?.year?.toString() || '',
          uberUuid: driver.integrations?.uber?.key || '',
          uberEnabled: driver.integrations?.uber?.enabled || false,
          boltEmail: driver.integrations?.bolt?.key || '',
          boltEnabled: driver.integrations?.bolt?.enabled || false,
          myprioCard: driver.integrations?.myprio?.key || '',
          myprioEnabled: driver.integrations?.myprio?.enabled || false,
          viaverdeEnabled: driver.integrations?.viaverde?.enabled || false,
        });
      } else {
        // Reset para modo criação
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          type: 'affiliate',
          status: 'active',
          birthDate: '',
          city: '',
          rentalFee: 0,
          iban: '',
          accountHolder: '',
          vehiclePlate: '',
          vehicleModel: '',
          vehicleMake: '',
          vehicleYear: '',
          uberUuid: '',
          uberEnabled: false,
          boltEmail: '',
          boltEnabled: false,
          myprioCard: '',
          myprioEnabled: false,
          viaverdeEnabled: false,
        });
      }
      setTemporaryPassword(null);
      setNewPassword('');
      setShowPassword(false);
    }
  }, [isOpen, driver, isEditMode]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        // Para criação, adicionar campos necessários
        ...(isEditMode ? {} : {
          firstName: formData.fullName.split(' ')[0] || '',
          lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
        }),
        // Integrações
        integrations: {
          uber: {
            key: formData.uberUuid || null,
            enabled: formData.uberEnabled && !!formData.uberUuid,
          },
          bolt: {
            key: formData.boltEmail || null,
            enabled: formData.boltEnabled && !!formData.boltEmail,
          },
          myprio: {
            key: formData.myprioCard || null,
            enabled: formData.myprioEnabled && !!formData.myprioCard,
          },
          viaverde: {
            key: formData.vehiclePlate || null,
            enabled: formData.viaverdeEnabled && !!formData.vehiclePlate,
          },
        },
        // Dados bancários
        banking: {
          iban: formData.iban || null,
          accountHolder: formData.accountHolder || null,
        },
        // Veículo
        vehicle: {
          plate: formData.vehiclePlate || undefined,
          make: formData.vehicleMake || undefined,
          model: formData.vehicleModel || undefined,
          year: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
        },
        // Senha (apenas para edição)
        ...(isEditMode && newPassword ? { newPassword } : {}),
      };

      const result = await onSave(payload);
      
      if (result?.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
      } else {
        onClose();
      }
      
    } catch (error: any) {
      toast({
        title: t(`drivers.${isEditMode ? 'edit' : 'add'}.toasts.error.title`, `Erro ao ${isEditMode ? 'atualizar' : 'criar'} motorista`),
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          {isEditMode 
            ? t('drivers.editDriver', 'Editar Motorista')
            : t('drivers.addDriver', 'Adicionar Motorista')
          }
        </ModalHeader>
        
        <ModalBody>
          {temporaryPassword && (
            <Alert status="success" mb={4} flexDirection="column" alignItems="flex-start">
              <HStack w="full" justifyContent="space-between">
                <AlertIcon />
                <AlertTitle mr={0}>{t('drivers.add.toasts.success.title', 'Motorista criado com sucesso!')}</AlertTitle>
                <CloseButton position="absolute" right="8px" top="8px" onClick={() => setTemporaryPassword(null)} />
              </HStack>
              <AlertDescription mt={2}>
                <Text>
                  {t('drivers.add.alert.passwordLabel', 'Senha temporária:')}{' '}
                  <Text as="b" fontFamily="mono">{temporaryPassword}</Text>
                </Text>
                <Text>{t('drivers.add.alert.emailSent', 'Também enviamos esta senha por email ao motorista.')}</Text>
                <Text mt={2}>{t('drivers.add.alert.copyWarning', 'Copie a senha agora, ela não será exibida novamente.')}</Text>
                <HStack mt={2}>
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(temporaryPassword)}>
                    {t('drivers.add.actions.copyPassword', 'Copiar senha')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={onClose}>
                    {t('drivers.add.actions.goToList', 'Fechar')}
                  </Button>
                </HStack>
              </AlertDescription>
            </Alert>
          )}

          <Tabs>
            <TabList>
              <Tab>
                <Icon as={FiUser} mr={isMobile ? 1 : 2} />
                {!isMobile && t('drivers.tabs.basic', 'Dados básicos')}
              </Tab>
              <Tab>
                <Icon as={FiCreditCard} mr={isMobile ? 1 : 2} />
                {!isMobile && t('drivers.tabs.integrations', 'Integrações')}
              </Tab>
              <Tab>
                <Icon as={FiTruck} mr={isMobile ? 1 : 2} />
                {!isMobile && t('drivers.tabs.vehicle', 'Veículo')}
              </Tab>
              <Tab>
                <Icon as={FiDollarSign} mr={isMobile ? 1 : 2} />
                {!isMobile && t('drivers.tabs.banking', 'Dados bancários')}
              </Tab>
              {isEditMode && (
                <Tab>
                  <Icon as={FiLock} mr={isMobile ? 1 : 2} />
                  {!isMobile && t('drivers.tabs.password', 'Senha')}
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* Tab Básico */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>{t('drivers.form.fullName.label', 'Nome completo')}</FormLabel>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder={t('drivers.form.fullName.placeholder', 'Nome completo do motorista')}
                    />
                  </FormControl>

                  <HStack spacing={4} w="full">
                    <FormControl isRequired flex="1">
                      <FormLabel>{t('drivers.form.email.label', 'Email')}</FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder={t('drivers.form.email.placeholder', 'email@exemplo.com')}
                      />
                    </FormControl>
                    
                    <FormControl isRequired flex="1">
                      <FormLabel>{t('drivers.form.phone.label', 'Telefone')}</FormLabel>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder={t('drivers.form.phone.placeholder', '+351 913 415 670')}
                      />
                    </FormControl>
                  </HStack>

                  <HStack spacing={4} w="full">
                    <FormControl isRequired flex="1">
                      <FormLabel>{t('drivers.form.type.label', 'Tipo')}</FormLabel>
                      <Select
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                      >
                        <option value="affiliate">{t('drivers.type.affiliate', 'Afiliado')}</option>
                        <option value="renter">{t('drivers.type.renter', 'Locatário')}</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl isRequired flex="1">
                      <FormLabel>{t('drivers.form.status.label', 'Status')}</FormLabel>
                      <Select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                      >
                        <option value="pending">{tc('status.pending', 'Pendente')}</option>
                        <option value="active">{tc('status.active', 'Ativo')}</option>
                        <option value="inactive">{tc('status.inactive', 'Inativo')}</option>
                        <option value="suspended">{tc('status.suspended', 'Suspenso')}</option>
                      </Select>
                    </FormControl>
                  </HStack>

                  <HStack spacing={4} w="full">
                    <FormControl flex="1">
                      <FormLabel>{t('drivers.form.birthDate.label', 'Data de Nascimento')}</FormLabel>
                      <Input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleChange('birthDate', e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl flex="1">
                      <FormLabel>{t('drivers.form.city.label', 'Cidade')}</FormLabel>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder={t('drivers.form.city.placeholder', 'Lisboa')}
                      />
                    </FormControl>
                  </HStack>

                  {/* Campo de valor de aluguel apenas para locatários */}
                  {formData.type === 'renter' && (
                    <FormControl w="full">
                      <FormLabel>{t('drivers.form.rentalFee.label', 'Valor de aluguel (€/semana)')}</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.rentalFee}
                        onChange={(e) => handleChange('rentalFee', parseFloat(e.target.value) || 0)}
                        placeholder={t('drivers.form.rentalFee.placeholder', '0.00')}
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.form.rentalFee.description', 'Valor do aluguel semanal cobrado do locatário.')}
                      </Text>
                    </FormControl>
                  )}
                </VStack>
              </TabPanel>

              {/* Tab Integrações */}
              <TabPanel>
                <VStack spacing={4}>
                  {/* Uber */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.uber.title', 'Uber')}</Heading>
                      <Switch
                        isChecked={formData.uberEnabled}
                        onChange={(e) => handleChange('uberEnabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.uber.keyLabel', 'UUID do motorista')}</FormLabel>
                      <Input
                        placeholder={t('drivers.integrations.uber.placeholder', 'Ex: 12345678-1234-1234-1234-123456789012')}
                        value={formData.uberUuid}
                        onChange={(e) => handleChange('uberUuid', e.target.value)}
                        isDisabled={!formData.uberEnabled}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.uber.description', 'Identificador do motorista utilizado nas exportações da Uber.')}
                      </Text>
                    </FormControl>
                  </Box>

                  {/* Bolt */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.bolt.title', 'Bolt')}</Heading>
                      <Switch
                        isChecked={formData.boltEnabled}
                        onChange={(e) => handleChange('boltEnabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.bolt.keyLabel', 'Email associado')}</FormLabel>
                      <Input
                        type="email"
                        placeholder={t('drivers.integrations.bolt.placeholder', 'email@exemplo.com')}
                        value={formData.boltEmail}
                        onChange={(e) => handleChange('boltEmail', e.target.value)}
                        isDisabled={!formData.boltEnabled}
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.bolt.description', 'Email utilizado para autenticar a integração com a Bolt.')}
                      </Text>
                    </FormControl>
                  </Box>

                  {/* MyPrio */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.myprio.title', 'MyPrio')}</Heading>
                      <Switch
                        isChecked={formData.myprioEnabled}
                        onChange={(e) => handleChange('myprioEnabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.myprio.keyLabel', 'Número do cartão')}</FormLabel>
                      <Input
                        placeholder={t('drivers.integrations.myprio.placeholder', 'Ex: 1234567890123456')}
                        value={formData.myprioCard}
                        onChange={(e) => handleChange('myprioCard', e.target.value)}
                        isDisabled={!formData.myprioEnabled}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.myprio.description', 'Número do cartão para abastecimentos PRIO.')}
                      </Text>
                    </FormControl>
                  </Box>

                  {/* ViaVerde */}
                  <Box w="100%" p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{t('drivers.integrations.viaverde.title', 'ViaVerde')}</Heading>
                      <Switch
                        isChecked={formData.viaverdeEnabled}
                        onChange={(e) => handleChange('viaverdeEnabled', e.target.checked)}
                        colorScheme="green"
                      />
                    </HStack>
                    <FormControl>
                      <FormLabel fontSize="sm">{t('drivers.integrations.viaverde.keyLabel', 'Matrícula vinculada')}</FormLabel>
                      <Input
                        placeholder={t('drivers.integrations.viaverde.placeholder', 'Ex: AB-12-CD')}
                        value={formData.vehiclePlate}
                        onChange={(e) => handleChange('vehiclePlate', e.target.value)}
                        isDisabled={!formData.viaverdeEnabled}
                        fontFamily="mono"
                        fontSize="sm"
                      />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {t('drivers.integrations.viaverde.description', 'Matrícula utilizada para associar transações de portagens.')}
                      </Text>
                    </FormControl>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Tab Veículo */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('drivers.vehicle.plate.label', 'Matrícula')}</FormLabel>
                    <Input
                      placeholder={t('drivers.vehicle.plate.placeholder', 'Ex: AB-12-CD')}
                      value={formData.vehiclePlate}
                      onChange={(e) => handleChange('vehiclePlate', e.target.value)}
                      fontFamily="mono"
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {t('drivers.vehicle.plate.description', 'Utilizado para associações com ViaVerde e controle de frota.')}
                    </Text>
                  </FormControl>

                  <HStack spacing={4} w="full">
                    <FormControl flex="1">
                      <FormLabel>{t('drivers.vehicle.make.label', 'Marca')}</FormLabel>
                      <Input
                        placeholder={t('drivers.vehicle.make.placeholder', 'Ex: Toyota')}
                        value={formData.vehicleMake}
                        onChange={(e) => handleChange('vehicleMake', e.target.value)}
                      />
                    </FormControl>

                    <FormControl flex="1">
                      <FormLabel>{t('drivers.vehicle.model.label', 'Modelo')}</FormLabel>
                      <Input
                        placeholder={t('drivers.vehicle.model.placeholder', 'Ex: Prius')}
                        value={formData.vehicleModel}
                        onChange={(e) => handleChange('vehicleModel', e.target.value)}
                      />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel>{t('drivers.vehicle.year.label', 'Ano')}</FormLabel>
                    <Input
                      type="number"
                      placeholder={t('drivers.vehicle.year.placeholder', 'Ex: 2020')}
                      value={formData.vehicleYear}
                      onChange={(e) => handleChange('vehicleYear', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </TabPanel>

              {/* Tab Bancário */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('drivers.bank.iban.label', 'IBAN')}</FormLabel>
                    <Input
                      placeholder={t('drivers.bank.iban.placeholder', 'PT50 0000 0000 0000 0000 0000 0')}
                      value={formData.iban}
                      onChange={(e) => handleChange('iban', e.target.value)}
                      fontFamily="mono"
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {t('drivers.bank.iban.description', 'Utilizado para pagamentos e repasses semanais.')}
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>{t('drivers.bank.accountHolder.label', 'Titular da conta')}</FormLabel>
                    <Input
                      placeholder={t('drivers.bank.accountHolder.placeholder', 'Nome completo do titular')}
                      value={formData.accountHolder}
                      onChange={(e) => handleChange('accountHolder', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </TabPanel>

              {/* Tab Senha (apenas para edição) */}
              {isEditMode && (
                <TabPanel>
                  <VStack spacing={4}>
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Alterar senha</AlertTitle>
                        <AlertDescription>
                          Deixe em branco para manter a senha atual. A nova senha será enviada por email ao motorista.
                        </AlertDescription>
                      </Box>
                    </Alert>

                    <FormControl>
                      <FormLabel>Nova senha</FormLabel>
                      <HStack>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Deixe em branco para manter a senha atual"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <Icon as={showPassword ? FiEyeOff : FiEye} />
                        </Button>
                      </HStack>
                    </FormControl>
                  </VStack>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full" justify="flex-end">
            <Button variant="ghost" onClick={onClose}>
              {tc('actions.cancel', 'Cancelar')}
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
            >
              {isEditMode 
                ? tc('actions.save', 'Guardar')
                : tc('actions.create', 'Criar')
              }
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
