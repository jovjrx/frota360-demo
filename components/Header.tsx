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
import { getAllMenuItems } from "@/config/adminMenu";
import { WrapperLayout } from "./layouts/WrapperLayout";

interface HeaderProps {
  t: (key: string) => string;
  panel: boolean;
  serverUser?: {
    uid: string;
    email: string;
    displayName: string | null;
    role: 'admin' | 'driver';
  } | null;
}

export default function Header({ t, panel = false, serverUser }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user: clientUser, signOut, isAdmin: clientIsAdmin, userData: clientUserData } = useAuth();
  const router = useRouter();
  const getLocalizedHref = useLocalizedHref();

  // Usar dados do servidor se disponíveis (SSR), caso contrário usar do client (useAuth)
  const user = serverUser || clientUser;
  const isAdmin = serverUser ? serverUser.role === 'admin' : clientIsAdmin;
  const userData = serverUser ? {
    name: serverUser.displayName || serverUser.email,
    email: serverUser.email,
    role: serverUser.role,
  } : clientUserData;

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


  const allMenuItems = getAllMenuItems();

  return (
    <Box as="header" borderBottomWidth="0" shadow="sm" position={'relative'} top={0} zIndex={900} bg="white" >
      <WrapperLayout panel={panel} py={2}>
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
                        {userData?.name || user.displayName || user.email}
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
                          {isAdmin && allMenuItems?.map((item) => (
                            <Button
                              key={item.id}
                              variant="ghost"
                              size="md"
                              justifyContent="flex-start"
                              leftIcon={<Icon as={item.icon} />}
                              onClick={() => router.push(item.href)}
                              borderRadius="lg"
                              _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                              transition="all 0.2s"
                              h="48px"
                              px={4}
                            >
                              <Text fontWeight="medium">{item.label}</Text>
                            </Button>
                          ))}

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
      </WrapperLayout>

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
                  <VStack spacing={2} align="stretch">
                    <Box p={3} bg="gray.50" borderRadius="md">
                      <Badge
                        colorScheme={isAdmin ? "red" : "green"}
                        mb={2}
                      >
                        {isAdmin ? "Administrador" : "Motorista"}
                      </Badge>
                      <Text fontSize="sm" fontWeight="medium" color="gray.800">
                        {userData?.name || user.displayName || user.email}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {userData?.email || user.email}
                      </Text>
                    </Box>

                    {/* Menu Items Mobile */}
                    {isAdmin ? (
                      <>
                        {allMenuItems?.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            size="sm"
                            justifyContent="flex-start"
                            leftIcon={<Icon as={item.icon} />}
                            onClick={() => {
                              router.push(item.href);
                              setOpen(false);
                            }}
                            w="full"
                          >
                            {item.label}
                          </Button>
                        ))}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          justifyContent="flex-start"
                          leftIcon={<FiUser />}
                          onClick={() => {
                            router.push('/dashboard');
                            setOpen(false);
                          }}
                          w="full"
                        >
                          Dashboard
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          justifyContent="flex-start"
                          leftIcon={<FiFileText />}
                          onClick={() => {
                            router.push('/dashboard/payslips');
                            setOpen(false);
                          }}
                          w="full"
                        >
                          Recibos
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          justifyContent="flex-start"
                          leftIcon={<FiBarChart2 />}
                          onClick={() => {
                            router.push('/dashboard/analytics');
                            setOpen(false);
                          }}
                          w="full"
                        >
                          Análises
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          justifyContent="flex-start"
                          leftIcon={<FiUser />}
                          onClick={() => {
                            router.push('/dashboard/profile');
                            setOpen(false);
                          }}
                          w="full"
                        >
                          Perfil
                        </Button>
                      </>
                    )}

                    <Divider />

                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<FiLogOut />}
                      onClick={handleLogout}
                      w="full"
                      color="red.500"
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
