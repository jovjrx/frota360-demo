import { Text, VStack, Box } from '@chakra-ui/react';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';

interface HowItWorksBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function HowItWorksBlock({ block, t, getArray, getText }: HowItWorksBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  
  // Resolver block.steps: pode ser array direto, string chave, ou objeto multilíngua
  let steps: any[] = [];
  if (Array.isArray(block.steps)) {
    steps = block.steps;
  } else if (typeof block.steps === 'string' && block.steps.includes('.')) {
    // É uma chave de tradução
    const stepsValue = t(block.steps);
    if (Array.isArray(stepsValue)) {
      steps = stepsValue;
    } else if (getArray) {
      steps = getArray(block.steps);
    }
  } else if (getArray) {
    steps = getArray(block.steps);
  }

  return (
    <Container softBg>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', md: 'repeat(3, 1fr)' }}>
        {Array.isArray(steps) &&
          steps.map((step: any, i: number) => (
            <Card key={i} animated borded img={step.image || `/img/step-${i + 1}.jpg`}>
              <VStack spacing={4} align="center" textAlign="center">
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="green.500"
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  {i + 1}
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  {getValue(step.title)}
                </Text>
                <Text color="gray.600">{getValue(step.description)}</Text>
              </VStack>
            </Card>
          ))}
      </ContainerDivisions>
    </Container>
  );
}

