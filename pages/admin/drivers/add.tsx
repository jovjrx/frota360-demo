/**
 * Adicionar Motorista
 * Usa withAdminSSR para autenticação e traduções via SSR
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Heading,
  VStack,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useToast,
  SimpleGrid,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  HStack,
} from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';

interface AddDriverProps extends AdminPageProps {}

export default function AddDriver({ user, locale, tCommon, tPage }: AddDriverProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    type: 'affiliate' as 'affiliate' | 'renter',
    status: 'active',
    // Campos adicionais para a API
    firstName: '',
    lastName: '',
    birthDate: '',
    city: '',
    iban: '',
    accountHolder: '',
    vehiclePlate: '',
    vehicleModel: '',
    rentalFee: 0,
    uberUuid: '',
    uberEnabled: false,
    boltEmail: '',
    boltEnabled: false,
    myprioCard: '',
    myprioEnabled: false,
    viaverdeEnabled: false,
  });

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Preencher firstName e lastName a partir de fullName
      ...(field === 'fullName' && {
        firstName: value.split(' ')[0] || '',
        lastName: value.split(' ').slice(1).join(' ') || '',
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTemporaryPassword(null);

    try {
      const payload = {
        ...formData,
        // Garantir que fullName é passado para a API
        fullName: formData.fullName,
        // Ajustar campos para a API
        uberEnabled: !!formData.uberUuid, // Habilita se UUID for preenchido
        boltEnabled: !!formData.boltEmail, // Habilita se email for preenchido
        myprioEnabled: !!formData.myprioCard, // Habilita se cartão for preenchido
        viaverdeEnabled: !!formData.vehiclePlate, // Habilita se placa for preenchida
      };

      const response = await fetch('/api/admin/drivers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar motorista');
      }

      const result = await response.json();
      setTemporaryPassword(result.temporaryPassword);

      toast({
        title: t('drivers.add.toasts.success.title', 'Motorista criado com sucesso!'),
        description: t('drivers.add.toasts.success.description', 'Uma senha temporária foi gerada para o motorista.'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // router.push('/admin/drivers'); // Não redirecionar imediatamente para mostrar a senha
    } catch (error: any) {
      toast({
        title: t('drivers.add.toasts.error.title', 'Erro ao criar motorista'),
        description: error.message || t('drivers.add.toasts.error.description', 'Não foi possível criar o motorista.'),
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title={t('drivers.add.title', 'Adicionar motorista')}
      subtitle={t('drivers.add.subtitle', 'Cadastre um novo motorista e configure suas integrações.')}
      breadcrumbs={[
        { label: t('drivers.title', 'Controle de Motoristas'), href: '/admin/drivers' },
        { label: t('drivers.add.title', 'Adicionar motorista') }
      ]}
    >
      <Card maxW="800px">
        <CardBody>
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
                <Button size="sm" mt={2} onClick={() => navigator.clipboard.writeText(temporaryPassword)}>
                  {t('drivers.add.actions.copyPassword', 'Copiar senha')}
                </Button>
                <Button size="sm" mt={2} ml={2} onClick={() => router.push('/admin/drivers')}>
                  {t('drivers.add.actions.goToList', 'Ver lista de motoristas')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>{t('drivers.form.fullName.label', 'Nome completo')}</FormLabel>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder={t('drivers.form.fullName.placeholder', 'Nome completo do motorista')}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>{t('drivers.form.email.label', 'Email')}</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder={t('drivers.form.email.placeholder', 'email@exemplo.com')}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('drivers.form.phone.label', 'Telefone')}</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder={t('drivers.form.phone.placeholder', '+351 913 415 670')}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>{t('drivers.form.type.label', 'Tipo')}</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <option value="affiliate">{t('drivers.type.affiliate', 'Afiliado')}</option>
                    <option value="renter">{t('drivers.type.renter', 'Locatário')}</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('drivers.form.status.label', 'Status')}</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="active">{tc('status.active', 'Ativo')}</option>
                    <option value="inactive">{tc('status.inactive', 'Inativo')}</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              {/* Campos adicionais para a API create.ts */}
              <Heading size="sm" mt={6} mb={2}>{t('drivers.add.sections.additionalDetails', 'Detalhes adicionais')}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>{t('drivers.form.birthDate.label', 'Data de nascimento')}</FormLabel>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{t('drivers.form.city.label', 'Cidade')}</FormLabel>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder={t('drivers.form.city.placeholder', 'Lisboa')}
                  />
                </FormControl>
              </SimpleGrid>

              <Heading size="sm" mt={6} mb={2}>{t('drivers.add.sections.banking', 'Dados bancários')}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>{t('drivers.bank.iban.label', 'IBAN')}</FormLabel>
                  <Input
                    value={formData.iban}
                    onChange={(e) => handleChange('iban', e.target.value)}
                    placeholder={t('drivers.bank.iban.placeholder', 'PT50 0000 0000 0000 0000 0000 0')}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{t('drivers.bank.accountHolder.label', 'Titular da conta')}</FormLabel>
                  <Input
                    value={formData.accountHolder}
                    onChange={(e) => handleChange('accountHolder', e.target.value)}
                    placeholder={t('drivers.bank.accountHolder.placeholder', 'Nome completo do titular')}
                  />
                </FormControl>
              </SimpleGrid>

              <Heading size="sm" mt={6} mb={2}>{t('drivers.add.sections.integrations', 'Integrações')}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>{t('drivers.integrations.uber.keyLabel', 'UUID do motorista')}</FormLabel>
                  <Input
                    value={formData.uberUuid}
                    onChange={(e) => handleChange('uberUuid', e.target.value)}
                    placeholder={t('drivers.integrations.uber.placeholder', 'Ex: 12345678-1234-1234-1234-123456789012')}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{t('drivers.integrations.bolt.keyLabel', 'Email associado')}</FormLabel>
                  <Input
                    type="email"
                    value={formData.boltEmail}
                    onChange={(e) => handleChange('boltEmail', e.target.value)}
                    placeholder={t('drivers.integrations.bolt.placeholder', 'email@exemplo.com')}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{t('drivers.integrations.myprio.keyLabel', 'Número do cartão')}</FormLabel>
                  <Input
                    value={formData.myprioCard}
                    onChange={(e) => handleChange('myprioCard', e.target.value)}
                    placeholder={t('drivers.integrations.myprio.placeholder', 'Ex: 1234567890123456')}
                  />
                </FormControl>
                {/* ViaVerde key é a placa do veículo, então será preenchido abaixo */}
              </SimpleGrid>

              {formData.type === 'renter' && (
                <Box>
                  <Heading size="sm" mt={6} mb={2}>{t('drivers.add.sections.vehicle', 'Dados do veículo')}</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>{t('drivers.vehicle.plate.label', 'Matrícula')}</FormLabel>
                      <Input
                        value={formData.vehiclePlate}
                        onChange={(e) => handleChange('vehiclePlate', e.target.value)}
                        placeholder={t('drivers.vehicle.plate.placeholder', 'Ex: AB-12-CD')}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>{t('drivers.vehicle.model.label', 'Modelo')}</FormLabel>
                      <Input
                        value={formData.vehicleModel}
                        onChange={(e) => handleChange('vehicleModel', e.target.value)}
                        placeholder={t('drivers.vehicle.model.placeholder', 'Ex: Prius')}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>{t('drivers.form.rentalFee.label', 'Valor de aluguel (€)')}</FormLabel>
                      <Input
                        type="number"
                        value={formData.rentalFee}
                        onChange={(e) => handleChange('rentalFee', parseFloat(e.target.value) || 0)}
                        placeholder={t('drivers.form.rentalFee.placeholder', '0.00')}
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>
              )}

              <Button
                type="submit"
                colorScheme="green"
                isLoading={loading}
                w="full"
              >
                {t('drivers.add.submit', 'Criar motorista')}
              </Button>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </AdminLayout>
  );
}

// SSR com autenticação e traduções
export const getServerSideProps = withAdminSSR();

