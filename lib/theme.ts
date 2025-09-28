// src/theme.ts
import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
  disableTransitionOnChange: true
};

// Paleta "brand" (verde Portugal). 500 é o tom principal.
const colors = {
  brand: {
    50:  "#E8F5E8",
    100: "#C6E6C6",
    200: "#9DD49D",
    300: "#74C274",
    400: "#4BB04B",
    500: "#228B22", // verde principal da bandeira portuguesa
    600: "#1E7A1E",
    700: "#1A691A",
    800: "#165816",
    900: "#124712",
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
