import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiDollarSign, FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import NextLink from 'next/link';

interface FinancingOption {
  title: string;
  description: string;
  fee: string;
}

interface FinancingTeaserProps {
  title: string;
  subtitle: string;
  description: string;
  options: FinancingOption[];
  ctaText: string;
  ctaHref: string;
  onCtaClick?: () => void;
}

export function FinancingTeaser({
  title,
  subtitle,
  description,
  options,
  ctaText,
  ctaHref,
  onCtaClick,
}: FinancingTeaserProps) {
  return (
    <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={4} textAlign="center">
          <HStack spacing={3} justify="center" color="green.600">
            <Icon as={FiDollarSign} boxSize={8} />
            <Heading size={{ base: 'lg', md: 'xl' }} color="gray.800">
              {title}
            </Heading>
          </HStack>

          <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" maxW="2xl">
            {subtitle}
          </Text>

          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.700" maxW="2xl">
            {description}
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {options.map((option, index) => (
            <Card key={index} variant="outline" borderColor="green.200" _hover={{ shadow: 'lg', transform: 'translateY(-4px)', transition: 'all 0.3s' }}>
              <CardBody>
                <VStack spacing={4} align="start">
                  <Icon as={FiTrendingUp} boxSize={8} color="green.600" />
                  <Heading size="md" color="gray.800">
                    {option.title}
                  </Heading>
                  <Text fontSize="sm" color="gray.600" flex="1">
                    {option.description}
                  </Text>
                  <Text fontSize="xs" color="green.600" fontWeight="semibold">
                    {option.fee}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        <Button
          as={NextLink}
          href={ctaHref}
          colorScheme="green"
          size="lg"
          rightIcon={<FiArrowRight />}
          alignSelf="center"
          onClick={onCtaClick}
          mt={4}
        >
          {ctaText}
        </Button>
      </VStack>
    </Container>
  );
}

