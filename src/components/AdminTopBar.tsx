import React from 'react';
import {
  Box,
  HStack,
  Button,
  Link,
  Icon,
  Text,
} from '@chakra-ui/react';
import { FiLogOut, FiUserCheck, FiHome } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { WrapperLayout } from '@/components/layouts/WrapperLayout';

interface AdminTopBarProps {
  simple?: boolean;
}

export default function AdminTopBar({ simple = false }: AdminTopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  if (!simple) {
    return null;
  }

  return (
    <Box bg="blue.700" borderBottom="1px" borderColor="blue.600" shadow="sm">
      <WrapperLayout panel>
        <HStack spacing={4} justify="space-between" align="center" p={2}>
          <HStack spacing={2}>
            <Button
              as={Link}
              href="/admin"
              leftIcon={<Icon as={FiHome} />}
              variant="ghost"
              colorScheme="whiteAlpha"
              size="sm"
              textColor="white"
              _hover={{ bg: 'blue.600' }}
            >
              <Text display={{ base: 'none', md: 'block' }}>
                Dashboard
              </Text>
            </Button>
            <Button
              as={Link}
              href="/dashboard"
              leftIcon={<Icon as={FiUserCheck} />}
              variant="ghost"
              colorScheme="whiteAlpha"
              size="sm"
              textColor="white"
              _hover={{ bg: 'blue.600' }}
            >
              <Text display={{ base: 'none', md: 'block' }}>
                Painel Motorista
              </Text>
            </Button>
          </HStack>
          <Button
            onClick={handleLogout}
            leftIcon={<Icon as={FiLogOut} />}
            variant="ghost"
            colorScheme="whiteAlpha"
            size="sm"
            textColor="white"
            _hover={{ bg: 'red.800' }}
          >
            <Text display={{ base: 'none', md: 'block' }}>
              Deslogar
            </Text>
          </Button>
        </HStack>
      </WrapperLayout>
    </Box>
  );
}

