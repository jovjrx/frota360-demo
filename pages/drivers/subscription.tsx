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
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FiCheck,
  FiX,
  FiCreditCard,
  FiCalendar,
  FiDollarSign,
  FiStar,
  FiTrendingUp,
  FiShield,
  FiHeadphones
} from 'react-icons/fi';
import Link from 'next/link';
import { loadTranslations } from '@/lib/translations';
import { useState } from 'react';

interface SubscriptionPageProps {
  driver: any;
  currentSubscription: any;
  availablePlans: any[];
  tCommon: any;
  tDriver: any;
}

export default function SubscriptionPage({ 
  driver, 
  currentSubscription, 
  availablePlans,
  tCommon,
  tDriver 
}: SubscriptionPageProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    onOpen();
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const response = await fetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          driverId: driver.id,
        }),
      };

      if (response.ok) {
        toast({
          title: tDriver('subscription.subscriptionCreated'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        };
        onClose();
        // Refresh page or redirect
        window.location.reload();
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      toast({
        title: tDriver('subscription.error'),
        description: tDriver('subscription.failedToCreate'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/billing/subscriptions/${currentSubscription.id}`, {
        method: 'DELETE',
      };

      if (response.ok) {
        toast({
          title: tDriver('subscription.subscriptionCanceled'),
          description: tDriver('subscription.subscriptionWillBeCanceled'),
          status: 'info',
          duration: 5000,
          isClosable: true,
        };
        // Refresh page
        window.location.reload();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      toast({
        title: tDriver('subscription.error'),
        description: tDriver('subscription.failedToCancel'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      };
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (planName: string) => {
    const features = {
      'Básico': [
        'Acesso ao painel do motorista',
        'Relatórios básicos de ganhos',
        'Suporte por email',
        'Integração com 1 plataforma TVDE'
      ],
      'Profissional': [
        'Tudo do plano Básico',
        'Relatórios avançados e analytics',
        'Suporte prioritário via WhatsApp',
        'Integração com múltiplas plataformas',
        'Otimização de rotas',
        'Gestão de documentos'
      ],
      'Premium': [
        'Tudo do plano Profissional',
        'Suporte 24/7 via telefone',
        'Consultoria personalizada',
        'Ferramentas de marketing',
        'API personalizada',
        'Treinamentos exclusivos'
      ]
    };
    return features[planName] || [];
  };

  return (
    <>
      <Head>
        <title>{tDriver('subscription.title')} - Conduz.pt</title>
      </Head>
      
      <Box minH="100vh" bg={bgColor}>
        {/* Header */}
        <Box bg="white" borderBottom="1px" borderColor="gray.200" py={6} shadow="sm">
          <Box maxW="7xl" mx="auto" px={4}>
            <VStack spacing={2} align="center">
              <Heading size="lg" color="gray.800">
                {tDriver('subscription.title')}
              </Heading>
              <Text color="gray.600" textAlign="center">
                {tDriver('subscription.manageSubscription')}
              </Text>
            </VStack>
          </Box>
        </Box>

        <Box maxW="7xl" mx="auto" px={4} py={8}>
          <VStack spacing={8} align="stretch">
            {/* Current Subscription */}
            {currentSubscription ? (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">{tDriver('subscription.currentSubscription')}</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <VStack align="flex-start">
                      <Text fontSize="sm" color="gray.500">{tDriver('subscription.status')}</Text>
                      <Badge colorScheme={currentSubscription.status === 'active' ? 'green' : 'red'} fontSize="md" p={2}>
                        {currentSubscription.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {currentSubscription.trialEnd && new Date(currentSubscription.trialEnd) > new Date() && (
                        <Alert status="info" size="sm">
                          <AlertIcon />
                          <Box>
                            <AlertTitle fontSize="sm">{tDriver('subscription.trialActive')}</AlertTitle>
                            <AlertDescription fontSize="xs">
                              {tDriver('subscription.trialEnds')} {new Date(currentSubscription.trialEnd).toLocaleDateString('pt-BR')}
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}
                    </VStack>
                    
                    <VStack align="flex-start">
                      <Text fontSize="sm" color="gray.500">{tDriver('subscription.plan')}</Text>
                      <Text fontSize="xl" fontWeight="bold">{currentSubscription.plan?.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        €{(currentSubscription.plan?.price / 100).toFixed(2)}/{currentSubscription.plan?.interval === 'month' ? 'mês' : 'ano'}
                      </Text>
                    </VStack>

                    <VStack align="flex-start">
                      <Text fontSize="sm" color="gray.500">{tDriver('subscription.nextBilling')}</Text>
                      <Text fontSize="lg" fontWeight="bold">
                        {currentSubscription.nextBilling ? new Date(currentSubscription.nextBilling).toLocaleDateString('pt-BR') : 'N/A'}
                      </Text>
                      <HStack spacing={2}>
                        <Button size="sm" colorScheme="blue" variant="outline">
                          {tDriver('subscription.changePlan')}
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme="red" 
                          variant="outline"
                          onClick={handleCancelSubscription}
                          isLoading={loading}
                        >
                          {tDriver('subscription.cancelSubscription')}
                        </Button>
                      </HStack>
                    </VStack>
                  </SimpleGrid>
                </CardBody>
              </Card>
            ) : (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>{tDriver('subscription.noSubscription')}</AlertTitle>
                  <AlertDescription>
                    {tDriver('subscription.choosePlanDescription')}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Available Plans */}
            <Box>
              <Heading size="md" mb={6} textAlign="center">
                {tDriver('subscription.availablePlans')}
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {availablePlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    bg={cardBg} 
                    borderColor={plan.featured ? 'purple.500' : borderColor}
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
                            €{(plan.price / 100).toFixed(0)}
                          </Text>
                          <Text color="gray.500">
                            {tDriver('subscription.' + (plan.interval === 'month' ? 'perMonth' : 'perYear'))}
                          </Text>
                        </HStack>
                        {plan.trialDays > 0 && (
                          <Badge colorScheme="green">
                            {plan.trialDays} {tDriver('subscription.freeDays')}
                          </Badge>
                        )}
                      </VStack>
                    </CardHeader>

                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <List spacing={2}>
                          {getPlanFeatures(plan.name).map((feature, index) => (
                            <ListItem key={index} fontSize="sm">
                              <ListIcon as={FiCheck} color="green.500" />
                              {feature}
                            </ListItem>
                          ))}
                        </List>

                        <Divider />

                        <Button
                          colorScheme={plan.featured ? 'purple' : 'gray'}
                          size="lg"
                          w="full"
                          onClick={() => handleSelectPlan(plan)}
                          isDisabled={currentSubscription?.plan?.id === plan.id}
                        >
                          {currentSubscription?.plan?.id === plan.id 
                            ? tDriver('subscription.currentPlan')
                            : tDriver('subscription.chooseThisPlan')
                          }
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        </Box>

        {/* Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{tDriver('subscription.confirmSubscription')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedPlan && (
                <VStack spacing={4} align="stretch">
                  <Card bg="gray.50">
                    <CardBody>
                      <VStack spacing={2} align="center">
                        <Heading size="md">{selectedPlan.name}</Heading>
                        <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                          €{(selectedPlan.price / 100).toFixed(2)}/{selectedPlan.interval === 'month' ? 'mês' : 'ano'}
                        </Text>
                        {selectedPlan.trialDays > 0 && (
                          <Badge colorScheme="green" fontSize="sm">
                            {tDriver('subscription.trialInfo').replace('{days}', selectedPlan.trialDays)}
                          </Badge>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  {selectedPlan.trialDays > 0 && (
                    <Alert status="info">
                      <AlertIcon />
                      <AlertDescription fontSize="sm">
                        {tDriver('subscription.trialDescription')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <List spacing={2}>
                    {getPlanFeatures(selectedPlan.name).map((feature, index) => (
                      <ListItem key={index} fontSize="sm">
                        <ListIcon as={FiCheck} color="green.500" />
                        {feature}
                      </ListItem>
                    ))}
                  </List>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                {tCommon('cancel')}
              </Button>
              <Button 
                colorScheme="purple" 
                onClick={handleConfirmSubscription}
                isLoading={loading}
              >
                {tDriver('subscription.confirmSubscriptionButton')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
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
    
    // Get current subscription
    const currentSubscription = []

    // Get available plans
    const availablePlans = []

    return {
      props: {
        driver,
        currentSubscription,
        availablePlans,
        tCommon,
        tDriver,
      },
    };
  } catch (error) {
    console.error('Error loading subscription page:', error);
    return {
      props: {
        driver: null,
        currentSubscription: null,
        availablePlans: [],
        tCommon: {},
        tDriver: {},
      },
    };
  }
};
