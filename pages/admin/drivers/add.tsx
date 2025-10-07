/**
 * Adicionar Motorista
 * Usa withAdminSSR para autenticação e traduções via SSR
 */

import { useState } from 'react';
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
} from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getTranslation } from '@/lib/translations';

interface AddDriverProps extends AdminPageProps {}

export default function AddDriver({ user, translations, locale }: AddDriverProps) {
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

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

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
        title: tAdmin('driver_created_success_title'),
        description: tAdmin('driver_created_success_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // router.push('/admin/drivers'); // Não redirecionar imediatamente para mostrar a senha
    } catch (error: any) {
      toast({
        title: tAdmin('error_creating_driver_title'),
        description: error.message || tAdmin('error_creating_driver_description'),
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
      title={tAdmin('add_driver_title')}
      subtitle={tAdmin('add_driver_subtitle')}
      breadcrumbs={[
        { label: tAdmin('drivers_management_title'), href: '/admin/drivers' },
        { label: tAdmin('add_driver_title') }
      ]}
    >
      <Card maxW="800px">
        <CardBody>
          {temporaryPassword && (
            <Alert status="success" mb={4} flexDirection="column" alignItems="flex-start">
              <HStack w="full" justifyContent="space-between">
                <AlertIcon />
                <AlertTitle mr={0}>{tAdmin('driver_created_success_title')}</AlertTitle>
                <CloseButton position="absolute" right="8px" top="8px" onClick={() => setTemporaryPassword(null)} />
              </HStack>
              <AlertDescription mt={2}>
                <Text>{tAdmin('driver_password_generated')}: <Text as="b" fontFamily="mono">{temporaryPassword}</Text></Text>
                <Text>{tAdmin('driver_password_email_sent')}</Text>
                <Text mt={2}>{tAdmin('driver_password_copy_warning')}</Text>
                <Button size="sm" mt={2} onClick={() => navigator.clipboard.writeText(temporaryPassword)}>
                  {tAdmin('copy_password')}
                </Button>
                <Button size="sm" mt={2} ml={2} onClick={() => router.push('/admin/drivers')}>
                  {tAdmin('go_to_drivers_list')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>{t('full_name')}</FormLabel>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder={tAdmin('full_name_placeholder')}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>{t('email')}</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder={tAdmin('email_placeholder')}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('phone')}</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder={tAdmin('phone_placeholder')}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>{t('type')}</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <option value="affiliate">{t('type_affiliate')}</option>
                    <option value="renter">{t('type_renter')}</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('status')}</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="active">{t('status_active')}</option>
                    <option value="inactive">{t('status_inactive')}</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              {/* Campos adicionais para a API create.ts */}
              <Heading size="sm" mt={6} mb={2}>{tAdmin('additional_driver_details')}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>{t('birth_date')}</FormLabel>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{t('city')}</FormLabel>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder={tAdmin('city_placeholder')}
                  />
                </FormControl>
              </SimpleGrid>

              <Heading size="sm" mt={6} mb={2}>{tAdmin('banking_details')}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>IBAN</FormLabel>
                  <Input
                    value={formData.iban}
                    onChange={(e) => handleChange('iban', e.target.value)}
                    placeholder={tAdmin('iban_placeholder')}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>{t('account_holder')}</FormLabel>
                  <Input
                    value={formData.accountHolder}
                    onChange={(e) => handleChange('accountHolder', e.target.value)}
                    placeholder={tAdmin('account_holder_placeholder')}
                  />
                </FormControl>
              </SimpleGrid>

              <Heading size="sm" mt={6} mb={2}>{tAdmin('integrations_details')}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Uber UUID</FormLabel>
                  <Input
                    value={formData.uberUuid}
                    onChange={(e) => handleChange('uberUuid', e.target.value)}
                    placeholder={tAdmin('uber_uuid_placeholder')}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Bolt Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.boltEmail}
                    onChange={(e) => handleChange('boltEmail', e.target.value)}
                    placeholder={tAdmin('bolt_email_placeholder')}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>MyPrio Card</FormLabel>
                  <Input
                    value={formData.myprioCard}
                    onChange={(e) => handleChange('myprioCard', e.target.value)}
                    placeholder={tAdmin('myprio_card_placeholder')}
                  />
                </FormControl>
                {/* ViaVerde key é a placa do veículo, então será preenchido abaixo */}
              </SimpleGrid>

              {formData.type === 'renter' && (
                <Box>
                  <Heading size="sm" mt={6} mb={2}>{tAdmin('vehicle_details')}</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>{t('vehicle_plate')}</FormLabel>
                      <Input
                        value={formData.vehiclePlate}
                        onChange={(e) => handleChange('vehiclePlate', e.target.value)}
                        placeholder={tAdmin('vehicle_plate_placeholder')}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>{t('vehicle_model')}</FormLabel>
                      <Input
                        value={formData.vehicleModel}
                        onChange={(e) => handleChange('vehicleModel', e.target.value)}
                        placeholder={tAdmin('vehicle_model_placeholder')}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>{t('rental_fee')}</FormLabel>
                      <Input
                        type="number"
                        value={formData.rentalFee}
                        onChange={(e) => handleChange('rentalFee', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
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
                {tAdmin('create_driver_button')}
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

