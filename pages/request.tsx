import { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import {
  Box,
  Container,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestSchema, RequestData } from '@/schemas/request';
import { loadTranslations, getTranslation } from '@/lib/translations';
import StandardLayout from '@/components/layouts/StandardLayout';
import { COMMON, FORMS } from '@/translations';

interface RequestPageProps {
  translations: any;
}

export default function RequestPage({ translations }: RequestPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables);
  };

  const tRequest = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.request, key, variables);
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<RequestData>({
    resolver: zodResolver(requestSchema),
  });

  const driverType = watch('driverType');

  const onSubmit = async (data: RequestData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setShowSuccess(true);
        reset();
        toast({
          title: tRequest(FORMS.REQUEST.SUCCESS_TITLE),
          description: tRequest(FORMS.REQUEST.SUCCESS_MESSAGE),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error || 'Erro ao enviar candidatura');
      }
    } catch (error: any) {
      toast({
        title: t(COMMON.MESSAGES.ERROR),
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <StandardLayout 
        title="Candidatura de Motorista"
        subtitle="Junte-se à Conduz PT"
        user={{
          name: "Visitante",
          role: "driver"
        }}
      >
        <Container maxW="container.md" py={8}>
          <Card>
            <CardBody textAlign="center" py={12}>
              <Box mb={6}>
                <Box
                  w={16}
                  h={16}
                  bg="green.100"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={4}
                >
                  <Text fontSize="2xl" color="green.600">
                    ✅
                  </Text>
                </Box>
                <Heading size="lg" mb={2} color="green.600">
                  {tRequest(FORMS.REQUEST.SUCCESS_TITLE)}
                </Heading>
                <Text color="gray.600" mb={6}>
                  {tRequest(FORMS.REQUEST.SUCCESS_MESSAGE)}
                </Text>
              </Box>
              <Button
                colorScheme="blue"
                onClick={() => router.push('/')}
                leftIcon={<ArrowBackIcon />}
              >
                {tRequest(FORMS.REQUEST.BACK_TO_HOME)}
              </Button>
            </CardBody>
          </Card>
        </Container>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout 
      title="Candidatura de Motorista"
      subtitle="Junte-se à Conduz PT"
      user={{
        name: "Visitante",
        role: "driver"
      }}
    >
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" mb={2}>
              {tRequest(FORMS.REQUEST.TITLE)}
            </Heading>
            <Text color="gray.600">
              {tRequest(FORMS.REQUEST.SUBTITLE)}
            </Text>
          </Box>

          <Card>
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={6} align="stretch">
                  {/* Informações Pessoais */}
                  <Box>
                    <Heading size="md" mb={4}>
                      Informações Pessoais
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={4}>
                        <FormControl isInvalid={!!errors.firstName}>
                          <FormLabel>{tRequest(FORMS.REQUEST.FIRST_NAME)}</FormLabel>
                          <Input
                            {...register('firstName')}
                            placeholder="João"
                          />
                          {errors.firstName && (
                            <Text color="red.500" fontSize="sm" mt={1}>
                              {errors.firstName.message}
                            </Text>
                          )}
                        </FormControl>
                        <FormControl isInvalid={!!errors.lastName}>
                          <FormLabel>{tRequest(FORMS.REQUEST.LAST_NAME)}</FormLabel>
                          <Input
                            {...register('lastName')}
                            placeholder="Silva"
                          />
                          {errors.lastName && (
                            <Text color="red.500" fontSize="sm" mt={1}>
                              {errors.lastName.message}
                            </Text>
                          )}
                        </FormControl>
                      </HStack>

                      <FormControl isInvalid={!!errors.email}>
                        <FormLabel>{tRequest(FORMS.REQUEST.EMAIL)}</FormLabel>
                        <Input
                          type="email"
                          {...register('email')}
                          placeholder="joao.silva@email.com"
                        />
                        {errors.email && (
                          <Text color="red.500" fontSize="sm" mt={1}>
                            {errors.email.message}
                          </Text>
                        )}
                      </FormControl>

                      <HStack spacing={4}>
                        <FormControl isInvalid={!!errors.phone}>
                          <FormLabel>{tRequest(FORMS.REQUEST.PHONE)}</FormLabel>
                          <Input
                            {...register('phone')}
                            placeholder="+351 912 345 678"
                          />
                          {errors.phone && (
                            <Text color="red.500" fontSize="sm" mt={1}>
                              {errors.phone.message}
                            </Text>
                          )}
                        </FormControl>
                        <FormControl isInvalid={!!errors.city}>
                          <FormLabel>{tRequest(FORMS.REQUEST.CITY)}</FormLabel>
                          <Input
                            {...register('city')}
                            placeholder="Lisboa"
                          />
                          {errors.city && (
                            <Text color="red.500" fontSize="sm" mt={1}>
                              {errors.city.message}
                            </Text>
                          )}
                        </FormControl>
                      </HStack>
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Tipo de Motorista */}
                  <Box>
                    <Heading size="md" mb={4}>
                      Tipo de Motorista
                    </Heading>
                    <FormControl isInvalid={!!errors.driverType}>
                      <Select
                        {...register('driverType')}
                        placeholder="Selecione o tipo de motorista"
                      >
                        <option value="affiliate">
                          {tRequest(FORMS.REQUEST.DRIVER_TYPE_AFFILIATE)}
                        </option>
                        <option value="renter">
                          {tRequest(FORMS.REQUEST.DRIVER_TYPE_RENTER)}
                        </option>
                      </Select>
                      {errors.driverType && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {errors.driverType.message}
                        </Text>
                      )}
                    </FormControl>
                  </Box>

                  {/* Informações do Veículo (apenas para afiliados) */}
                  {driverType === 'affiliate' && (
                    <>
                      <Divider />
                      <Box>
                        <Heading size="md" mb={4}>
                          {tRequest(FORMS.REQUEST.VEHICLE_INFO)}
                        </Heading>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={4}>
                            <FormControl isInvalid={!!errors.vehicle?.make}>
                              <FormLabel>{tRequest(FORMS.REQUEST.VEHICLE_MAKE)}</FormLabel>
                              <Input
                                {...register('vehicle.make')}
                                placeholder="Toyota"
                              />
                              {errors.vehicle?.make && (
                                <Text color="red.500" fontSize="sm" mt={1}>
                                  {errors.vehicle.make.message}
                                </Text>
                              )}
                            </FormControl>
                            <FormControl isInvalid={!!errors.vehicle?.model}>
                              <FormLabel>{tRequest(FORMS.REQUEST.VEHICLE_MODEL)}</FormLabel>
                              <Input
                                {...register('vehicle.model')}
                                placeholder="Corolla"
                              />
                              {errors.vehicle?.model && (
                                <Text color="red.500" fontSize="sm" mt={1}>
                                  {errors.vehicle.model.message}
                                </Text>
                              )}
                            </FormControl>
                          </HStack>

                          <HStack spacing={4}>
                            <FormControl isInvalid={!!errors.vehicle?.year}>
                              <FormLabel>{tRequest(FORMS.REQUEST.VEHICLE_YEAR)}</FormLabel>
                              <Input
                                type="number"
                                {...register('vehicle.year', { valueAsNumber: true })}
                                placeholder="2020"
                              />
                              {errors.vehicle?.year && (
                                <Text color="red.500" fontSize="sm" mt={1}>
                                  {errors.vehicle.year.message}
                                </Text>
                              )}
                            </FormControl>
                            <FormControl isInvalid={!!errors.vehicle?.plate}>
                              <FormLabel>{tRequest(FORMS.REQUEST.VEHICLE_PLATE)}</FormLabel>
                              <Input
                                {...register('vehicle.plate')}
                                placeholder="12-AB-34"
                              />
                              {errors.vehicle?.plate && (
                                <Text color="red.500" fontSize="sm" mt={1}>
                                  {errors.vehicle.plate.message}
                                </Text>
                              )}
                            </FormControl>
                          </HStack>
                        </VStack>
                      </Box>
                    </>
                  )}

                  {/* Botão de Envio */}
                  <Box pt={4}>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="lg"
                      width="full"
                      isLoading={isSubmitting}
                      loadingText={t(COMMON.ACTIONS.LOADING)}
                    >
                      {tRequest(FORMS.REQUEST.SUBMIT)}
                    </Button>
                  </Box>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </StandardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const translations = await loadTranslations(locale || 'pt', ['common', 'request']);
  
  return {
    props: {
      translations,
    },
  };
};