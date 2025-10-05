import { useState, useMemo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { LanguageSelector } from "./Language";
import { useAuth } from "@/lib/auth";
import { useLocalizedHref } from "@/lib/linkUtils";
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
import { FiUser, FiLogOut, FiUsers, FiDollarSign, FiSettings, FiMail, FiPhone, FiUserCheck, FiFileText, FiTrendingUp, FiUpload, FiEdit, FiTruck, FiActivity, FiWifi, FiBarChart2 } from "react-icons/fi";

interface HeaderProps {
  t: (key: string) => string;
}

export default function Header({ t }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut, isAdmin, userData } = useAuth();
  const router = useRouter();
  const getLocalizedHref = useLocalizedHref();

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
      { href: getLocalizedHref("/"), label: t("navigation.home") },
      { href: getLocalizedHref("/services/drivers"), label: t("navigation.drivers") },
      { href: getLocalizedHref("/about"), label: t("navigation.about") },
      { href: getLocalizedHref("/contact"), label: t("navigation.contact") }
    ],
    [t, getLocalizedHref]
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
                      leftIcon={<Icon as={FiUser} boxSize={5} />}
                      rightIcon={<ChevronDownIcon />}
                      _hover={{ bg: "gray.100" }}
                    >
                      <Text display={{ base: "none", lg: "block" }}>
                        Menu
                      </Text>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent w="320px" shadow="2xl" border="1px" borderColor="gray.200" borderRadius="xl" bg="white">
                    <PopoverBody p={0}>
                      <VStack spacing={0} align="stretch">
                        {/* User Info Header */}
                        <Box p={6} bg="gradient-to-r" bgGradient="linear(to-r, blue.50, purple.50)" borderRadius="xl 0 0 0">
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
                              {userData?.name || user.displayName || user.email}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {userData?.email || user.email}
                            </Text>

                          </VStack>

                        </Box>

                        <Divider />

                        {/* Menu Items */}
                        <VStack spacing={1} align="stretch" p={2}>
                          <Button
                            variant="ghost"
                            size="md"
                            justifyContent="flex-start"
                            leftIcon={<FiUser />}
                            onClick={() => {
                              router.push(isAdmin ? '/admin' : '/drivers');
                            }}
                            borderRadius="lg"
                            _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                            transition="all 0.2s"
                            h="48px"
                            px={4}
                          >
                            <Text fontWeight="medium">Painel</Text>
                          </Button>

                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiUserCheck />}
                                onClick={() => router.push('/admin/requests')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Solicitações</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiUsers />}
                                onClick={() => router.push('/admin/drivers-weekly')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Controle Semanal</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiTruck />}
                                onClick={() => router.push('/admin/fleet')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Controle da Frota</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiBarChart2 />}
                                onClick={() => router.push('/admin/metrics')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Métricas</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiWifi />}
                                onClick={() => router.push('/admin/integrations')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Integrações</Text>
                              </Button>
                            </>
                          )}

                          {!isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiUser />}
                                onClick={() => router.push('/drivers/profile')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Meu Perfil</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiFileText />}
                                onClick={() => router.push('/drivers/documents')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Documentos</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiDollarSign />}
                                onClick={() => router.push('/drivers/payments')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Pagamentos</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                size="md"
                                justifyContent="flex-start"
                                leftIcon={<FiTrendingUp />}
                                onClick={() => router.push('/drivers/analytics')}
                                borderRadius="lg"
                                _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                transition="all 0.2s"
                                h="48px"
                                px={4}
                              >
                                <Text fontWeight="medium">Relatórios</Text>
                              </Button>
                            </>
                          )}
                        </VStack>

                        <Divider />

                        {/* Logout */}
                        <Box p={2}>
                          <Button
                            variant="ghost"
                            size="md"
                            justifyContent="flex-start"
                            leftIcon={<FiLogOut />}
                            onClick={handleLogout}
                            borderRadius="lg"
                            color="red.500"
                            _hover={{ bg: "red.50", transform: "translateX(4px)" }}
                            transition="all 0.2s"
                            h="48px"
                            px={4}
                            w="full"
                          >
                            <Text fontWeight="medium">Sair</Text>
                          </Button>
                        </Box>
                      </VStack>
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
