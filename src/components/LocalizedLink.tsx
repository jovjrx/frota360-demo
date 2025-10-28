import NextLink from 'next/link';
import { Link as ChakraLink, LinkProps as ChakraLinkProps } from '@chakra-ui/react';
import { useLocalizedHref } from '@/lib/linkUtils';
import { ReactNode } from 'react';

interface LocalizedLinkProps extends Omit<ChakraLinkProps, 'href'> {
  href: string;
  children: ReactNode;
  locale?: string;
}

export function LocalizedLink({ href, children, locale, ...props }: LocalizedLinkProps) {
  const getLocalizedHref = useLocalizedHref();
  const localizedHref = getLocalizedHref(href);

  return (
    <ChakraLink as={NextLink} href={localizedHref} {...props}>
      {children}
    </ChakraLink>
  );
}

interface LocalizedButtonLinkProps {
  href: string;
  children: ReactNode;
  locale?: string;
  [key: string]: any;
}

export function LocalizedButtonLink({ href, children, locale, ...props }: LocalizedButtonLinkProps) {
  const getLocalizedHref = useLocalizedHref();
  const localizedHref = getLocalizedHref(href);

  return (
    <NextLink href={localizedHref} {...props}>
      {children}
    </NextLink>
  );
}

