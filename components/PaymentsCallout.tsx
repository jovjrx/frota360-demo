import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FiCheckCircle, FiArrowRight, FiCalendar } from 'react-icons/fi';
import NextLink from 'next/link';

interface PaymentsCalloutProps {
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  ctaText: string;
  ctaHref: string;
  onCtaClick?: () => void;
}

export function PaymentsCallout({
  title,
  subtitle,
  description,
  highlights,
  ctaText,
  ctaHref,
  onCtaClick,
}: PaymentsCalloutProps) {
  return (
    <Box bg="green.50" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl">
        <Box
          bg="white"
          borderRadius="2xl"
          p={{ base: 6, md: 10 }}
          shadow="xl"
          borderWidth="1px"
          borderColor="green.200"
        >
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} color="green.600">
              <Icon as={FiCalendar} boxSize={6} />
              <Heading size={{ base: 'lg', md: 'xl' }} color="green.700">
                {title}
              </Heading>
            </HStack>

            <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600">
              {subtitle}
            </Text>

            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.700">
              {description}
            </Text>

            <List spacing={3}>
              {highlights.map((highlight, index) => (
                <ListItem key={index} fontSize={{ base: 'sm', md: 'md' }}>
                  <ListIcon as={FiCheckCircle} color="green.500" />
                  {highlight}
                </ListItem>
              ))}
            </List>

            <Button
              as={NextLink}
              href={ctaHref}
              colorScheme="green"
              size="lg"
              rightIcon={<FiArrowRight />}
              alignSelf="flex-start"
              onClick={onCtaClick}
            >
              {ctaText}
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
