import React, { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  HStack,
  VStack,
  Text,
  Icon,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FiUser, FiLayout, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface UserProfileMenuProps {
  user: {
    displayName?: string | null;
    email: string;
    photoURL?: string;
    role: 'admin' | 'driver';
  };
}

export default function UserProfileMenu({ user }: UserProfileMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      await router.push('/login');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
      setIsLoggingOut(false);
    }
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const getDashboardLink = () => {
    return user.role === 'admin' ? '/admin' : '/dashboard';
  };

  const getProfileLink = () => {
    return user.role === 'admin' ? '/admin/profile' : '/dashboard/profile';
  };

  const userName = user.displayName || user.email.split('@')[0] || 'Usuário';
  const roleLabel = user.role === 'admin' ? 'Administrador' : 'Motorista';

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        rightIcon={<Icon as={ChevronDownIcon} />}
        variant="ghost"
        size="sm"
        _hover={{ bg: 'gray.100' }}
        _active={{ bg: 'gray.100' }}
      >
        <HStack spacing={2}>
          <Avatar
            size="xs"
            name={userName}
            src={user.photoURL}
            bg="red.500"
            color="white"
          />
          <VStack spacing={0} align="start" display={{ base: 'none', md: 'flex' }}>
            <Text fontSize="sm" fontWeight="semibold" lineHeight={1}>
              {userName}
            </Text>
            <Text fontSize="xs" color="gray.500" lineHeight={1}>
              {roleLabel}
            </Text>
          </VStack>
        </HStack>
      </MenuButton>

      <MenuList>
        <MenuItem
          icon={<Icon as={FiLayout} />}
          onClick={() => handleNavigate(getDashboardLink())}
        >
          {user.role === 'admin' ? 'Painel Admin' : 'Painel Motorista'}
        </MenuItem>

        <MenuItem
          icon={<Icon as={FiUser} />}
          onClick={() => handleNavigate(getProfileLink())}
        >
          Perfil
        </MenuItem>

        <MenuDivider />

        <MenuItem
          icon={<Icon as={FiLogOut} />}
          onClick={handleLogout}
          isDisabled={isLoggingOut}
          color="red.600"
        >
          {isLoggingOut ? (
            <HStack spacing={2}>
              <Spinner size="sm" color="red.600" />
              <span>Deslogando...</span>
            </HStack>
          ) : (
            'Deslogar'
          )}
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

