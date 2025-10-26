// src/theme.ts
import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
  disableTransitionOnChange: true
};

// Paleta "brand" (azul Frota360). 500 é o tom principal.
const colors = {
  brand: {
    50:  "#F0F4FF",
    100: "#D9E5FF",
    200: "#B3CBFF",
    300: "#8DB2FF",
    400: "#6799FF",
    500: "#0066FF", // azul principal Frota360
    600: "#0052CC",
    700: "#003D99",
    800: "#002966",
    900: "#001433",
  },
  accent: {
    50:  "#F0FFFE",
    100: "#D9FFFC",
    200: "#B3FFF9",
    300: "#8DFFF5",
    400: "#67FFF1",
    500: "#00D4FF", // ciano Frota360
    600: "#00A8CC",
    700: "#007C99",
    800: "#005066",
    900: "#002433",
  }
};


export const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: "var(--font-rubik)",
    body: "var(--font-rubik)",
  },
  components: {
    Container: {
      baseStyle: {
        maxW: "6xl",
        px: { base: 4, md: 6 },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: "brand.500",
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: "brand.500",
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: "brand.500",
      },
    },
    Checkbox: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
    Switch: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
    Progress: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
  },
});

