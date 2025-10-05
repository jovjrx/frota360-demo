import { ReactNode } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Text,
  Avatar,
  Badge,
  IconButton,
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FiMenu, 
  FiHome, 
  FiFileText, 
  FiCalendar, 
  FiTruck, 
  FiBarChart2, 
  FiWifi, 
  FiLogOut,
  FiUser,
  FiChevronDown,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminNav from './AdminNav';

interface AdminLayoutWithNavProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

// Menu items para a barra superior
const quickMenuItems = [
  { label: 'Dashboard', href: '/admin', icon: FiHome },
  { label: 'Solicitações', href: '/admin/requests', icon: FiFileText },
  { label: 'Controle Semanal', href: '/admin/drivers-weekly', icon: FiCalendar },
  { label: 'Frota', href: '/admin/fleet', icon: FiTruck },
  { label: 'Métricas', href: '/admin/metrics', icon: FiBarChart2 },
  { label: 'Integrações', href: '/admin/integrations', icon: FiWifi },
];

export default function AdminLayoutWithNav({ children, user }: AdminLayoutWithNavProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Sidebar Desktop */}
      {!isMobile && (
        <Box
          w="280px"
          bg="white"
          borderRight="1px"
          borderColor="gray.200"
          position="fixed"
          h="100vh"
          overflowY="auto"
        >
          <VStack spacing={4} p={4} align="stretch">
            {/* Logo */}
            <Box textAlign="center" py={4}>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                Conduz.pt
              </Text>
              <Text fontSize="sm" color="gray.500">
                Painel Administrativo
              </Text>
            </Box>

            {/* User Info */}
            {user && (
              <Box
                p={4}
                bg="gray.50"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
              >
                <HStack spacing={3}>
                  <Avatar size="sm" name={user.name} src={user.avatar} />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                      {user.name}
                    </Text>
                    <Badge colorScheme="blue" fontSize="xs">
                      Admin
                    </Badge>
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Navigation */}
            <AdminNav />
          </VStack>
        </Box>
      )}

      {/* Drawer Mobile */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              Conduz.pt
            </Text>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {user && (
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  <HStack spacing={3}>
                    <Avatar size="sm" name={user.name} src={user.avatar} />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                        {user.name}
                      </Text>
                      <Badge colorScheme="blue" fontSize="xs">
                        Admin
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>
              )}
              <AdminNav />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box
        flex={1}
        ml={{ base: 0, lg: '280px' }}
        transition="margin-left 0.2s"
      >
        {/* Header */}
        <Box
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Container maxW="7xl">
            <HStack justify="space-between" py={4} spacing={4}>
              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  icon={<FiMenu />}
                  variant="ghost"
                  onClick={onOpen}
                  aria-label="Abrir menu"
                  size="lg"
                />
              )}

              {/* Desktop: Quick Menu Icons */}
              {!isMobile && (
                <HStack spacing={2}>
                  {quickMenuItems.map((item) => (
                    <Tooltip key={item.href} label={item.label} placement="bottom">
                      <IconButton
                        as={Link}
                        href={item.href}
                        icon={<Icon as={item.icon} boxSize={5} />}
                        variant={isActive(item.href) ? 'solid' : 'ghost'}
                        colorScheme={isActive(item.href) ? 'blue' : 'gray'}
                        aria-label={item.label}
                        size="lg"
                        _hover={{
                          transform: 'translateY(-2px)',
                          shadow: 'md',
                        }}
                        transition="all 0.2s"
                      />
                    </Tooltip>
                  ))}
                </HStack>
              )}

              {/* Mobile: Quick Access Dropdown */}
              {isMobile && (
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<FiChevronDown />}
                    variant="ghost"
                    size="sm"
                  >
                    Menu Rápido
                  </MenuButton>
                  <MenuList>
                    {quickMenuItems.map((item) => (
                      <MenuItem
                        key={item.href}
                        as={Link}
                        href={item.href}
                        icon={<Icon as={item.icon} />}
                        fontWeight={isActive(item.href) ? 'bold' : 'normal'}
                        bg={isActive(item.href) ? 'blue.50' : 'transparent'}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              )}

              {/* Spacer */}
              <Box flex={1} />

              {/* User Menu */}
              {user && (
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    leftIcon={
                      isMobile ? undefined : <Avatar size="xs" name={user.name} src={user.avatar} />
                    }
                    rightIcon={isMobile ? undefined : <FiChevronDown />}
                  >
                    {isMobile ? (
                      <Avatar size="sm" name={user.name} src={user.avatar} />
                    ) : (
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">
                          {user.name}
                        </Text>
                        <Badge colorScheme="blue" fontSize="xs">
                          Admin
                        </Badge>
                      </VStack>
                    )}
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<FiUser />} isDisabled>
                      {user.email}
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      icon={<FiLogOut />}
                      color="red.500"
                      onClick={handleLogout}
                    >
                      Sair
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </Container>
        </Box>

        {/* Page Content */}
        <Box p={{ base: 4, md: 6 }}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
