import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/withDriver';
import { adminDb } from '@/lib/firebaseAdmin';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  Progress,
  Badge,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Divider,
  List,
  ListItem,
  ListIcon,
  useToast,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiUpload,
  FiCreditCard,
  FiFileText,
  FiArrowRight,
  FiClock,
  FiAlertCircle,
  FiStar,
} from 'react-icons/fi';
import { loadTranslations } from '@/lib/translations';
import DriverLayout from '@/components/layouts/DriverLayout';

interface OnboardingPageProps {
  driver: any;
  plans: any[];
  translations: Record<string, any>;
  userData: any;
}

export default function OnboardingPage({
  driver,
  plans,
  translations,
  userData
}: OnboardingPageProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const tDriver = (key: string) => translations.driver?.[key] || key;

  // Determinar etapa atual baseada no status do motorista
  useEffect(() => {
    if (driver?.status === 'active') {
      // Se já está ativo, redirecionar para dashboard
      router.push('/drivers');
      return;
    }

    // Verificar se tem plano selecionado
    const hasSelectedPlan = driver?.selectedPlan;

    if (!hasSelectedPlan) {
      setCurrentStep(1); // Escolher plano (primeira etapa sempre)
    } else {
      setCurrentStep(3); // Enviar documentos (após selecionar plano)
    }
  }, [driver, router]);

  const handleSelectPlan = async (plan: any) => {
    setSelectedPlan(plan);
    setIsSubscribing(true);

    try {
      // Atualizar perfil do motorista com o plano selecionado
      const response = await fetch('/api/drivers/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: driver.id,
          selectedPlan: plan.id,
          planName: plan.name,
          planPrice: plan.priceCents,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Plano selecionado!',
          description: `Você escolheu o plano ${plan.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Atualizar o driver local
        driver.selectedPlan = plan.id;
        driver.planName = plan.name;
        driver.planPrice = plan.priceCents;
        
        setCurrentStep(3); // Próxima etapa: documentos
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao selecionar plano');
      }
    } catch (error) {
      toast({
        title: 'Erro ao selecionar plano',
        description: error instanceof Error ? error.message : 'Tente novamente',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleGoToDocuments = () => {
    router.push('/drivers/documents');
  };

  const steps = [
    {
      number: 1,
      title: 'Escolher Plano',
      description: 'Selecione o plano que melhor se adequa às suas necessidades',
      icon: FiStar,
      color: 'blue',
    },
    {
      number: 2,
      title: 'Escolher Plano',
      description: 'Selecione o plano que melhor se adequa às suas necessidades',
      icon: FiStar,
      color: 'blue',
    },
    {
      number: 3,
      title: 'Enviar Documentos',
      description: 'Faça upload dos documentos necessários para aprovação',
      icon: FiUpload,
      color: 'yellow',
    },
    {
      number: 4,
      title: 'Aguardar Aprovação',
      description: 'Aguarde nossa equipe analisar seus documentos',
      icon: FiClock,
      color: 'purple',
    },
    {
      number: 5,
      title: 'Começar a Trabalhar',
      description: 'Sua conta foi aprovada! Bem-vindo à Conduz.pt',
      icon: FiCheckCircle,
      color: 'green',
    },
  ];

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'pending';
  };

  const getDocumentsStatus = () => {
    // Verificar documentos enviados via API
    const totalDocuments = 4; // Carta de Condução, Seguro, TVDE, Inspeção
    const uploadedDocuments = driver?.documentsUploaded || 0;
    
    return {
      uploaded: uploadedDocuments,
      total: totalDocuments,
      percentage: Math.round((uploadedDocuments / totalDocuments) * 100)
    };
  };

  const documentsStatus = getDocumentsStatus();

  return (
    <>
      <Head>
        <title>Bem-vindo - Conduz.pt</title>
      </Head>
      
      <DriverLayout
        title={`Bem-vindo, ${driver?.firstName || 'Motorista'}!`}
        subtitle="Vamos configurar sua conta para começar a trabalhar"
        user={{
          name: driver?.name || 'Motorista',
          avatar: driver?.avatar,
          role: 'driver',
          status: driver?.status
        }}
        notifications={0}
        breadcrumbs={[
          { label: 'Onboarding' }
        ]}
      >
        {/* Progress Overview */}
        <Card bg="white" borderColor="gray.200">
          <CardHeader>
            <Heading size="md">Progresso da Configuração</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Progresso Geral</Text>
                  <Text fontSize="sm" color="gray.600">{Math.round((currentStep / 5) * 100)}%</Text>
                </HStack>
                <Progress 
                  value={(currentStep / 5) * 100} 
                  colorScheme="green"
                  size="lg" 
                  borderRadius="md"
                />
              </Box>

              {/* Steps */}
              <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                {steps.map((step) => {
                  const status = getStepStatus(step.number);
                  const StepIcon = step.icon;
                  
                  return (
                    <Card 
                      key={step.number}
                      bg={status === 'completed' ? 'green.50' : status === 'current' ? 'blue.50' : 'gray.50'}
                      borderColor={status === 'completed' ? 'green.200' : status === 'current' ? 'blue.200' : 'gray.200'}
                      borderWidth={status === 'current' ? '2px' : '1px'}
                    >
                      <CardBody textAlign="center">
                        <VStack spacing={2}>
                          <Box
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            bg={status === 'completed' ? 'green.500' : status === 'current' ? 'blue.500' : 'gray.300'}
                            color="white"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {status === 'completed' ? (
                              <FiCheckCircle size={20} />
                            ) : (
                              <StepIcon size={20} />
                            )}
                          </Box>
                          <Text fontSize="sm" fontWeight="medium">
                            {step.title}
                          </Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">
                            {step.description}
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Current Step Content */}
        {currentStep === 1 && (
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Escolha seu Plano</Heading>
              <Text color="gray.600">
                Selecione o plano que melhor se adequa às suas necessidades
              </Text>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {plans.map((plan) => (
                  <Card 
                    key={plan.id}
                    bg="white"
                    borderColor={plan.featured ? 'purple.500' : 'gray.200'}
                    borderWidth={plan.featured ? '2px' : '1px'}
                    position="relative"
                    shadow={plan.featured ? 'lg' : 'sm'}
                  >
                    {plan.featured && (
                      <Badge 
                        colorScheme="purple"
                        position="absolute"
                        top="-10px"
                        left="50%"
                        transform="translateX(-50%)"
                        px={3}
                        py={1}
                      >
                        Mais Popular
                      </Badge>
                    )}
                    
                    <CardHeader textAlign="center" pb={2}>
                      <VStack spacing={2}>
                        <Heading size="md" color={plan.featured ? 'purple.600' : 'gray.800'}>
                          {plan.name}
                        </Heading>
                        <HStack align="baseline">
                          <Text fontSize="3xl" fontWeight="bold" color={plan.featured ? 'purple.600' : 'gray.800'}>
                            €{(plan.priceCents / 100).toFixed(0)}
                          </Text>
                          <Text color="gray.500">
                            /{plan.interval === 'month' ? 'mês' : 'ano'}
                          </Text>
                        </HStack>
                      </VStack>
                    </CardHeader>

                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <List spacing={2}>
                          {plan.features && plan.features.map((feature: string, index: number) => (
                            <ListItem key={index} fontSize="sm">
                              <ListIcon as={FiCheckCircle} color="green.500" />
                              {feature}
                            </ListItem>
                          ))}
                        </List>

                        <Button
                          colorScheme={plan.featured ? 'purple' : 'gray'}
                          size="lg"
                          w="full"
                          onClick={() => handleSelectPlan(plan)}
                          isLoading={isSubscribing && selectedPlan?.id === plan.id}
                        >
                          Escolher Plano
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {currentStep === 3 && (
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Enviar Documentos</Heading>
              <Text color="gray.600">
                Faça upload dos documentos necessários para aprovação
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Document Progress */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium">Documentos Enviados</Text>
                    <Text fontSize="sm" color="gray.600">
                      {documentsStatus.uploaded}/{documentsStatus.total} ({documentsStatus.percentage}%)
                    </Text>
                  </HStack>
                  <Progress 
                    value={documentsStatus.percentage} 
                    colorScheme={documentsStatus.percentage === 100 ? 'green' : 'blue'}
                    size="lg" 
                    borderRadius="md"
                  />
                </Box>

                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Documentos Necessários</AlertTitle>
                    <AlertDescription>
                      Para aprovação, você precisa enviar: Carta de Condução, Seguro do Veículo, 
                      Certificado TVDE e Inspeção Técnica.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Button
                  colorScheme="blue"
                  size="lg"
                  leftIcon={<FiUpload />}
                  onClick={handleGoToDocuments}
                >
                  Enviar Documentos
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {currentStep === 4 && (
          <Card bg="white" borderColor="gray.200">
            <CardHeader>
              <Heading size="md">Aguardando Aprovação</Heading>
              <Text color="gray.600">
                Sua documentação está sendo analisada pela nossa equipe
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Análise em Andamento</AlertTitle>
                    <AlertDescription>
                      Nossa equipe está analisando seus documentos. Você receberá uma notificação 
                      por email quando a análise for concluída. Este processo pode levar até 24 horas.
                    </AlertDescription>
                  </Box>
                </Alert>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Card bg="blue.50" borderColor="blue.200">
                    <CardBody>
                      <VStack spacing={2} align="center">
                        <Icon as={FiClock} boxSize={8} color="blue.500" />
                        <Text fontWeight="medium" color="blue.700">
                          Tempo Médio
                        </Text>
                        <Text fontSize="sm" color="blue.600">
                          24 horas
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg="green.50" borderColor="green.200">
                    <CardBody>
                      <VStack spacing={2} align="center">
                        <Icon as={FiCheckCircle} boxSize={8} color="green.500" />
                        <Text fontWeight="medium" color="green.700">
                          Taxa de Aprovação
                        </Text>
                        <Text fontSize="sm" color="green.600">
                          95%
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        )}
      </DriverLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get locale from context or default to 'pt'
    const locale = context.locale || 'pt';
    
    const translations = await loadTranslations(locale, ['common', 'driver']);

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
    
    if (!userData || userData.role !== 'driver') {
      return {
        redirect: {
          destination: '/admin',
          permanent: false,
        },
      };
    }

    // Get driver data from Firestore
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', userData.uid).limit(1).get();
    
    if (driverSnap.empty) {
      throw new Error('Driver not found');
    }

    const driverDoc = driverSnap.docs[0];
    const driver = {
      id: driverDoc.id,
      ...driverDoc.data(),
    };

    // Get available plans
    const plansSnap = await adminDb.collection('plans').where('active', '==', true).get();
    const plans = plansSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      props: {
        driver,
        plans,
        translations,
        userData: driver,
      },
    };
  } catch (error) {
    console.error('Error loading onboarding page:', error);
    return {
      props: {
        driver: null,
        plans: [],
        translations: { common: {}, driver: {} },
        userData: null,
      },
    };
  }
};
