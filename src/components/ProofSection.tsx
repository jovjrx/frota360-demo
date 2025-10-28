import {
  Box,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  HStack,
  Icon,
  Avatar,
} from '@chakra-ui/react';
import { FiStar } from 'react-icons/fi';

interface Counter {
  value: string;
  label: string;
}

interface Testimonial {
  text: string;
  author: string;
  role: string;
}

interface ProofSectionProps {
  title?: string;
  counters: {
    drivers: Counter;
    payments: Counter;
    rating: Counter;
  };
  testimonials: Testimonial[];
}

export function ProofSection({ title, counters, testimonials }: ProofSectionProps) {
  return (
    <Box bg="gray.50" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl">
        {title && (
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            textAlign="center"
            mb={8}
            color="gray.800"
          >
            {title}
          </Text>
        )}

        {/* Contadores */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={12}>
          <Stat textAlign="center">
            <StatNumber fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold" color="green.600">
              {counters.drivers.value}
            </StatNumber>
            <StatLabel fontSize={{ base: 'sm', md: 'md' }} color="gray.600">
              {counters.drivers.label}
            </StatLabel>
          </Stat>

          <Stat textAlign="center">
            <StatNumber fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold" color="green.600">
              {counters.payments.value}
            </StatNumber>
            <StatLabel fontSize={{ base: 'sm', md: 'md' }} color="gray.600">
              {counters.payments.label}
            </StatLabel>
          </Stat>

          <Stat textAlign="center">
            <StatNumber fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold" color="green.600">
              <HStack spacing={1} justify="center">
                <Icon as={FiStar} fill="green.600" />
                <Text>{counters.rating.value}</Text>
              </HStack>
            </StatNumber>
            <StatLabel fontSize={{ base: 'sm', md: 'md' }} color="gray.600">
              {counters.rating.label}
            </StatLabel>
          </Stat>
        </SimpleGrid>

        {/* Depoimentos */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {testimonials.map((testimonial, index) => (
            <Box
              key={index}
              bg="white"
              p={6}
              borderRadius="lg"
              shadow="sm"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <VStack align="start" spacing={4}>
                <Text color="gray.700" fontSize={{ base: 'sm', md: 'md' }} fontStyle="italic">
                  "{testimonial.text}"
                </Text>
                <HStack>
                  <Avatar size="sm" name={testimonial.author} />
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                      {testimonial.author}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {testimonial.role}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

