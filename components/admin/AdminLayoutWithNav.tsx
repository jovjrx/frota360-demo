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
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiMenu, FiBell } from 'react-icons/fi';
import AdminNav from './AdminNav';

interface AdminLayoutWithNavProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function AdminLayoutWithNav({ children, user }: AdminLayoutWithNavProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

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
            <HStack justify="space-between" py={4}>
              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  icon={<FiMenu />}
                  variant="ghost"
                  onClick={onOpen}
                  aria-label="Abrir menu"
                />
              )}

              {/* Spacer */}
              <Box flex={1} />

              {/* Notifications */}
              <IconButton
                icon={<FiBell />}
                variant="ghost"
                aria-label="Notificações"
              />
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
