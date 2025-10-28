import { Box, Text, VStack, HStack, Icon } from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { Card } from '@/components/Card';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';

interface RequirementsBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function RequirementsBlock({ block, t, getArray, getText }: RequirementsBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const documents = getArray ? getArray(block.documents) : (Array.isArray(block.documents) ? block.documents : []);
  const integrations = getArray ? getArray(block.integrations) : (Array.isArray(block.integrations) ? block.integrations : []);
  const banking = getArray ? getArray(block.banking) : (Array.isArray(block.banking) ? block.banking : []);

  return (
    <Container softBg>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', md: 'repeat(3, 1fr)' }}>
        {/* Documentos */}
        <Card
          title={getValue(block.documentsTitle)}
          animated
          borded
        >
          <VStack spacing={2} align="stretch">
            {Array.isArray(documents) &&
              documents.map((doc: any, i: number) => (
                <HStack key={i} spacing={3}>
                  <Icon as={FaCheckCircle} color="green.500" />
                  <Text fontSize="sm">{getValue(doc)}</Text>
                </HStack>
              ))}
          </VStack>
        </Card>

        {/* Integrações */}
        <Card
          title={getValue(block.integrationsTitle)}
          animated
          borded
        >
          <VStack spacing={2} align="stretch" mb={3}>
            <Text fontSize="xs" color="gray.600">{getValue(block.integrationsDescription)}</Text>
          </VStack>
          <VStack spacing={3} align="stretch">
            {Array.isArray(integrations) &&
              integrations.map((integration: any, i: number) => {
                const platformText = integration.platform ? getValue(integration.platform) : integration;
                const requirementText = integration.requirement ? getValue(integration.requirement) : integration;
                return (
                  <Box key={i} p={3} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" color="blue.700">
                      {platformText}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {requirementText}
                    </Text>
                  </Box>
                );
              })}
          </VStack>
        </Card>

        {/* Bancário */}
        <Card
          title={getValue(block.bankingTitle)}
          animated
          borded
        >
          <VStack spacing={2} align="stretch" mb={3}>
            <Text fontSize="xs" color="gray.600">{getValue(block.bankingDescription)}</Text>
          </VStack>
          <VStack spacing={2} align="stretch">
            {Array.isArray(banking) &&
              banking.map((item: any, i: number) => (
                <HStack key={i} spacing={3}>
                  <Icon as={FaCheckCircle} color="green.500" />
                  <Text fontSize="sm">{getValue(item)}</Text>
                </HStack>
              ))}
          </VStack>
        </Card>
      </ContainerDivisions>
    </Container>
  );
}
