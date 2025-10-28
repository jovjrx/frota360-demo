import { Icon, Text, VStack } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';

interface BenefitsBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getText?: (value: any) => string;
  getArray?: (value: any) => any[];
}

export function BenefitsBlock({ block, t, getText, getArray }: BenefitsBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  
  // Resolver block.items: pode ser array direto, string chave, ou objeto multilíngua
  let benefits: any[] = [];
  if (Array.isArray(block.items)) {
    benefits = block.items;
  } else if (typeof block.items === 'string' && block.items.includes('.')) {
    // É uma chave de tradução, tenta pegar do array ou objeto
    const items = t(block.items);
    if (Array.isArray(items)) {
      benefits = items;
    } else if (getArray) {
      benefits = getArray(block.items);
    }
  } else if (getArray) {
    benefits = getArray(block.items);
  }

  return (
    <Container>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}>
        {benefits.map((benefit: any, i: number) => (
          <Card key={i} animated borded>
            <VStack spacing={4} align="start" h="full">
              <Icon as={CheckIcon} boxSize={6} color="green.600" />
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                {getValue(benefit.title)}
              </Text>
              <Text fontSize="sm" color="gray.600" flex="1">
                {getValue(benefit.description)}
              </Text>
            </VStack>
          </Card>
        ))}
      </ContainerDivisions>
    </Container>
  );
}

