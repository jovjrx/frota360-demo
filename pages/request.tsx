import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  SimpleGrid,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { loadTranslations } from '@/lib/translations';
import { PageProps } from '@/interface/Global';
import { FORMS } from '@/translations';

export default function RequestPage({ tPage, tCommon, locale }: PageProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [driverType, setDriverType] = useState<'affiliate' | 'renter'>('affiliate');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    birthDate: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    additionalInfo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        birthDate: formData.birthDate || undefined,
        driverType,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        vehicle: driverType === 'affiliate' ? {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
          plate: formData.vehiclePlate,
        } : undefined,
        additionalInfo: formData.additionalInfo || undefined,
        locale,
      };

      const response = await fetch('/api/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: tPage(FORMS.REQUEST.SUCCESS_MESSAGE),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Redirecionar para página de sucesso ou home
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        throw new Error(data.error || data.message);
      }
    } catch (error: any) {
      toast({
        title: tPage(FORMS.REQUEST.ERROR_MESSAGE),
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
    <Box py={20} bg="gray.50" minH="100vh">
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading size="xl" mb={4}>
              {tPage(FORMS.REQUEST.TITLE)}
            </Heading>
            <Text fontSize="lg" color="gray.600">
              {tPage(FORMS.REQUEST.SUBTITLE)}
            </Text>
          </Box>

          <Box bg="white" p={8} borderRadius="lg" shadow="md">
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                {/* Tipo de Motorista */}
                <FormControl isRequired>
                  <FormLabel>{tPage(FORMS.REQUEST.TYPE_LABEL)}</FormLabel>
                  <RadioGroup value={driverType} onChange={(value: any) => setDriverType(value)}>
                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                      <Radio value="affiliate" colorScheme="green">
                        <Box>
                          <Text fontWeight="bold">{tPage(FORMS.REQUEST.TYPE_AFFILIATE)}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {tPage(FORMS.REQUEST.TYPE_AFFILIATE_DESC)}
                          </Text>
                        </Box>
                      </Radio>
                      <Radio value="renter" colorScheme="blue">
                        <Box>
                          <Text fontWeight="bold">{tPage(FORMS.REQUEST.TYPE_RENTER)}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {tPage(FORMS.REQUEST.TYPE_RENTER_DESC)}
                          </Text>
                        </Box>
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {/* Dados Pessoais */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>{tCommon('user.firstName')}</FormLabel>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder={tCommon('user.firstName')}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>{tCommon('user.lastName')}</FormLabel>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder={tCommon('user.lastName')}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>{tCommon('user.email')}</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={tCommon('user.email')}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>{tCommon('user.phone')}</FormLabel>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={tCommon('user.phone')}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>{tCommon('user.city')}</FormLabel>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder={tCommon('user.city')}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>{tCommon('user.birthDate')}</FormLabel>
                    <Input
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Carta de Condução */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>{tCommon('user.licenseNumber')}</FormLabel>
                    <Input
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder={tCommon('user.licenseNumber')}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>{tCommon('user.licenseExpiry')}</FormLabel>
                    <Input
                      name="licenseExpiry"
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={handleChange}
                    />
                  </FormControl>
                </SimpleGrid>

                {/* Informações do Veículo (apenas para afiliados) */}
                {driverType === 'affiliate' && (
                  <>
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      {tPage(FORMS.REQUEST.VEHICLE_INFO)}
                    </Alert>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>{tPage(FORMS.REQUEST.VEHICLE_MAKE)}</FormLabel>
                        <Input
                          name="vehicleMake"
                          value={formData.vehicleMake}
                          onChange={handleChange}
                          placeholder={tPage(FORMS.REQUEST.VEHICLE_MAKE)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>{tPage(FORMS.REQUEST.VEHICLE_MODEL)}</FormLabel>
                        <Input
                          name="vehicleModel"
                          value={formData.vehicleModel}
                          onChange={handleChange}
                          placeholder={tPage(FORMS.REQUEST.VEHICLE_MODEL)}
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>{tPage(FORMS.REQUEST.VEHICLE_YEAR)}</FormLabel>
                        <Input
                          name="vehicleYear"
                          type="number"
                          value={formData.vehicleYear}
                          onChange={handleChange}
                          placeholder={tPage(FORMS.REQUEST.VEHICLE_YEAR)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>{tPage(FORMS.REQUEST.VEHICLE_PLATE)}</FormLabel>
                        <Input
                          name="vehiclePlate"
                          value={formData.vehiclePlate}
                          onChange={handleChange}
                          placeholder={tPage(FORMS.REQUEST.VEHICLE_PLATE)}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </>
                )}

                {/* Informações Adicionais */}
                <FormControl>
                  <FormLabel>{tPage(FORMS.REQUEST.ADDITIONAL_INFO)}</FormLabel>
                  <Textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    placeholder={tPage(FORMS.REQUEST.ADDITIONAL_INFO)}
                    rows={4}
                  />
                </FormControl>

                {/* Botão de Envio */}
                <Button
                  type="submit"
                  colorScheme="green"
                  size="lg"
                  isLoading={loading}
                  loadingText={tCommon('actions.loading')}
                >
                  {tPage(FORMS.REQUEST.SUBMIT_BUTTON)}
                </Button>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const locale = Array.isArray(context.req.headers['x-locale'])
      ? context.req.headers['x-locale'][0]
      : context.req.headers['x-locale'] || 'pt';

    const translations = await loadTranslations(locale, ['common', 'request']);
    const { common, request: page } = translations;

    return {
      props: {
        translations: { common, page },
        locale,
      },
    };
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {
      props: {
        translations: { common: {}, page: {} },
        locale: 'pt',
      },
    };
  }
};
