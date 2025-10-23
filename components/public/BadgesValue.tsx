import { Box, HStack, Text, Icon, VStack } from '@chakra-ui/react';
import { FiPercent, FiDollarSign, FiCalendar } from 'react-icons/fi';

interface BadgesValueProps {
  t: (key: string, fallback?: string) => string;
}

export default function BadgesValue({ t }: BadgesValueProps) {
  const badges = [
    {
      icon: FiPercent,
      value: t('hero.badges.iva.value', '6% IVA'),
      label: t('hero.badges.iva.label', 'Repasse'),
      color: 'blue',
    },
    {
      icon: FiDollarSign,
      value: t('hero.badges.fee.value', '€25'),
      label: t('hero.badges.fee.label', 'Taxa fixa/semana'),
      color: 'green',
    },
    {
      icon: FiCalendar,
      value: t('hero.badges.payment.value', '2ª feira'),
      label: t('hero.badges.payment.label', 'Pagamentos'),
      color: 'purple',
    },
    {
      icon: FiDollarSign,
      value: t('hero.badges.hidden.value', '€0'),
      label: t('hero.badges.hidden.label', 'Taxas escondidas'),
      color: 'orange',
    },
  ];

  return (
    <HStack
      spacing={{ base: 2, md: 4 }}
      justify="flex-start"
      align="center"
      flexWrap="wrap"
      w="full"
    >
      {badges.map((badge, index) => (
        <Box
          key={index}
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          bg="white"
          borderRadius="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
          transition="all 0.2s"
          _hover={{
            shadow: 'md',
            borderColor: `${badge.color}.300`,
          }}
        >
          <HStack spacing={2}>
            <Icon as={badge.icon} w={4} h={4} color={`${badge.color}.500`} />
            <VStack spacing={0} align="start">
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="bold"
                color="gray.900"
                lineHeight="1.2"
              >
                {badge.value}
              </Text>
              <Text
                fontSize={{ base: '2xs', md: 'xs' }}
                color="gray.600"
                lineHeight="1.2"
              >
                {badge.label}
              </Text>
            </VStack>
          </HStack>
        </Box>
      ))}
    </HStack>
  );
}
