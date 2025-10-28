import { Icon, Text, VStack, Box, SimpleGrid } from '@chakra-ui/react';
import { Container } from '@/components/Container';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';

interface ValueCardsBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function ValueCardsBlock({ block, t, getArray, getText }: ValueCardsBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const items = getArray ? getArray(block.items) : (Array.isArray(block.items) ? block.items : []);

  return (
    <Container>
      {block.title && (
        <Title
          title={getValue(block.title)}
          description={getValue(block.subtitle)}
          feature={getValue(block.feature)}
        />
      )}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 8 }}>
        {Array.isArray(items) &&
          items.map((item: any, i: number) => (
            <Card key={i} animated borded>
              <VStack spacing={4} align="center" textAlign="center">
                <Box
                  p={4}
                  borderRadius="full"
                  bg={`${item.color || 'green'}.100`}
                  color={`${item.color || 'green'}.600`}
                >
                  <Icon as={item.icon} boxSize={8} />
                </Box>
                <Text fontSize="xl" fontWeight="bold">
                  {getValue(item.title)}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {getValue(item.description)}
                </Text>
              </VStack>
            </Card>
          ))}
      </SimpleGrid>
    </Container>
  );
}
