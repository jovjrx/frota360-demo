// src/theme.ts
import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: true,
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
  },
  portugal: {
    green: {
      50:  "#E8F5E8",
      100: "#C6E6C6",
      200: "#9DD49D",
      300: "#74C274",
      400: "#4BB04B",
      500: "#228B22", // verde da bandeira
      600: "#1E7A1E",
      700: "#1A691A",
      800: "#165816",
      900: "#124712",
    },
    red: {
      50:  "#FFF0F0",
      100: "#FFD6D6",
      200: "#FFBABA",
      300: "#FF9E9E",
      400: "#FF8282",
      500: "#DC143C", // vermelho da bandeira
      600: "#C41230",
      700: "#AC1024",
      800: "#940E18",
      900: "#7C0C0C",
    }
  }
};

// Tokens semânticos para alternar claro/escuro com consistência
const semanticTokens = {
  colors: {
    "bg.canvas": { _light: "white", _dark: "gray.900" },
    "bg.soft": { _light: "gray.50", _dark: "gray.900" },
    "bg.muted": { _light: "gray.100", _dark: "whiteAlpha.200" },
    "text.body": { _light: "gray.800", _dark: "whiteAlpha.900" },
    "text.muted": { _light: "gray.600", _dark: "gray.300" },
    "border.subtle": { _light: "blackAlpha.100", _dark: "whiteAlpha.200" },
    "ring.brand": { _light: "brand.500", _dark: "brand.300" },
  },
  radii: {
    "xl2": "1rem",
  },
  shadows: {
    "soft": { _light: "sm", _dark: "sm" },
  },
};

export const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  fonts: {
    heading: "var(--font-rubik)",
    body: "var(--font-rubik)",
  },
  styles: {
    global: {
      "html, body": {
        bg: "bg.canvas",
        color: "text.body",
      },
      "::selection": {
        bg: "brand.500",
        color: "white",
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        maxW: "6xl",
        px: { base: 4, md: 6 },
      },
    },
    Heading: {
      baseStyle: {
        letterSpacing: "-0.01em",
      },
    },
    Text: {
      baseStyle: {
        color: "text.body",
      },
    },
    Link: {
      baseStyle: {
        color: "brand.500",
        _hover: { textDecoration: "underline" },
        _dark: { color: "brand.300" },
      },
      variants: {
        subtle: {
          color: "text.body",
          _hover: { color: "brand.500", textDecoration: "none" },
          _dark: { _hover: { color: "brand.300" } },
        },
      },
    },
    Button: {
      defaultProps: { colorScheme: "brand" },
      baseStyle: { borderRadius: "lg" },
      variants: {
        outline: {
          borderColor: "border.subtle",
          _hover: { bg: "bg.muted" },
        },
        ghost: {
          _hover: { bg: "bg.muted" },
        },
      },
      sizes: {
        lg: { px: 6, py: 4, fontWeight: 600 },
      },
    },
    Badge: {
      baseStyle: { borderRadius: "full", px: 2 },
      variants: {
        success: { bg: "green.500", color: "white" },
      },
    },
    Tag: {
      baseStyle: {
        rounded: "full",
        fontWeight: "semibold",
        px: 3,
        py: 1,
        backdropFilter: "blur(6px)",
        borderWidth: { base: "0", _dark: "1px" },
        borderColor: { _dark: "whiteAlpha.300" },
      },
    },
    Card: {
      baseStyle: {
        container: { borderRadius: "xl", boxShadow: "soft", bg: "white", _dark: { bg: "gray.800" } },
      },
    },
    Divider: {
      baseStyle: { borderColor: "border.subtle" },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            _selected: { borderColor: "brand.500", color: "brand.500" },
          },
          tabpanel: { px: 0 },
        },
      },
      defaultProps: { colorScheme: "brand" },
    },
    Accordion: {
      baseStyle: {
        container: {
          border: "none",
        },
        button: {
          bg: { _light: "white", _dark: "gray.800" },
          borderRadius: "md",
          boxShadow: "sm",
          _hover: { bg: "bg.muted" },
          px: 4,
          py: 3,
        },
        panel: {
          bg: { _light: "white", _dark: "gray.800" },
          borderRadius: "md",
          mt: 2,
          px: 4,
          py: 3,
          boxShadow: "sm",
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: { bg: { _light: "white", _dark: "gray.800" } },
      },
    },
    Input: {
      defaultProps: { focusBorderColor: "brand.500" },
      variants: {
        outline: {
          field: {
            _focusVisible: {
              boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
            },
          },
        },
      },
    },
    Select: { defaultProps: { focusBorderColor: "brand.500" } },
    Textarea: { defaultProps: { focusBorderColor: "brand.500" } },
    Checkbox: { defaultProps: { colorScheme: "brand" } },
    Switch: { defaultProps: { colorScheme: "brand" } },
    Progress: { defaultProps: { colorScheme: "brand" } },
    Skeleton: {
      baseStyle: {
        startColor: { _light: "gray.100", _dark: "whiteAlpha.200" },
        endColor: { _light: "gray.200", _dark: "whiteAlpha.300" },
      },
    },
  },
});
