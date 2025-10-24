import { Box, Container, Heading, Text, SimpleGrid, VStack, HStack, Button, Icon, List, ListItem, ListIcon } from '@chakra-ui/react';
import { FiCheckCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface ReferralSectionProps {
  t: (key: string, fallback?: string) => string;
  isAuthenticated?: boolean;
}

export default function ReferralSection({ t, isAuthenticated = false }: ReferralSectionProps) {
  const router = useRouter();

  const handleCTA = () => {
    if (isAuthenticated) {
      router.push('/dashboard/commissions');
    } else {
      router.push('/request');
    }
  };

  const steps = [0, 1, 2, 3];

  return (
    <Box bg="gradient-to-br from-blue-50 to-indigo-50" py={{ base: 16, md: 20 }} position="relative" overflow="hidden">
      {/* Background decoration */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="blue.100"
        opacity={0.3}
        filter="blur(80px)"
      />

      <Container maxW="7xl" position="relative">
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 12, lg: 16 }} alignItems="center">
          <VStack align="start" spacing={6}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="wider"
              color="blue.600"
              textTransform="uppercase"
            >
              {t('referral.feature', 'COMISSÕES')}
            </Text>

            <Heading
              as="h2"
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              fontWeight="bold"
              lineHeight="1.2"
            >
              {t('referral.title', 'Sistema de comissões multinível')}
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.700">
              {t('referral.subtitle', 'Ganhe comissões recorrentes pelos motoristas que indicar')}
            </Text>

            <Text fontSize="md" color="gray.600" lineHeight="1.7">
              {t('referral.description', 'Indique motoristas e ganhe comissões sobre os ganhos deles. Quanto mais motoristas ativos na sua rede, mais você ganha - toda semana, automaticamente.')}
            </Text>

            <HStack spacing={4} pt={4}>
              <Icon as={FiUsers} w={6} h={6} color="blue.500" />
              <Icon as={FiTrendingUp} w={6} h={6} color="green.500" />
            </HStack>

            <Button
              size="lg"
              colorScheme="blue"
              onClick={handleCTA}
              rightIcon={<FiCheckCircle />}
              shadow="md"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.3s"
            >
              {isAuthenticated
                ? t('referral.ctaAuth', 'Ver minhas comissões')
                : t('referral.cta', 'Juntar-se agora')
              }
            </Button>
          </VStack>
          {/* Left: How it works */}
          <Box
            bg="white"
            p={{ base: 8, md: 10 }}
            borderRadius="2xl"
            shadow="xl"
            borderWidth="1px"
            borderColor="gray.100"
          >
            <Heading as="h3" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" mb={6} color="gray.900">
              Como funciona
            </Heading>

            <List spacing={4}>
              {steps.map((index) => (
                <ListItem key={index} display="flex" alignItems="flex-start">
                  <ListIcon
                    as={FiCheckCircle}
                    color="green.500"
                    w={5}
                    h={5}
                    mt={0.5}
                  />
                  <Text fontSize="md" color="gray.700" lineHeight="1.7">
                    {t(`referral.howItWorks.${index}`, '')}
                  </Text>
                </ListItem>
              ))}
            </List>

            <Box mt={6} p={4} bg="blue.50" borderRadius="lg" borderLeftWidth="4px" borderLeftColor="blue.500">
              <Text fontSize="sm" fontWeight="medium" color="blue.900">
                💡 <strong>Dica:</strong> Quanto mais ativa sua rede, maiores suas comissões recorrentes!
              </Text>
            </Box>
          </Box>

          {/* Right: Content */}

        </SimpleGrid>
      </Container>
    </Box>
  );
}
