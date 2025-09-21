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
  Badge,
  Divider,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { FiUser, FiLogOut, FiUsers, FiDollarSign, FiSettings, FiMail, FiPhone, FiUserCheck } from "react-icons/fi";

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
              h='64px'
              w='160px'
            />
          </Link>

          <HStack spacing={2} display={{ base: "none", md: "flex" }}>
            {items.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </HStack>

          <HStack spacing={4}>
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Desktop: Login/User Menu */}
            <HStack spacing={2} display={{ base: "none", md: "flex" }}>
              {user ? (
                <Popover placement="bottom-end">
                  <PopoverTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Avatar size="sm" name={userData?.name || user.displayName || user.email} />}
                      rightIcon={<ChevronDownIcon />}
                      _hover={{ bg: "gray.100" }}
                    >
                      <Text display={{ base: "none", lg: "block" }}>
                        {userData?.name || user.displayName || user.email}
                      </Text>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent w="280px" shadow="xl" border="none" borderRadius="lg">
                    <PopoverBody p={0}>
                      <VStack spacing={0} align="stretch">
                        {/* User Info Header */}
                        <Box p={4} bg="gray.50" borderRadius="lg 0 0 0">
                          <HStack spacing={3}>
                            <Avatar 
                              size="md" 
                              name={userData?.name || user.displayName || user.email}
                              bg={isAdmin ? "blue.500" : "green.500"}
                            />
                            <VStack align="flex-start" spacing={1} flex={1}>
                              <Text fontWeight="bold" fontSize="sm">
                                {userData?.name || user.displayName || user.email}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {userData?.email || user.email}
                              </Text>
                              <Badge 
                                size="sm" 
                                colorScheme={isAdmin ? "red" : "green"}
                              >
                                {isAdmin ? "Administrador" : "Motorista"}
                              </Badge>
                            </VStack>
                          </HStack>
                        </Box>

                        <Divider />

                        {/* Menu Items */}
                        <VStack spacing={0} align="stretch">
                          <Button
                            variant="ghost"
                            size="sm"
                            justifyContent="flex-start"
                            leftIcon={<FiUser />}
                            onClick={() => {
                              router.push(isAdmin ? '/admin' : '/drivers');
                            }}
                            borderRadius="0"
                            _hover={{ bg: "gray.100" }}
                          >
                            Painel
                          </Button>
                          
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                justifyContent="flex-start"
                                leftIcon={<FiUsers />}
                                onClick={() => router.push('/admin/drivers')}
                                borderRadius="0"
                                _hover={{ bg: "gray.100" }}
                              >
                                Motoristas
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                justifyContent="flex-start"
                                leftIcon={<FiUserCheck />}
                                onClick={() => router.push('/admin/users')}
                                borderRadius="0"
                                _hover={{ bg: "gray.100" }}
                              >
                                Usuários
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                justifyContent="flex-start"
                                leftIcon={<FiDollarSign />}
                                onClick={() => router.push('/admin/payouts')}
                                borderRadius="0"
                                _hover={{ bg: "gray.100" }}
                              >
                                Pagamentos
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                justifyContent="flex-start"
                                leftIcon={<FiSettings />}
                                onClick={() => router.push('/admin/plans')}
                                borderRadius="0"
                                _hover={{ bg: "gray.100" }}
                              >
                                Planos
                              </Button>
                            </>
                          )}
                        </VStack>

                        <Divider />

                        {/* Logout */}
                        <Button
                          variant="ghost"
                          size="sm"
                          justifyContent="flex-start"
                          leftIcon={<FiLogOut />}
                          onClick={handleLogout}
                          borderRadius="0 0 lg lg"
                          color="red.500"
                          _hover={{ bg: "red.50" }}
                        >
                          Sair
                        </Button>
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
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
