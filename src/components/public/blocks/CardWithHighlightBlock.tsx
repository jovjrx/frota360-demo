import { Text, VStack, Box, SimpleGrid } from '@chakra-ui/react';
import { Card } from '@/components/Card';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';
import { Highlight } from '@/components/Highlight';

interface CardWithHighlightBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function CardWithHighlightBlock({ block, t, getArray, getText }: CardWithHighlightBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const values = getArray ? getArray(block.values) : (Array.isArray(block.values) ? block.values : []);
  const stats = getArray ? getArray(block.stats) : (Array.isArray(block.stats) ? block.stats : []);

  return (
    <Container softBg>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', lg: 'repeat(2, 1fr)' }}>
        <Card title={getValue(block.cardTitle)} description={getValue(block.cardDescription)} animated borded>
          <VStack spacing={6} align="stretch">
            <Text fontSize="lg" color="gray.700">
              {getValue(block.cardContent)}
            </Text>
            
            {Array.isArray(values) && values.length > 0 && (
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={2}>
                  {getValue(block.valuesTitle)}
                </Text>
                <VStack spacing={2} align="stretch">
                  {values.map((value: any, i: number) => (
                    <Box key={i} display="flex" alignItems="center">
                      <Box w={2} h={2} bg="green.500" borderRadius="full" mr={3} />
                      <Text>{getValue(value)}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {Array.isArray(stats) && stats.length > 0 && (
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={3}>
                  {getValue(block.statsTitle)}
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  {stats.map((stat: any, i: number) => (
                    <Box
                      key={i}
                      textAlign="center"
                      p={4}
                      bg="green.50"
                      borderRadius="lg"
                      border="1px"
                      borderColor="green.100"
                    >
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {stat.value}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {getValue(stat.label)}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        </Card>

        {block.highlightImage && (
          <Highlight
            title={getValue(block.highlightTitle)}
            description={getValue(block.highlightDescription)}
            bgImage={block.highlightImage}
            overlayPos={block.overlayPos || 'bl'}
            bgSizePersonalized={block.bgSizePersonalized || 'cover'}
            delayImage={block.delayImage || 0.2}
            delayBox={block.delayBox || 0.5}
          />
        )}
      </ContainerDivisions>
    </Container>
  );
}
