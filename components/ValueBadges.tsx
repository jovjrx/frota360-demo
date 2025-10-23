import { HStack, Badge, Icon } from '@chakra-ui/react';
import { FiCheckCircle } from 'react-icons/fi';

interface ValueBadge {
  text: string;
  colorScheme?: string;
}

interface ValueBadgesProps {
  badges: ValueBadge[];
}

export function ValueBadges({ badges }: ValueBadgesProps) {
  return (
    <HStack
      spacing={{ base: 2, md: 3 }}
      flexWrap="wrap"
      justify={{ base: 'center', md: 'flex-start' }}
      mt={4}
    >
      {badges.map((badge, index) => (
        <Badge
          key={index}
          colorScheme={badge.colorScheme || 'green'}
          fontSize={{ base: 'xs', md: 'sm' }}
          px={{ base: 3, md: 4 }}
          py={{ base: 1.5, md: 2 }}
          borderRadius="full"
          display="flex"
          alignItems="center"
          gap={2}
          fontWeight="semibold"
          textTransform="none"
        >
          <Icon as={FiCheckCircle} boxSize={{ base: 3, md: 4 }} />
          {badge.text}
        </Badge>
      ))}
    </HStack>
  );
}
