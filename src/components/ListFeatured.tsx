import { Badge, HStack, Text } from "@chakra-ui/react";

export const ListFeatured = (features: any) => {
    if (!Array.isArray(features)) return null;
    return features.map((feature: string, i: number) => (
      <HStack key={i} spacing={3}>
        <Badge colorScheme="green" variant="solid" borderRadius="full" w={6} h={6} display="flex" alignItems="center" justifyContent="center" fontSize="xs">
          ✓
        </Badge>
        <Text>{feature}</Text>
      </HStack>
    ));
  };

