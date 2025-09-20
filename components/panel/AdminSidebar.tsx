"use client";

import { VStack, Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

export default function AdminSidebar({ items }: { items: NavItem[] }) {
  const router = useRouter();
  return (
    <VStack as="nav" spacing={2} align="stretch" minW="200px">
      {items.map((item) => (
        <Button
          key={item.href}
          variant="ghost"
          justifyContent="flex-start"
          onClick={() => router.push(item.href)}
        >
          {item.label}
        </Button>
      ))}
    </VStack>
  );
}
