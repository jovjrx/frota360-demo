import { Text, VStack, HStack } from '@chakra-ui/react';
import { Avatar, Badge } from '@chakra-ui/react';
import { Card } from '@/components/Card';
import { Container } from '@/components/Container';
import { ContainerDivisions } from '@/components/ContainerDivisions';
import { Title } from '@/components/Title';

interface TeamBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function TeamBlock({ block, t, getArray, getText }: TeamBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const members = getArray ? getArray(block.items) : (Array.isArray(block.items) ? block.items : []);

  return (
    <Container>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <ContainerDivisions template={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}>
        {Array.isArray(members) &&
          members.map((member: any, i: number) => (
            <Card key={i} animated borded>
              <VStack spacing={4} align="center" textAlign="center">
                <Avatar size="xl" name={member.name} src={member.photo} bg="green.500" color="white" />
                <VStack spacing={1}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {member.name}
                  </Text>
                  <Badge colorScheme="green" variant="subtle">
                    {getValue(member.position)}
                  </Badge>
                </VStack>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  {getValue(member.bio)}
                </Text>
                {member.expertise && (
                  <HStack spacing={2}>
                    {member.expertise.map((skill: any, idx: number) => (
                      <Badge key={idx} size="sm" colorScheme="gray" variant="outline">
                        {getValue(skill)}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </VStack>
            </Card>
          ))}
      </ContainerDivisions>
    </Container>
  );
}

