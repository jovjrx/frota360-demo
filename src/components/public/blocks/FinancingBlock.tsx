import { Box, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { Card } from '@/components/Card';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';

interface FinancingBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function FinancingBlock({ block, t, getArray, getText }: FinancingBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const alert = getValue(block.alert);
  const benefits = getArray ? getArray(block.benefits) : (Array.isArray(block.benefits) ? block.benefits : []);
  const example = block.example;

  return (
    <Container>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', lg: 'repeat(2, 1fr)' }}>
        <Card title={getValue(block.cardTitle)} animated borded>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">{getValue(block.cardDescription)}</Text>
            {alert && (
              <Box p={4} bg="orange.50" borderRadius="md" borderLeft="4px" borderLeftColor="orange.400">
                <Text fontSize="sm" color="orange.800" fontWeight="semibold">
                  {alert}
                </Text>
              </Box>
            )}

            {Array.isArray(benefits) && benefits.length > 0 && (
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={3}>
                  Benefícios:
                </Text>
                <VStack spacing={2} align="stretch">
                  {benefits.map((benefit: any, index: number) => (
                    <HStack key={index} spacing={3}>
                      <Icon as={FaCheckCircle} color="green.500" />
                      <Text fontSize="sm">{getValue(benefit)}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </Card>

        {example && (
          <Card animated borded>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                {getValue(example.title)}
              </Text>
              <Text fontSize="sm" color="gray.700" fontStyle="italic">
                {getValue(example.scenario)}
              </Text>
              {Array.isArray(example.details) && (
                <VStack spacing={2} align="stretch" mt={2}>
                  {example.details.map((detail: any, index: number) => (
                    <HStack key={index} spacing={2}>
                      <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                      <Text fontSize="sm" color="gray.700">
                        {getValue(detail)}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </VStack>
          </Card>
        )}
      </ContainerDivisions>
    </Container>
  );
}
