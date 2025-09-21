import { useState, useMemo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { LanguageSelector } from "./Language";
import { useAuth } from "@/lib/auth";
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
  MenuDivider,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { FiUser, FiLogOut } from "react-icons/fi";

interface HeaderProps {
  t: (key: string) => string;
}

export default function Header({ t }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut, isAdmin, userData } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };


  const items = useMemo(
    () => [
      { href: "/", label: t("navigation.home") },
      { href: "/services/drivers", label: t("navigation.drivers") },
      { href: "/services/companies", label: t("navigation.companies") },
      { href: "/about", label: t("navigation.about") },
      { href: "/contact", label: t("navigation.contact") }
    ],
    [t]
  );

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Button
      as={NextLink}
      href={href}
      variant={isActive(href) ? "solid" : "ghost"}
      fontSize="sm"
      fontWeight="medium"
      onClick={() => {
        setOpen(false); // Fechar menu mobile
      }}
    >
      {label}
    </Button>
  );

  const ToolsMenu = () => (
    <Box position="relative">
      <Popover 
        placement="bottom-start" 
        closeOnBlur={true}
        closeOnEsc={true}
      >
        <PopoverTrigger>
          <Button
            variant="ghost"
            fontSize="sm"
            fontWeight="medium"
            rightIcon={<ChevronDownIcon />}
            _hover={{ bg: "gray.100" }}
          >
            {t("navigation.tools")}
          </Button>
        </PopoverTrigger>
        <PopoverContent p={2} shadow="lg" border="none" borderRadius="lg">
          <PopoverBody>
            <VStack align="start" spacing={1}>
              <Button
                as={NextLink}
                href="/tools"
                variant="ghost"
                size="sm"
                w="full"
                justifyContent="start"
                _hover={{ bg: "gray.100" }}
                onClick={() => {
                  setOpen(false); // Fechar menu mobile também
                }}
              >
                {t("tools.management")}
              </Button>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );

  return (
    <Box as="header" borderBottomWidth="0" shadow="sm" position="sticky" top={0} zIndex={900} bg="white" >
      <Container maxW="7xl" p={4}>
        <Flex align="center" justify="space-between" gap={4}>
          <Link as={NextLink} href="/" _hover={{ opacity: 0.9 }}>
            <Image
              src="/img/logo.png"
              alt="Conduz.pt"
              h={{ base: 12, md: 16 }}
              w="auto"
            />
          </Link>

          <HStack spacing={2} display={{ base: "none", md: "flex" }}>
            {items.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </HStack>

          <HStack spacing={4}>
            {/* Desktop: Login/User Menu */}
            <HStack spacing={2} display={{ base: "none", md: "flex" }}>
              {user ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    variant="ghost"
                    leftIcon={<Avatar size="sm" name={user.displayName || user.email} />}
                    rightIcon={<ChevronDownIcon />}
                  >
                    <Text display={{ base: "none", lg: "block" }}>
                      {userData?.name || user.displayName || user.email}
                    </Text>
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<FiUser />} onClick={() => {
                      router.push(isAdmin ? '/admin' : '/drivers');
                    }}>
                      Painel
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                      Sair
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <>
                  <Button as={NextLink} href="/login" variant="ghost" size="sm">
                    Entrar
                  </Button>
                  <Button as={NextLink} href="/signup" colorScheme="red" size="sm">
                    Cadastrar
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
            <LanguageSelector />
          </HStack>
        </Flex>
      </Container>

      {/* Mobile menu */}
      <Collapse in={open} animateOpacity>
        <Box
          display={{ md: "none" }}
          borderTop="1px solid" borderColor="blackAlpha.300"
        >
          <Container maxW="6xl" py={4}>
            <Flex direction="column" gap={3}>
              {items.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
              
              {/* Mobile Login/Logout */}
              <Box pt={3} borderTop="1px solid" borderColor="gray.200">
                {user ? (
                  <VStack spacing={2}>
                    <Text fontSize="sm" color="gray.600">
                      Logado como: {user.displayName || user.email}
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<FiUser />}
                      w="full"
                      onClick={() => {
                        const isAdmin = user?.email?.endsWith('@conduz.pt') || user?.email === 'conduzcontacto@gmail.com';
                        router.push(isAdmin ? '/admin' : '/drivers');
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FiLogOut />}
                      onClick={handleLogout}
                      w="full"
                    >
                      Sair
                    </Button>
                  </VStack>
                ) : (
                  <VStack spacing={2}>
                    <Button as={NextLink} href="/login" variant="ghost" size="sm" w="full">
                      Entrar
                    </Button>
                    <Button as={NextLink} href="/signup" colorScheme="green" size="sm" w="full">
                      Cadastrar
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
