import { Box, Container, Heading, Text, SimpleGrid, VStack, HStack, Icon, Badge } from '@chakra-ui/react';
import { FiCalendar, FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';

interface PaymentsCalloutProps {
  badge: string;
  title: string;
  subtitle: string;
  description?: string;
  features: Array<{
    title: string;
    description: string;
    icon: any;
    color: string;
  }>;
  stats: {
    reliability: string;
    hidden: string;
    processing: string;
  };
  highlights?: string[];
}

export default function PaymentsCallout({ 
  badge, 
  title, 
  subtitle, 
  description, 
  features, 
  stats,
  highlights 
}: PaymentsCalloutProps) {

  return (
    <Box bg="brand.900" color="white" py={{ base: 16, md: 20 }} position="relative" overflow="hidden">
      {/* Background decoration */}
      <Box
        position="absolute"
        bottom="-20%"
        left="-10%"
        width="500px"
        height="500px"
        borderRadius="full"
        bg="brand.500"
        opacity={0.1}
        filter="blur(100px)"
      />
      
      <Container maxW="7xl" position="relative">
        <VStack spacing={{ base: 8, md: 12 }} textAlign="center" mb={{ base: 12, md: 16 }}>
          <Badge
            colorScheme="brand"
            fontSize="sm"
            px={4}
            py={2}
            borderRadius="full"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {badge}
          </Badge>
          
          <Heading
            as="h2"
            fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
            fontWeight="bold"
            lineHeight="1.2"
            maxW="4xl"
          >
            {title}
          </Heading>
          
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            color="gray.300"
            maxW="3xl"
            lineHeight="1.7"
          >
            {subtitle}
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 6, md: 8 }}>
          {features.map((feature, index) => (
            <VStack
              key={index}
              p={6}
              bg="whiteAlpha.100"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              spacing={4}
              align="start"
              transition="all 0.3s"
              _hover={{
                bg: 'whiteAlpha.200',
                borderColor: 'whiteAlpha.300',
                transform: 'translateY(-4px)',
              }}
            >
              <Box
                p={3}
                borderRadius="lg"
                bg={`${feature.color}.500`}
                color="white"
              >
                <Icon as={feature.icon} w={6} h={6} />
              </Box>
              
              <VStack align="start" spacing={2}>
                <Text fontSize="lg" fontWeight="bold">
                  {feature.title}
                </Text>
                <Text fontSize="sm" color="gray.400" lineHeight="1.6">
                  {feature.description}
                </Text>
              </VStack>
            </VStack>
          ))}
        </SimpleGrid>

        <Box mt={{ base: 12, md: 16 }} textAlign="center">
          <HStack
            justify="center"
            spacing={8}
            p={8}
            bg="whiteAlpha.100"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            flexWrap="wrap"
          >
            <VStack spacing={1}>
              <Text fontSize="3xl" fontWeight="bold" color="green.400">
                100%
              </Text>
              <Text fontSize="sm" color="gray.400">
                {stats.reliability}
              </Text>
            </VStack>
            
            <Box h="50px" w="1px" bg="whiteAlpha.300" display={{ base: 'none', md: 'block' }} />
            
            <VStack spacing={1}>
              <Text fontSize="3xl" fontWeight="bold" color="blue.400">
                €0
              </Text>
              <Text fontSize="sm" color="gray.400">
                {stats.hidden}
              </Text>
            </VStack>
            
            <Box h="50px" w="1px" bg="whiteAlpha.300" display={{ base: 'none', md: 'block' }} />
            
            <VStack spacing={1}>
              <Text fontSize="3xl" fontWeight="bold" color="purple.400">
                24h
              </Text>
              <Text fontSize="sm" color="gray.400">
                {stats.processing}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </Container>
    </Box>
  );
}

