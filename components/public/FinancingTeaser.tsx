import { Box, Container, Heading, Text, SimpleGrid, VStack, HStack, Button, Icon, List, ListItem, ListIcon } from '@chakra-ui/react';
import { FiCheckCircle, FiCreditCard, FiTrendingUp } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface FinancingTeaserProps {
  t: (key: string, fallback?: string) => string;
}

export default function FinancingTeaser({ t }: FinancingTeaserProps) {
  const router = useRouter();

  const benefits = [
    {
      icon: FiCheckCircle,
      text: t('financing.benefits.0', 'Taxas competitivas'),
    },
    {
      icon: FiCheckCircle,
      text: t('financing.benefits.1', 'Prestações flexíveis'),
    },
    {
      icon: FiCheckCircle,
      text: t('financing.benefits.2', 'Aprovação rápida'),
    },
  ];

  return (
    <Box bg="white" py={{ base: 16, md: 20 }}>
      <Container maxW="7xl">
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 12, lg: 16 }} alignItems="center">
          {/* Left: Visual/Icon */}
          <Box
            position="relative"
            h={{ base: '300px', md: '400px' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {/* Decorative circles */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width="300px"
              height="300px"
              borderRadius="full"
              bg="gradient-to-br from-green-100 to-blue-100"
              opacity={0.6}
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width="200px"
              height="200px"
              borderRadius="full"
              bg="gradient-to-br from-green-200 to-blue-200"
              opacity={0.8}
            />
            
            {/* Center icon */}
            <Box
              position="relative"
              p={8}
              bg="white"
              borderRadius="full"
              shadow="2xl"
              borderWidth="4px"
              borderColor="blue.500"
            >
              <Icon as={FiCreditCard} w={20} h={20} color="blue.500" />
            </Box>
          </Box>

          {/* Right: Content */}
          <VStack align="start" spacing={6}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="wider"
              color="green.600"
              textTransform="uppercase"
            >
              {t('financing.badge', 'FINANCIAMENTO')}
            </Text>
            
            <Heading
              as="h2"
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              fontWeight="bold"
              lineHeight="1.2"
            >
              {t('financing.title', 'Precisa de um carro para começar?')}
            </Heading>
            
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.700" lineHeight="1.7">
              {t('financing.subtitle', 'Oferecemos soluções de financiamento flexíveis para você começar a trabalhar rapidamente')}
            </Text>
            
            <Text fontSize="md" color="gray.600" lineHeight="1.7">
              {t('financing.description', 'Trabalhamos com parceiros financeiros para oferecer as melhores condições do mercado. Entre em contato e descubra as opções disponíveis para o seu perfil.')}
            </Text>

            <List spacing={3} pt={2}>
              {benefits.map((benefit, index) => (
                <ListItem key={index} display="flex" alignItems="center">
                  <ListIcon as={benefit.icon} color="green.500" w={5} h={5} />
                  <Text fontSize="md" color="gray.700" fontWeight="medium">
                    {benefit.text}
                  </Text>
                </ListItem>
              ))}
            </List>

            <HStack spacing={4} pt={4}>
              <Button
                size="lg"
                colorScheme="green"
                onClick={() => router.push('/request')}
                rightIcon={<FiTrendingUp />}
                shadow="md"
                _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                transition="all 0.3s"
              >
                {t('financing.cta', 'Saber mais')}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                colorScheme="green"
                onClick={() => router.push('/contact')}
              >
                {t('financing.ctaSecondary', 'Falar com especialista')}
              </Button>
            </HStack>

            <Box mt={4} p={4} bg="green.50" borderRadius="lg" borderLeftWidth="4px" borderLeftColor="green.500">
              <Text fontSize="sm" color="green.900">
                💡 <strong>Nota:</strong> {t('financing.note', 'Condições sujeitas a análise de crédito. Consulte-nos para mais informações.')}
              </Text>
            </Box>
          </VStack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
