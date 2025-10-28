import { VStack, Heading, Divider, SimpleGrid, FormControl, FormLabel, Select, Input, Text, Box } from '@chakra-ui/react';
import { SiteSettings } from '@/types/site-settings';

interface ColorsTabProps {
  settings: SiteSettings;
  updateColors: (field: keyof SiteSettings['colors'], value: string) => void;
  setSettings?: React.Dispatch<React.SetStateAction<SiteSettings | null>>;
}

const CHAKRA_COLORS = [
  { name: 'Gray', value: 'gray', shades: [500, 600, 700] },
  { name: 'Red', value: 'red', shades: [500, 600, 700] },
  { name: 'Orange', value: 'orange', shades: [500, 600, 700] },
  { name: 'Yellow', value: 'yellow', shades: [500, 600, 700] },
  { name: 'Green', value: 'green', shades: [500, 600, 700] },
  { name: 'Teal', value: 'teal', shades: [500, 600, 700] },
  { name: 'Blue', value: 'blue', shades: [500, 600, 700] },
  { name: 'Cyan', value: 'cyan', shades: [500, 600, 700] },
  { name: 'Purple', value: 'purple', shades: [500, 600, 700] },
  { name: 'Pink', value: 'pink', shades: [500, 600, 700] },
];

export function ColorsTab({ settings, updateColors, setSettings }: ColorsTabProps) {
  // Extrair cor e shade do formato "blue.500"
  const parseColorToken = (token: string) => {
    const parts = token.split('.');
    return { color: parts[0] || 'gray', shade: parts[1] || '500' };
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Cores do Tema</Heading>
      <Divider />

      <Heading size="sm">Cores Principais (Chakra UI)</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Cor Principal</FormLabel>
          <Select
            value={settings.colors.primary || 'blue.500'}
            onChange={(e) => updateColors('primary', e.target.value)}
          >
            {CHAKRA_COLORS.map(({ name, value, shades }) =>
              shades.map(shade => (
                <option key={`${value}.${shade}`} value={`${value}.${shade}`}>
                  {name} {shade}
                </option>
              ))
            )}
          </Select>
          <Box
            mt={2}
            w="full"
            h="40px"
            borderRadius="md"
            bg={`${parseColorToken(settings.colors.primary || 'blue.500').color}.${parseColorToken(settings.colors.primary || 'blue.500').shade}`}
            borderWidth="1px"
            borderColor="gray.300"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Cor Secundária</FormLabel>
          <Select
            value={settings.colors.secondary || 'gray.500'}
            onChange={(e) => updateColors('secondary', e.target.value)}
          >
            {CHAKRA_COLORS.map(({ name, value, shades }) =>
              shades.map(shade => (
                <option key={`${value}.${shade}`} value={`${value}.${shade}`}>
                  {name} {shade}
                </option>
              ))
            )}
          </Select>
          <Box
            mt={2}
            w="full"
            h="40px"
            borderRadius="md"
            bg={`${parseColorToken(settings.colors.secondary || 'gray.500').color}.${parseColorToken(settings.colors.secondary || 'gray.500').shade}`}
            borderWidth="1px"
            borderColor="gray.300"
          />
        </FormControl>
      </SimpleGrid>

      <Divider />
      
      <Heading size="sm">Paleta Completa de Cores (Brand)</Heading>
      <Text fontSize="sm" color="gray.600">
        Defina a paleta completa de cores para a marca (todos os tons)
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
          <FormControl key={shade}>
            <FormLabel>Brand {shade}</FormLabel>
            <Input
              type="color"
              value={settings.colors.brand?.[shade as keyof typeof settings.colors.brand] || '#000000'}
              onChange={(e) => {
                if (!setSettings) return;
                setSettings(prev => prev ? {
                  ...prev,
                  colors: {
                    ...prev.colors,
                    brand: {
                      ...(prev.colors.brand || {} as any),
                      [shade]: e.target.value
                    }
                  }
                } as SiteSettings : null);
              }}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {settings.colors.brand?.[shade as keyof typeof settings.colors.brand] || '#000000'}
            </Text>
          </FormControl>
        ))}
      </SimpleGrid>
    </VStack>
  );
}

