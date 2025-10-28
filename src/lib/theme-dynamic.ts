/**
 * Cria tema dinâmico com cores do site-settings
 * Esse tema é usado para aplicar as cores personalizadas
 */
import { extendTheme, ThemeConfig } from '@chakra-ui/react';

// Cores padrão (podem ser sobrescritas pelo site-settings)
const defaultColors = {
  brand: {
    50: '#F3E8FF',
    100: '#E9D5FF',
    200: '#D8B4FE',
    300: '#C084FC',
    400: '#A855F7',
    500: '#9333EA',
    600: '#7E22CE',
    700: '#6B21A8',
    800: '#581C87',
    900: '#4C1D95',
  },
  admin: {
    50: '#EBF8FF',
    100: '#BEE3F8',
    200: '#90CDF4',
    300: '#63B3ED',
    400: '#4299E1',
    500: '#3182CE',
    600: '#2B77CB',
    700: '#2C5282',
    800: '#2C5282',
    900: '#1A365D',
  },
  driver: {
    50: '#EDF2F7',
    100: '#E2E8F0',
    200: '#CBD5E0',
    300: '#A0AEC0',
    400: '#718096',
    500: '#4A5568',
    600: '#2D3748',
    700: '#1A202C',
    800: '#171923',
    900: '#0F1419',
  },
};

export function createDynamicTheme() {
  const config: ThemeConfig = {
    initialColorMode: 'light',
    useSystemColorMode: false,
    disableTransitionOnChange: true,
  };

  return extendTheme({
    config,
    colors: defaultColors,
    fonts: {
      heading: 'var(--font-rubik)',
      body: 'var(--font-rubik)',
    },
    components: {
      Container: {
        baseStyle: {
          maxW: '6xl',
          px: { base: 4, md: 6 },
        },
      },
      Input: {
        defaultProps: {
          focusBorderColor: 'admin.700',
        },
      },
      Select: {
        defaultProps: {
          focusBorderColor: 'admin.700',
        },
      },
      Textarea: {
        defaultProps: {
          focusBorderColor: 'admin.700',
        },
      },
      Checkbox: {
        defaultProps: {
          colorScheme: 'admin',
        },
      },
      Switch: {
        defaultProps: {
          colorScheme: 'admin',
        },
      },
      Progress: {
        defaultProps: {
          colorScheme: 'admin',
        },
      },
    },
  });
}

