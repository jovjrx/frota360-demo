import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { withDriver } from '@/lib/auth/rbac';
import { store } from '@/lib/store';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Heading,
  Button,
  SimpleGrid,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Alert,
  AlertIcon,
  Progress,
  Divider,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiCreditCard, FiCalendar } from 'react-icons/fi';
import { useState } from 'react';

interface SubscriptionPageProps {
  driver: any;
  subscription: any;
  plans: any[];
}

export default function SubscriptionPage({ driver, subscription, plans }: SubscriptionPageProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: driver.userId,
          planId,
          paymentMethodId: 'mock_payment_method', // In a real app, this would come from a payment form
        }),
      });

      if (response.ok) {
        toast({
          title: 'Assinatura criada!',
          description: 'Sua assinatura foi criada com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        window.location.reload();
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao criar assinatura. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/cancel?subscriptionId=${subscription.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelAtPeriodEnd: true,
          reason: 'Driver requested cancellation',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Assinatura cancelada',
          description: 'Sua assinatura será cancelada no final do período atual.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        window.location.reload();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar assinatura. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'trialing': return 'blue';
      case 'past_due': return 'red';
      case 'canceled': return 'gray';
      default: return 'yellow';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'trialing': return 'Período de Teste';
      case 'past_due': return 'Em Atraso';
      case 'canceled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <>
      <Head>
        <title>Minha Assinatura - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg="gray.50">
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  Minha Assinatura
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Gerencie sua assinatura e planos
                </Text>
              </VStack>
              {!subscription && (
                <Button colorScheme="blue" onClick={onOpen}>
                  Escolher Plano
                </Button>
              )}
            </HStack>
          </Box>
        </Box>

        {/* Main Content */}
        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={8} align="stretch">
            {/* Current Subscription */}
            {subscription ? (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Heading size="md" mb={4}>Assinatura Atual</Heading>
                  <VStack spacing={4} align="stretch">
                    <HStack justifyContent="space-between">
                      <Text fontWeight="medium">Status:</Text>
                      <Badge colorScheme={getStatusColor(subscription.status)}>
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    </HStack>
                    
                    <HStack justifyContent="space-between">
                      <Text fontWeight="medium">Plano:</Text>
                      <Text>{subscription.planId}</Text>
                    </HStack>

                    {subscription.status === 'trialing' && (
                      <Alert status="info">
                        <AlertIcon />
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">Período de teste ativo</Text>
                          <Text fontSize="sm">
                            Seu período de teste termina em {new Date(subscription.trialEnd).toLocaleDateString('pt-BR')}
                          </Text>
                        </VStack>
                      </Alert>
                    )}

                    <HStack justifyContent="space-between">
                      <Text fontWeight="medium">Próxima cobrança:</Text>
                      <Text>{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</Text>
                    </HStack>

                    {subscription.status === 'active' && (
                      <Progress 
                        value={(Date.now() - subscription.currentPeriodStart) / (subscription.currentPeriodEnd - subscription.currentPeriodStart) * 100}
                        colorScheme="blue"
                        size="sm"
                      />
                    )}

                    <Divider />

                    <HStack spacing={4}>
                      <Button colorScheme="blue" variant="outline" size="sm">
                        Alterar Plano
                      </Button>
                      <Button 
                        colorScheme="red" 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancel}
                        isLoading={loading}
                      >
                        Cancelar Assinatura
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="medium">
                      Você ainda não tem uma assinatura ativa
                    </Text>
                    <Text color="gray.500" textAlign="center">
                      Escolha um plano para começar a usar todos os recursos da plataforma.
                    </Text>
                    <Button colorScheme="blue" onClick={onOpen}>
                      Ver Planos Disponíveis
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Available Plans */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Heading size="md" mb={4}>Planos Disponíveis</Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  {plans.map((plan) => (
                    <Card key={plan.id} borderColor={borderColor}>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <VStack spacing={2}>
                            <Text fontSize="xl" fontWeight="bold">
                              {plan.name}
                            </Text>
                            <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                              {formatPrice(plan.priceCents)}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              por {plan.interval === 'month' ? 'mês' : 'ano'}
                            </Text>
                          </VStack>

                          <Text fontSize="sm" color="gray.600">
                            {plan.description}
                          </Text>

                          {plan.trialDays > 0 && (
                            <Badge colorScheme="green" alignSelf="center">
                              {plan.trialDays} dias grátis
                            </Badge>
                          )}

                          <VStack spacing={2} align="stretch">
                            {plan.features?.map((feature: string, index: number) => (
                              <HStack key={index} spacing={2}>
                                <FiCheck color="green" size={16} />
                                <Text fontSize="sm">{feature}</Text>
                              </HStack>
                            ))}
                          </VStack>

                          <Button
                            colorScheme={subscription?.planId === plan.id ? "gray" : "blue"}
                            variant={subscription?.planId === plan.id ? "outline" : "solid"}
                            isDisabled={subscription?.planId === plan.id}
                            onClick={() => {
                              setSelectedPlan(plan);
                              onOpen();
                            }}
                          >
                            {subscription?.planId === plan.id ? 'Plano Atual' : 'Escolher Plano'}
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          </VStack>
        </Box>

        {/* Subscribe Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Confirmar Assinatura - {selectedPlan?.name}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedPlan && (
                <VStack spacing={4} align="stretch">
                  <VStack spacing={2}>
                    <Text fontSize="2xl" fontWeight="bold">
                      {selectedPlan.name}
                    </Text>
                    <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                      {formatPrice(selectedPlan.priceCents)}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      por {selectedPlan.interval === 'month' ? 'mês' : 'ano'}
                    </Text>
                  </VStack>

                  {selectedPlan.trialDays > 0 && (
                    <Alert status="info">
                      <AlertIcon />
                      <VStack align="flex-start" spacing={1}>
                        <Text fontWeight="bold">Período de teste de {selectedPlan.trialDays} dias</Text>
                        <Text fontSize="sm">
                          Você não será cobrado durante o período de teste.
                        </Text>
                      </VStack>
                    </Alert>
                  )}

                  <Text fontSize="sm" color="gray.600">
                    {selectedPlan.description}
                  </Text>

                  <VStack spacing={2} align="stretch">
                    {selectedPlan.features?.map((feature: string, index: number) => (
                      <HStack key={index} spacing={2}>
                        <FiCheck color="green" size={16} />
                        <Text fontSize="sm">{feature}</Text>
                      </HStack>
                    ))}
                  </VStack>

                  <HStack spacing={4} w="full">
                    <Button
                      colorScheme="blue"
                      onClick={() => handleSubscribe(selectedPlan.id)}
                      isLoading={loading}
                      flex={1}
                    >
                      Confirmar Assinatura
                    </Button>
                    <Button onClick={onClose} flex={1}>
                      Cancelar
                    </Button>
                  </HStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const driver = []
    
    if (!driver) {
      return {
        redirect: {
          destination: '/painel/signup',
          permanent: false,
        },
      };
    }

    const [subscription, plans] = await Promise.all([
      store.subscriptions.findByDriverId(driver.id),
      store.plans.findAll(),
    ]);

    return {
      props: {
        driver,
        subscription,
        plans: plans.filter(plan => plan.active),
      },
    };
  } catch (error) {
    console.error('Error loading subscription page:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
});
