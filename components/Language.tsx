// components/Language.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { GB, PT, IT, FR, ES, DE } from "country-flag-icons/react/3x2";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Box,
  Text,
  Portal,
  Spinner,
  Stack,
  Fade,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: React.ComponentType<any>;
};

export const languages: Language[] = [
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: PT },
  { code: "en", name: "English", nativeName: "English", flag: GB }
];

type ChangeOpts = {
  message?: string;
  forceReload?: boolean; // se precisar forçar reload completo
};

type LanguageContextValue = {
  locale: string;
  setLocale: (code: string, opts?: ChangeOpts) => Promise<void>;
  isChanging: boolean;
  message?: string;
  languages: Language[];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

/** Overlay de loading mostrado durante troca de idioma */
function LanguageLoader({ open, message }: { open: boolean; message?: string }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardShadow = useColorModeValue("xl", "dark-lg");

  return (
    <Portal>
      <Fade in={open} unmountOnExit>
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={2000}
          aria-live="polite"
          aria-busy={open}
        >
          <Stack
            align="center"
            spacing={3}
            bg={cardBg}
            px={6}
            py={5}
            rounded="xl"
            boxShadow={cardShadow}
            borderTop="4px solid"
            borderColor="brand.500"
          >
            <Spinner thickness="3px" speed="0.6s" size="lg" />
            <Text fontWeight="semibold">{message || "Carregando..."}</Text>
            <Text fontSize="sm" color="gray.500">
              Isso pode levar apenas alguns segundos.
            </Text>
          </Stack>
        </Box>
      </Fade>
    </Portal>
  );
}

/** Provider que sincroniza com o i18n do Next (Page Router) */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<string>(router.locale || "pt");
  const [isChanging, setChanging] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  // Detectar idioma automaticamente na primeira visita
  useEffect(() => {
    const initializeLanguage = () => {
      // Verificar se já foi inicializado
      if (localStorage.getItem('alvorada-locale-initialized')) {
        return;
      }

      try {
        // Detectar idioma do navegador
        const browserLang = navigator.language || navigator.languages?.[0] || '';
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        // Verificar se é suportado
        if (languages.some(l => l.code === langCode)) {
          setLocaleState(langCode);
          localStorage.setItem('alvorada-locale', langCode);
          
          // Atualizar URL se necessário
          if (router.locale !== langCode) {
            router.push(router.pathname, router.asPath, { locale: langCode });
          }
        }
        
        // Marcar como inicializado
        localStorage.setItem('alvorada-locale-initialized', 'true');
      } catch (error) {
        console.warn('Erro ao detectar idioma:', error);
      }
    };

    initializeLanguage();
  }, [router.pathname]);

  // mantém estado em sincronia caso o Next atualize locale externamente
  useEffect(() => {
    if (router.locale && router.locale !== locale) {
      setLocaleState(router.locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.locale]);

  const setLocale = useCallback(
    async (code: string, opts?: ChangeOpts) => {
      if (!code || code === locale) return;
      setMessage(opts?.message || `Alterando para ${languages.find((l) => l.code === code)?.nativeName || code}...`);
      setChanging(true);

      try {
        // Salvar preferência no localStorage
        localStorage.setItem('alvorada-locale', code);
        
        // Navega para a MESMA rota, mas com outro locale
        await router.push(router.asPath, router.asPath, { locale: code });
        // Next baixa o JSON da página SSG/SSR para o novo locale e re-renderiza.
        if (opts?.forceReload) {
          if (typeof window !== "undefined") window.location.reload();
        } else {
          setLocaleState(code);
        }
      } catch (err) {
        // opcional: logar/telemetria
        // eslint-disable-next-line no-console
        console.error("Erro ao trocar idioma:", err);
      } finally {
        setChanging(false);
        setMessage(undefined);
      }
    },
    [locale, router]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, isChanging, message, languages }),
    [locale, setLocale, isChanging, message]
  );

  return (
    <LanguageContext.Provider value={value}>
      <LanguageLoader open={isChanging} message={message} />
      {children}
    </LanguageContext.Provider>
  );
}

/** Seletor com Chakra Menu + bandeiras */
export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const band = useColorModeValue("orange.500", "orange.300");
  const current = languages.find((l) => l.code === locale) ?? languages[0];

  const handleChange = async (code: string) => {
    await setLocale(code, {
      message: `Alterando para ${languages.find((l) => l.code === code)?.nativeName}...`,
      // forceReload: true, // habilite se preferir recarregar a página inteira
    });
  };

  return (
    <Menu placement="bottom-end" autoSelect={false}>
      <MenuButton
        as={Button}
        variant="ghost"
        px={2}
        py={1}
        aria-label="Selecionar idioma"
        rightIcon={<ChevronDownIcon boxSize={4} />}
      >
        <HStack spacing={2}>
          <Box as={current.flag} boxSize={6} aria-hidden="true" />
          <Text as="span" fontSize="xs" fontWeight="medium">
            {current.code.toUpperCase()}
          </Text>
        </HStack>
      </MenuButton>

      <MenuList minW="12rem" py={2} boxShadow="lg">
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <MenuItem
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              fontWeight={isActive ? "semibold" : "normal"}
              bg={isActive ? "brand.50" : "transparent"}
              _hover={{ bg: isActive ? "brand.100" : "gray.50" }}
            >
              <HStack spacing={2} w="full">
                <Box as={lang.flag} boxSize={4} aria-hidden="true" />
                <Text fontSize="sm">{lang.nativeName}</Text>
                {isActive && (
                  <Text fontSize="xs" color={band} ml="auto">
                    ✓
                  </Text>
                )}
              </HStack>
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
}
