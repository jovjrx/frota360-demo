import NextLink from 'next/link';
import { Text, VStack, Button } from '@chakra-ui/react';
import { ArrowRightIcon } from '@chakra-ui/icons';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';
import { Card } from '@/components/Card';
import { useLocalizedHref } from '@/lib/linkUtils';
import { useFacebookTracking } from '@/hooks/useFacebookTracking';

interface ServicesBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getText?: (value: any) => string;
}

export function ServicesBlock({ block, t, getText }: ServicesBlockProps) {
  const getLocalizedHref = useLocalizedHref();
  const { trackCheckoutStart } = useFacebookTracking();
  const getValue = (value: any) => getText ? getText(value) : t(value);

  return (
    <Container softBg>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', md: 'repeat(2, 1fr)' }}>
        {Array.isArray(block.services) &&
          block.services.map((service: any, i: number) => (
            <Card key={i} animated borded img={service.image} color={service.color}>
              <VStack spacing={4} align="start">
                <Text fontSize="xl" fontWeight="bold" color={`${service.color}.600`}>
                  {getValue(service.title)}
                </Text>
                <Text color="gray.600">{getValue(service.description)}</Text>
                <Button
                  as={NextLink}
                  href={getLocalizedHref(service.buttonLink)}
                  colorScheme={service.color}
                  size="sm"
                  rightIcon={<ArrowRightIcon />}
                  onClick={() => trackCheckoutStart(`Driver Application - ${getValue(service.title)}`)}
                >
                  {getValue(service.buttonText)}
                </Button>
              </VStack>
            </Card>
          ))}
      </ContainerDivisions>
    </Container>
  );
}

