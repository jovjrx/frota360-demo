import { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Switch, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  useToast, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import { FiUser, FiBell, FiShield, FiCreditCard, FiSettings } from 'react-icons/fi';
import { withAuth } from '../../lib/auth/withAuth';
import LoggedInLayout from '../../components/LoggedInLayout';
import { useAuth } from '../../lib/auth';
import { dashboardAPI } from '../../lib/api/dashboard';

interface DriverSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    bio: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    tripAlerts: boolean;
    paymentAlerts: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    profileVisible: boolean;
    shareLocation: boolean;
    shareEarnings: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    theme: string;
  };
}

function DriverSettings() {
  const { user } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState<DriverSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      bio: ''
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      tripAlerts: true,
      paymentAlerts: true,
      systemUpdates: false
    },
    privacy: {
      profileVisible: true,
      shareLocation: false,
      shareEarnings: false
    },
    preferences: {
      language: 'pt',
      timezone: 'Europe/Lisbon',
      currency: 'EUR',
      theme: 'light'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { isOpen: isPasswordOpen, onOpen: onPasswordOpen, onClose: onPasswordClose } = useDisclosure();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Simulando carregamento das configurações
      // Na implementação real, isso viria da API
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          firstName: user?.displayName?.split(' ')[0] || '',
          lastName: user?.displayName?.split(' ')[1] || '',
          email: user?.email || '',
          phone: user?.phoneNumber || ''
        }
      }));
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await dashboardAPI.updateProfile(user?.uid || '', settings.profile);
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar perfil',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      // Implementar salvamento das notificações
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      
      toast({
        title: 'Sucesso',
        description: 'Configurações de notificação atualizadas',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar notificações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      // Implementar salvamento da privacidade
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulação
      
      toast({
        title: 'Sucesso',
        description: 'Configurações de privacidade atualizadas',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar privacidade',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await dashboardAPI.changePassword(user?.uid || '', passwordForm.newPassword);
      
      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      onPasswordClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao alterar senha',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <LoggedInLayout>
        <Text>Carregando configurações...</Text>
      </LoggedInLayout>
    );
  }

  return (
    <LoggedInLayout>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Configurações
          </Text>
          <Text color="gray.600">
            Gerencie suas preferências e configurações da conta
          </Text>
        </Box>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>
              <HStack>
                <FiUser />
                <Text>Perfil</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <FiBell />
                <Text>Notificações</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <FiShield />
                <Text>Privacidade</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <FiSettings />
                <Text>Preferências</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Perfil */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Informações do Perfil</AlertTitle>
                    <AlertDescription>
                      Mantenha suas informações atualizadas para melhor experiência na plataforma.
                    </AlertDescription>
                  </Box>
                </Alert>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Nome</FormLabel>
                    <Input
                      value={settings.profile.firstName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, firstName: e.target.value }
                      })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Sobrenome</FormLabel>
                    <Input
                      value={settings.profile.lastName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, lastName: e.target.value }
                      })}
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value }
                      })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Telefone</FormLabel>
                    <Input
                      value={settings.profile.phone}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, phone: e.target.value }
                      })}
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Endereço</FormLabel>
                  <Input
                    value={settings.profile.address}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, address: e.target.value }
                    })}
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Cidade</FormLabel>
                    <Input
                      value={settings.profile.city}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, city: e.target.value }
                      })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Código Postal</FormLabel>
                    <Input
                      value={settings.profile.postalCode}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, postalCode: e.target.value }
                      })}
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Biografia</FormLabel>
                  <Textarea
                    value={settings.profile.bio}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, bio: e.target.value }
                    })}
                    placeholder="Conte um pouco sobre você..."
                  />
                </FormControl>

                <Divider />

                <Box>
                  <Text fontWeight="semibold" mb={3}>Segurança</Text>
                  <Button
                    leftIcon={<FiShield />}
                    onClick={onPasswordOpen}
                  >
                    Alterar Senha
                  </Button>
                </Box>

                <HStack justify="flex-end">
                  <Button
                    colorScheme="blue"
                    onClick={saveProfile}
                    isLoading={saving}
                  >
                    Salvar Alterações
                  </Button>
                </HStack>
              </VStack>
            </TabPanel>

            {/* Notificações */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Configurações de Notificação</AlertTitle>
                    <AlertDescription>
                      Escolha como deseja receber notificações importantes.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Box>
                  <Text fontWeight="semibold" mb={3}>Canais de Notificação</Text>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text>Notificações por Email</Text>
                      <Switch
                        isChecked={settings.notifications.emailNotifications}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { 
                            ...settings.notifications, 
                            emailNotifications: e.target.checked 
                          }
                        })}
                      />
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Notificações por SMS</Text>
                      <Switch
                        isChecked={settings.notifications.smsNotifications}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { 
                            ...settings.notifications, 
                            smsNotifications: e.target.checked 
                          }
                        })}
                      />
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Notificações Push</Text>
                      <Switch
                        isChecked={settings.notifications.pushNotifications}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { 
                            ...settings.notifications, 
                            pushNotifications: e.target.checked 
                          }
                        })}
                      />
                    </HStack>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="semibold" mb={3}>Tipos de Notificação</Text>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text>Alertas de Viagem</Text>
                      <Switch
                        isChecked={settings.notifications.tripAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { 
                            ...settings.notifications, 
                            tripAlerts: e.target.checked 
                          }
                        })}
                      />
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Alertas de Pagamento</Text>
                      <Switch
                        isChecked={settings.notifications.paymentAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { 
                            ...settings.notifications, 
                            paymentAlerts: e.target.checked 
                          }
                        })}
                      />
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Atualizações do Sistema</Text>
                      <Switch
                        isChecked={settings.notifications.systemUpdates}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { 
                            ...settings.notifications, 
                            systemUpdates: e.target.checked 
                          }
                        })}
                      />
                    </HStack>
                  </VStack>
                </Box>

                <HStack justify="flex-end">
                  <Button
                    colorScheme="blue"
                    onClick={saveNotifications}
                    isLoading={saving}
                  >
                    Salvar Alterações
                  </Button>
                </HStack>
              </VStack>
            </TabPanel>

            {/* Privacidade */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Configurações de Privacidade</AlertTitle>
                    <AlertDescription>
                      Controle quais informações são visíveis para outros usuários.
                    </AlertDescription>
                  </Box>
                </Alert>

                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="medium">Perfil Visível</Text>
                      <Text fontSize="sm" color="gray.600">
                        Permite que outros motoristas vejam seu perfil básico
                      </Text>
                    </Box>
                    <Switch
                      isChecked={settings.privacy.profileVisible}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { 
                          ...settings.privacy, 
                          profileVisible: e.target.checked 
                        }
                      })}
                    />
                  </HStack>

                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="medium">Compartilhar Localização</Text>
                      <Text fontSize="sm" color="gray.600">
                        Permite compartilhamento de localização durante viagens
                      </Text>
                    </Box>
                    <Switch
                      isChecked={settings.privacy.shareLocation}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { 
                          ...settings.privacy, 
                          shareLocation: e.target.checked 
                        }
                      })}
                    />
                  </HStack>

                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="medium">Compartilhar Ganhos</Text>
                      <Text fontSize="sm" color="gray.600">
                        Permite que informações de ganhos sejam visíveis em relatórios
                      </Text>
                    </Box>
                    <Switch
                      isChecked={settings.privacy.shareEarnings}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { 
                          ...settings.privacy, 
                          shareEarnings: e.target.checked 
                        }
                      })}
                    />
                  </HStack>
                </VStack>

                <HStack justify="flex-end">
                  <Button
                    colorScheme="blue"
                    onClick={savePrivacy}
                    isLoading={saving}
                  >
                    Salvar Alterações
                  </Button>
                </HStack>
              </VStack>
            </TabPanel>

            {/* Preferências */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Preferências do Sistema</AlertTitle>
                    <AlertDescription>
                      Personalize sua experiência na plataforma.
                    </AlertDescription>
                  </Box>
                </Alert>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Idioma</FormLabel>
                    <select
                      value={settings.preferences.language}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { 
                          ...settings.preferences, 
                          language: e.target.value 
                        }
                      })}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #E2E8F0',
                        width: '100%'
                      }}
                    >
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                    </select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Fuso Horário</FormLabel>
                    <select
                      value={settings.preferences.timezone}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { 
                          ...settings.preferences, 
                          timezone: e.target.value 
                        }
                      })}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #E2E8F0',
                        width: '100%'
                      }}
                    >
                      <option value="Europe/Lisbon">Lisboa (UTC+0)</option>
                      <option value="Europe/Madrid">Madrid (UTC+1)</option>
                      <option value="Europe/London">Londres (UTC+0)</option>
                    </select>
                  </FormControl>
                </HStack>

                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>Moeda</FormLabel>
                    <select
                      value={settings.preferences.currency}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { 
                          ...settings.preferences, 
                          currency: e.target.value 
                        }
                      })}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #E2E8F0',
                        width: '100%'
                      }}
                    >
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dólar ($)</option>
                      <option value="GBP">Libra (£)</option>
                    </select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Tema</FormLabel>
                    <select
                      value={settings.preferences.theme}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { 
                          ...settings.preferences, 
                          theme: e.target.value 
                        }
                      })}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #E2E8F0',
                        width: '100%'
                      }}
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </FormControl>
                </HStack>

                <HStack justify="flex-end">
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      toast({
                        title: 'Sucesso',
                        description: 'Preferências atualizadas',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                    isLoading={saving}
                  >
                    Salvar Alterações
                  </Button>
                </HStack>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Password Change Modal */}
      <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Alterar Senha</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Senha Atual</FormLabel>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value
                  })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Nova Senha</FormLabel>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Confirmar Nova Senha</FormLabel>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPasswordClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={changePassword}>
              Alterar Senha
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LoggedInLayout>
  );
}

export default withAuth(DriverSettings);
