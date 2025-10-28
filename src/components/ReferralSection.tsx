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
  Badge,
} from '@chakra-ui/react';
import { FiGift, FiArrowRight, FiUsers } from 'react-icons/fi';
import NextLink from 'next/link';

interface ReferralSectionProps {
  title: string;
  subtitle: string;
  description?: string;
  howItWorks: string[];
  ctaText: string;
  ctaHref: string;
  isAuthenticated?: boolean;
  onCtaClick?: () => void;
}

export function ReferralSection({
  title,
  subtitle,
  description,
  howItWorks,
  ctaText,
  ctaHref,
  isAuthenticated,
  onCtaClick,
}: ReferralSectionProps) {
  return (
    <Box bg="gradient" bgGradient="linear(to-br, green.500, green.600)" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} alignItems="center">
          {/* Texto */}
          <VStack align="start" spacing={6} color="white">
            <HStack spacing={3}>
              <Icon as={FiGift} boxSize={8} />
              <Badge colorScheme="yellow" fontSize="sm" px={3} py={1} borderRadius="full">
                50€ por indicação
              </Badge>
            </HStack>

            <Heading size={{ base: 'xl', md: '2xl' }}>{title}</Heading>

            <Text fontSize={{ base: 'md', md: 'lg' }} opacity={0.9}>
              {subtitle}
            </Text>

            {description && (
              <Text fontSize={{ base: 'sm', md: 'md' }} opacity={0.8}>
                {description}
              </Text>
            )}

            <Button
              as={NextLink}
              href={ctaHref}
              size="lg"
              colorScheme="yellow"
              color="green.700"
              rightIcon={<FiArrowRight />}
              onClick={onCtaClick}
              mt={2}
            >
              {ctaText}
            </Button>
          </VStack>

          {/* Como funciona */}
          <Box bg="whiteAlpha.200" p={8} borderRadius="xl" backdropFilter="blur(10px)">
            <VStack align="start" spacing={4}>
              <HStack color="white" mb={2}>
                <Icon as={FiUsers} boxSize={6} />
                <Text fontWeight="semibold" fontSize="lg">
                  Como funciona
                </Text>
              </HStack>

              {howItWorks.map((step, index) => (
                <HStack key={index} align="start" color="white" spacing={3}>
                  <Badge
                    colorScheme="yellow"
                    borderRadius="full"
                    w={8}
                    h={8}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {index + 1}
                  </Badge>
                  <Text fontSize="sm" opacity={0.9}>
                    {step}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

