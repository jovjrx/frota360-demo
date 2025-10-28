import { useState, useMemo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { LanguageSelector } from "../providers/Language";
import { useAuth } from "@/components/providers/Auth";
import { useLocalizedHref } from "@/lib/linkUtils";
import { useSiteBranding } from "@/hooks/useSiteBranding";
import {
  Box,
  Container,
  Flex,
  HStack,
  IconButton,
  Link,
  Collapse,
  Image,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { FiUser, FiLogOut, FiUsers, FiDollarSign, FiSettings, FiMail, FiPhone, FiUserCheck, FiFileText, FiTrendingUp, FiUpload, FiEdit, FiTruck, FiActivity, FiWifi, FiBarChart2, FiHome } from "react-icons/fi";
import { getAllMenuItems, hasSubmenu } from "@/config/adminMenu";
import { getPublicMenuItems } from "@/config/publicMenu";
import { getDashboardMenuItems } from "@/config/dashboardMenu";
import { WrapperLayout } from "./WrapperLayout";

interface HeaderProps {
  t: (key: string) => string;
  tPage?: (key: string) => string;
  panel: boolean;
  serverUser?: {
    uid: string;
    email: string;
    displayName: string | null;
    role: 'admin' | 'driver';
  } | null;
}

export default function Header({ t, tPage, panel = false, serverUser }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user: clientUser, signOut, isAdmin: clientIsAdmin, userData: clientUserData } = useAuth();
  const router = useRouter();
  const getLocalizedHref = useLocalizedHref();
  const branding = useSiteBranding();

  // Usar dados do servidor se disponíveis (SSR), caso contrário usar do client (useAuth)
  const user = serverUser || clientUser;
  const isAdmin = serverUser ? serverUser.role === 'admin' : clientIsAdmin;
  const userData = serverUser ? {
    name: serverUser.displayName || serverUser.email,
    email: serverUser.email,
    role: serverUser.role,
  } : clientUserData;

  // Função helper para traduzir menu items
  // Tenta usar tPage (admin/dashboard) primeiro, depois fallback para t (common)
  const translateMenu = (key: string, fallback?: string) => {
    if (tPage) {
      const translated = tPage(key);
      if (translated && translated !== key) return translated;
    }
    return t(key) || fallback || key;
  };

  const isActive = (path: string) => router.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };


  const publicMenuItems = useMemo(
    () =>
      getPublicMenuItems().map((item) => ({
        id: item.id,
        href: item.external ? item.href : getLocalizedHref(item.href),
        label: t(item.translationKey),
        external: item.external ?? false,
        activePath: item.href,
      })),
    [t, getLocalizedHref]
  );

  const allMenuItems = getAllMenuItems();
  const dashboardMenuItems = getDashboardMenuItems();

  const NavLink = ({ href, label, external, activePath }: { href: string; label: string; external?: boolean; activePath?: string }) => (
    <Button
      as={external ? "a" : NextLink}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      variant={!external && activePath && isActive(activePath) ? "solid" : "ghost"}
      fontSize="sm"
      fontWeight="medium"
      onClick={() => {
        setOpen(false); // Fechar menu mobile
      }}
    >
      {label}
    </Button>
  );

  const UserArea = ({ mobile = false }) => <VStack spacing={2} align="stretch">
    <Box p={4} bg="gradient-to-r" bgGradient="linear(to-r, blue.50, purple.50)" rounded={'lg'}>
      <Badge
        size="md"
        colorScheme={isAdmin ? "blue" : "green"}
        borderRadius="full"
        px={3}
        py={1}
        mb={4}
      >
        {isAdmin ? "Administrador" : "Motorista"}
      </Badge>
      <VStack align="flex-start" spacing={1} flex={1}>
        <Text fontWeight="bold" fontSize="md" color="gray.800">
          {infoUser?.name || infoUser?.displayName || infoUser?.email}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {infoUser?.email}
        </Text>

      </VStack>
    </Box>
    <VStack spacing={1} p={4} px={mobile ? 0 : 4} pt={1} align="stretch" justify="center">
      <Button
        variant="ghost"
        size="md"
        justifyContent="flex-start"
        leftIcon={<Icon as={dashboardMenuItems?.[0]?.icon} />}
        onClick={() => router.push(isAdmin ? '/admin' : '/dashboard')}
        borderRadius="lg"

        transition="all 0.2s"
        h="48px"
        px={4}
      >
        <Text fontWeight="medium">Painel</Text>
      </Button>

      <Button
        variant="ghost"
        size="md"
        justifyContent="flex-start"
        leftIcon={<FiLogOut />}
        onClick={handleLogout}
        borderRadius="lg"
        colorScheme="red"

        transition="all 0.2s"
        h="48px"
        px={4}

      >
        <Text fontWeight="medium">Sair</Text>
      </Button>
    </VStack>
  </VStack>;

  const infoUser: any = userData || user;

  return (
    <Box as="header" borderBottomWidth="0" shadow="sm" position={'relative'} top={0} zIndex={900} bg="white" >
      <WrapperLayout panel={panel} py={2}>
        <Flex align="center" justify="space-between" gap={4}>
          <Link as={NextLink} href="/" _hover={{ opacity: 0.9 }}>
              <Image
              src={branding.logo}
              alt="Frota360.pt"
              h='64px'
              w='160px'
            />
          </Link>

          <HStack spacing={2} display={{ base: "none", md: "flex" }}>
            {publicMenuItems.map((item) => (
              <NavLink key={item.id} href={item.href} label={item.label} external={item.external} activePath={item.activePath} />
            ))}
          </HStack>

          <HStack spacing={4}>
            {/* Language Selector */}
            <LanguageSelector />

            {/* Desktop: Login/User Menu */}
            <HStack spacing={2} display={{ base: "none", md: "flex" }}>
              {infoUser ? (
                <Popover placement="bottom-end">
                  <PopoverTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Icon as={FiUser} boxSize={5} />}
                      rightIcon={<ChevronDownIcon />}
                      _hover={{ bg: "gray.100" }}
                    >
                      <Text display={{ base: "none", lg: "block" }}>
                        {infoUser?.name || infoUser?.displayName || infoUser?.email}
                      </Text>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent w="320px" shadow="2xl" border="1px" borderColor="gray.200" borderRadius="xl" bg="white">
                    <PopoverBody p={0}>
                      <UserArea />
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              ) : (
                <>
                  <Button as={NextLink} href="/login" variant="ghost" size="sm">
                    Entrar
                  </Button>
                </>
              )}
            </HStack>

            <IconButton
              aria-label="Abrir menu"
              icon={open ? <CloseIcon boxSize={4} /> : <HamburgerIcon boxSize={6} />}
              display={{ base: "inline-flex", md: "none" }}
              variant="ghost"
              onClick={() => {
                setOpen((s) => !s);
              }}
            />
          </HStack>
        </Flex>
      </WrapperLayout>
      <Collapse in={open} animateOpacity>
        <Box
          display={{ md: "none" }}
          borderTop="1px solid" borderColor="blackAlpha.300"
        >
          <Container maxW="6xl" py={4}>
            <Flex direction="column" gap={3}>
              {publicMenuItems.map((item) => (
                <NavLink key={item.id} href={item.href} label={item.label} external={item.external} activePath={item.activePath} />
              ))}

              {/* Mobile Login/Logout */}
              <Box pt={3} borderTop="1px solid" borderColor="gray.200">
                {infoUser ? (
                  <UserArea mobile />
                ) : (
                  <VStack spacing={2}>
                    <Button as={NextLink} href="/login" variant="ghost" size="sm" w="full">
                      Entrar
                    </Button>
                  </VStack>
                )}
              </Box>
            </Flex>
          </Container>
        </Box>
      </Collapse>
    </Box>
  );
}

