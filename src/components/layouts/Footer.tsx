import NextLink from "next/link";
import { useMemo } from "react";
import {
  Heading,
  Text,
  Link,
  HStack,
  Divider,
  Image,
  Stack,
  VStack,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { Container } from "../Container";
import { ContainerDivisions } from "../ContainerDivisions";
import { useLocalizedHref } from "@/lib/linkUtils";
import { getPublicMenuItems } from "@/config/publicMenu";
import { useSiteBranding } from "@/hooks/useSiteBranding";
import { useSiteContact } from "@/hooks/useSiteContact";

interface FooterProps {
  t: (key: string) => string;
  panel?: boolean;
}

export default function Footer({ t, panel = false }: FooterProps) {
  const year = new Date().getFullYear();
  const getLocalizedHref = useLocalizedHref();
  const branding = useSiteBranding();
  const contact = useSiteContact();
  const color = "white";
  const colorSoft = "whiteAlpha.600";
  const border = "whiteAlpha.300";

  const publicMenuItems = useMemo(
    () =>
      getPublicMenuItems().map((item) => ({
        id: item.id,
        href: item.external ? item.href : getLocalizedHref(item.href),
        label: t(item.translationKey),
        external: item.external ?? false,
      })),
    [t, getLocalizedHref]
  );

  return (
    <Container bg="#0d152b" softBg maxW={panel ? 'full' : '8xl'}>
      <VStack spacing={6} minW="full">
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, auto)" }}>

          <Stack spacing={3} minW="full" align={{ base: "center", md: "flex-start" }}>
            <Link as={NextLink} href="/">
              <Image
                src={branding.logo}
                alt="frota360.pt"
                h={'auto'}
                w={64}
                filter="brightness(0) invert(1)"
              />
            </Link>
            <VStack spacing={0} align={{ base: "center", md: "flex-start" }}>
              <Heading size="md" fontWeight="medium" color={color}>
                {contact.tagline || t("footer.tagline")}
              </Heading>
              <Text color={colorSoft} fontStyle="italic" fontSize="sm">
                "{contact.description || t("footer.description")}"
              </Text>
            </VStack>
            
            {/* Redes Sociais */}
            <HStack spacing={3} pt={2}>
              <IconButton
                as="a"
                href={contact.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                icon={<Icon as={FaFacebook} boxSize={5} />}
                variant="ghost"
                colorScheme="whiteAlpha"
                color={color}
                _hover={{ bg: "whiteAlpha.200", color: "brand.400" }}
                size="md"
              />
              <IconButton
                as="a"
                href={contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                icon={<Icon as={FaInstagram} boxSize={5} />}
                variant="ghost"
                colorScheme="whiteAlpha"
                color={color}
                _hover={{ bg: "whiteAlpha.200", color: "brand.400" }}
                size="md"
              />
            </HStack>
          </Stack>

          <Divider borderColor={border} display={{ base: "flex", md: "none" }} />

          <Stack spacing={3} align={{ base: "center", md: "flex-start" }}>
            <Heading size="md" fontWeight="medium" color={color} textAlign={{ base: "center", md: "left" }}>
              {t("footer.contactInfo")}
            </Heading>
            <Link
              href={`https://wa.me/${contact.phone?.replace(/[^0-9]/g, '')}`}
              color="brand.500"
              fontSize="sm"
              _hover={{ textDecoration: "underline" }}
              fontWeight="medium"
            >
              {contact.phone}
            </Link>
            <Link
              href={`mailto:${contact.email}`}
              color="brand.500"
              fontSize="sm"
              _hover={{ textDecoration: "underline" }}
              fontWeight="medium"
            >
              {contact.email}
            </Link>
            <Text color="whiteAlpha.900" fontSize="sm">
              {contact.address}, {contact.postalCode}
            </Text>
            <Text color="whiteAlpha.900" fontSize="sm">
              {contact.city}, {contact.country}
            </Text>
          </Stack>


        </ContainerDivisions>

        <Divider borderColor={border} />

        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, auto)" }} gap={{ base: 2, md: 6 }}>
          <HStack spacing={3} justify={{ base: "center", md: "flex-start" }}>
            {publicMenuItems.map((item) => (
              <Link
                key={item.id}
                as={item.external ? "a" : NextLink}
                fontSize="sm"
                href={item.href}
                color="white"
                _hover={{ textDecoration: "underline", color: "brand.400" }}
                isExternal={item.external}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </HStack>

          <HStack justify={{ base: "center", md: "flex-start" }}>
            <Text color={colorSoft} fontSize="sm" textAlign="center" gap={2}>
              {contact.developerBy || t("footer.developerBy")}
            </Text>
            <Link href="https://alvoradamagistral.eu" fontSize="sm" color="brand.400" _hover={{ textDecoration: "underline", color: "brand.300" }}>
              {contact.developer || t("footer.developer")}
            </Link>
          </HStack>

        </ContainerDivisions>
        <Divider borderColor={border} />

        <Stack spacing={2} flexDirection={{ base: "column", md: "row" }} justify={{ base: "center", md: "space-between" }}>
          <Text color={colorSoft} fontSize="sm" textAlign="center">
            © {year} Frota360. {contact.nipc || t("company.nipc")}.
          </Text>
          <Text color={colorSoft} fontSize="sm" textAlign="center">
            {contact.copyright || t("footer.copyright")}
          </Text>
        </Stack>
      </VStack>

    </Container>

  );
}

