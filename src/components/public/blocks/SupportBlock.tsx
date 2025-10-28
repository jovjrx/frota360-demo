import { Text, VStack, Link, Button } from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { Card } from '@/components/Card';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';

interface SupportBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function SupportBlock({ block, t, getArray, getText }: SupportBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const methods = getArray ? getArray(block.items) : (Array.isArray(block.items) ? block.items : []);

  return (
    <Container>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', md: 'repeat(3, 1fr)' }}>
        {Array.isArray(methods) &&
          methods.map((method: any, i: number) => (
            <Card key={i} animated borded>
              <VStack spacing={4} align="center" textAlign="center">
                <Icon as={method.icon} fontSize="3xl" color="green.500" />
                <Text fontSize="sm" color="gray.600">
                  {getValue(method.description)}
                </Text>
                <Link href={method.link} isExternal>
                  <Button colorScheme="green" variant="outline" size="sm">
                    {getValue(method.label)}
                  </Button>
                </Link>
              </VStack>
            </Card>
          ))}
      </ContainerDivisions>
    </Container>
  );
}
