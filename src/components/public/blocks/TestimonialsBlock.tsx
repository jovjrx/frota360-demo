import { Text, VStack, HStack } from '@chakra-ui/react';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';

interface TestimonialsBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function TestimonialsBlock({ block, t, getArray, getText }: TestimonialsBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const testimonials = getArray ? getArray(block.items) : (Array.isArray(block.items) ? block.items : []);

  return (
    <Container softBg>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', md: 'repeat(2, 1fr)' }}>
        {Array.isArray(testimonials) &&
          testimonials.map((testimonial: any, i: number) => (
            <Card key={i} animated borded>
              <VStack spacing={4} align="start">
                <Text fontSize="lg" fontStyle="italic" color="gray.700">
                  "{getValue(testimonial.text)}"
                </Text>
                <HStack>
                  <Text fontWeight="bold" color="green.600">
                    {testimonial.name}
                  </Text>
                  {testimonial.rating && (
                    <Text color="gray.500">{'★'.repeat(testimonial.rating)}</Text>
                  )}
                </HStack>
              </VStack>
            </Card>
          ))}
      </ContainerDivisions>
    </Container>
  );
}

