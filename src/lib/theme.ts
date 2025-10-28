// src/theme.ts
import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
  disableTransitionOnChange: true
};

// Paleta "brand" - Cores dinâmicas do JSON (src/demo/siteSettings/global.json)
// Por padrão: purple, mas pode ser alterado via admin
const colors = {
  brand: {
    50:  "#F3E8FF", // purple claro
    100: "#E9D5FF",
    200: "#D8B4FE",
    300: "#C084FC",
    400: "#A855F7",
    500: "#9333EA", // purple principal
    600: "#7E22CE",
    700: "#6B21A8",
    800: "#581C87",
    900: "#4C1D95", // purple escuro
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

