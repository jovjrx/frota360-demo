import { Box, Container, Heading, Text, SimpleGrid, VStack, Icon } from '@chakra-ui/react';
import { FiCheckCircle, FiClock, FiShield, FiHeadphones } from 'react-icons/fi';

interface ProofSectionProps {
  t: (key: string, fallback?: string) => string;
}

const iconMap: { [key: string]: any } = {
  payment_guarantee: FiCheckCircle,
  activation_time: FiClock,
  transparency: FiShield,
  support: FiHeadphones,
};

export default function ProofSection({ t }: ProofSectionProps) {
  const counters = ['payment_guarantee', 'activation_time', 'transparency', 'support'];

  return (
    <Box bg="gray.50" py={{ base: 16, md: 20 }}>
      <Container maxW="7xl">
        <VStack spacing={12}>
          {/* Header */}
          <VStack spacing={4} textAlign="center" maxW="3xl">
            <Text
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="wider"
              color="blue.600"
              textTransform="uppercase"
            >
              {t('proof.feature', 'GARANTIAS')}
            </Text>
            <Heading
              as="h2"
              fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
              fontWeight="bold"
              lineHeight="1.2"
            >
              {t('proof.title', 'Garantias que fazem a diferença')}
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600">
              {t('proof.subtitle', 'Compromissos reais que cumprimos todas as semanas')}
            </Text>
          </VStack>

          {/* Counters Grid */}
          <SimpleGrid
            columns={{ base: 1, sm: 2, lg: 4 }}
            spacing={{ base: 8, md: 10 }}
            w="full"
          >
            {counters.map((counter) => {
              const IconComponent = iconMap[counter];
              return (
                <VStack
                  key={counter}
                  spacing={3}
                  p={8}
                  bg="white"
                  borderRadius="xl"
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.200"
                  transition="all 0.3s"
                  _hover={{
                    shadow: 'md',
                    transform: 'translateY(-4px)',
                    borderColor: 'blue.300',
                  }}
                >
                  <Icon
                    as={IconComponent}
                    w={10}
                    h={10}
                    color="blue.500"
                  />
                  <Text
                    fontSize={{ base: '3xl', md: '4xl' }}
                    fontWeight="extrabold"
                    color="blue.600"
                    lineHeight="1"
                  >
                    {t(`proof.counters.${counter}.value`, '—')}
                  </Text>
                  <Text
                    fontSize={{ base: 'md', md: 'lg' }}
                    fontWeight="semibold"
                    color="gray.900"
                    textAlign="center"
                  >
                    {t(`proof.counters.${counter}.label`, '')}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    textAlign="center"
                  >
                    {t(`proof.counters.${counter}.description`, '')}
                  </Text>
                </VStack>
              );
            })}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}
