"use client";

import { Flex, Heading, Spacer, Button, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function PanelHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <Flex as="header" bg="brand.500" color="white" px={6} py={4} align="center">
      <Heading size="md">Conduz.pt Painel</Heading>
      <Spacer />
      {user && (
        <Flex align="center" gap={3}>
          <Text fontSize="sm">Olá, {user.email}</Text>
          <Button size="sm" variant="outline" colorScheme="whiteAlpha" onClick={handleLogout}>
            Sair
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
