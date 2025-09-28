import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  List,
  ListItem,
  ListIcon,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CheckIcon, StarIcon } from '@chakra-ui/icons';
import { Container } from './Container';
import { Title } from './Title';
import { ContainerDivisions } from './ContainerDivisions';
import NextLink from 'next/link';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  interval: string;
  features: string[];
  active: boolean;
  featured: boolean;
  trialDays?: number;
}

interface PlansSectionProps {
  locale?: string;
}

export function PlansSection({ locale = 'pt' }: PlansSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/plans/list');
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      
      // Filter only active and featured plans for home display
      const activePlans = data.filter((plan: Plan) => plan.active && plan.featured);
      
      setPlans(activePlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Erro ao carregar planos');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos disponíveis',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, interval: string) => {
    const formattedPrice = (price / 100).toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    });
    
    if (interval === 'month') {
      return `${formattedPrice}/mês`;
    } else if (interval === 'year') {
      return `${formattedPrice}/ano`;
    }
    
    return formattedPrice;
  };

  const getPlanColor = (index: number) => {
    const colors = ['green', 'blue', 'purple', 'orange'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Container>
        <Center py={20}>
          <VStack spacing={4}>
            <Spinner size="xl" color="green.500" />
            <Text color="gray.600">Carregando planos...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (plans.length === 0) {
    return null; // Don't render if no plans
  }

  return (
    <Container softBg>
      <Title
        title="Nossos Planos"
        description="Escolha o plano ideal para começar sua jornada como motorista TVDE"
        feature="PLANOS"
      />
      
      <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)", lg: `repeat(${plans.length}, 1fr)` }}>
        {plans.map((plan, index) => (
          <Card
            key={plan.id}
            position="relative"
            borderWidth={plan.featured ? "2px" : "1px"}
            borderColor={plan.featured ? `${getPlanColor(index)}.500` : "gray.200"}
            shadow={plan.featured ? "xl" : "md"}
            transform={plan.featured ? "scale(1.05)" : "scale(1)"}
            transition="all 0.3s ease"
            _hover={{
              shadow: "xl",
              transform: "translateY(-4px)",
            }}
          >
            {plan.featured && (
              <Box
                position="absolute"
                top="-12px"
                left="50%"
                transform="translateX(-50%)"
                bg={`${getPlanColor(index)}.500`}
                color="white"
                px={4}
                py={1}
                borderRadius="full"
                fontSize="sm"
                fontWeight="bold"
              >
                <HStack spacing={1}>
                  <StarIcon boxSize={3} />
                  <Text>MAIS POPULAR</Text>
                </HStack>
              </Box>
            )}

            <CardHeader textAlign="center" pb={2}>
              <VStack spacing={2}>
                <Heading size="lg" color={`${getPlanColor(index)}.600`}>
                  {plan.name}
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {plan.description}
                </Text>
                <VStack spacing={1}>
                  <Text fontSize="3xl" fontWeight="bold" color={`${getPlanColor(index)}.600`}>
                    {formatPrice(plan.priceCents, plan.interval)}
                  </Text>
                  {plan.trialDays && plan.trialDays > 0 && (
                    <Badge colorScheme="green" variant="subtle">
                      {plan.trialDays} dias grátis
                    </Badge>
                  )}
                </VStack>
              </VStack>
            </CardHeader>

            <CardBody pt={0}>
              <VStack spacing={6} align="stretch">
                <List spacing={3}>
                  {plan.features.map((feature, featureIndex) => (
                    <ListItem key={featureIndex}>
                      <HStack align="flex-start" spacing={3}>
                        <ListIcon as={CheckIcon} color={`${getPlanColor(index)}.500`} mt={0.5} />
                        <Text fontSize="sm" color="gray.700">
                          {feature}
                        </Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>

                <Button
                  as={NextLink}
                  href="/signup"
                  colorScheme={getPlanColor(index)}
                  size="lg"
                  w="full"
                  py={6}
                  fontSize="md"
                  fontWeight="semibold"
                  _hover={{
                    transform: "translateY(-2px)",
                    shadow: "lg",
                  }}
                  transition="all 0.2s ease"
                >
                  Escolher {plan.name}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </ContainerDivisions>

      <Box textAlign="center" mt={8}>
        <Text color="gray.600" fontSize="sm" mb={4}>
          Todos os planos incluem suporte 24/7 e garantia de satisfação
        </Text>
        <Button
          as={NextLink}
          href="/services/drivers"
          variant="outline"
          colorScheme="green"
          size="sm"
        >
          Ver todos os planos
        </Button>
      </Box>
    </Container>
  );
}
