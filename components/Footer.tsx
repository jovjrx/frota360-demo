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
import { Container } from "./Container";
import { ContainerDivisions } from "./ContainerDivisions";
import { useLocalizedHref } from "@/lib/linkUtils";
import { getPublicMenuItems } from "@/config/publicMenu";

interface FooterProps {
  t: (key: string) => string;
  panel?: boolean;
}

export default function Footer({ t, panel = false }: FooterProps) {
  const year = new Date().getFullYear();
  const getLocalizedHref = useLocalizedHref();
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
                src="/img/logo.png"
                alt="Conduz.pt"
                h={'auto'}
                w={64}
                filter="brightness(0) invert(1)"
              />
            </Link>
            <VStack spacing={0} align={{ base: "center", md: "flex-start" }}>
              <Heading size="md" fontWeight="medium" color={color}>
                {t("footer.tagline")}
              </Heading>
              <Text color={colorSoft} fontStyle="italic" fontSize="sm">
                "{t("footer.description")}"
              </Text>
            </VStack>
            
            {/* Redes Sociais */}
            <HStack spacing={3} pt={2}>
              <IconButton
                as="a"
                href="https://www.facebook.com/conduzpt"
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
                href="https://www.instagram.com/conduzpt"
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
              href={t("company.whats")}
              color="brand.500"
              fontSize="sm"
              _hover={{ textDecoration: "underline" }}
              fontWeight="medium"
            >
              {t("company.phone")}
            </Link>
            <Link
              href={`mailto:${t("company.email")}`}
              color="brand.500"
              fontSize="sm"
              _hover={{ textDecoration: "underline" }}
              fontWeight="medium"
            >
              {t("company.email")}
            </Link>
            <Text color="whiteAlpha.900" fontSize="sm">
              {t("company.address")}, {t("company.postalCode")}
            </Text>
            <Text color="whiteAlpha.900" fontSize="sm">
              {t("company.city")}, {t("company.state")}, {t("company.country")}
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
              {t("footer.developerBy")}
            </Text>
            <Link href="https://josejunior.com.br" fontSize="sm" color="brand.400" _hover={{ textDecoration: "underline", color: "brand.300" }}>
              {t("footer.developer")}
            </Link>
          </HStack>

        </ContainerDivisions>
        <Divider borderColor={border} />

        <Stack spacing={2} flexDirection={{ base: "column", md: "row" }} justify={{ base: "center", md: "space-between" }}>
          <Text color={colorSoft} fontSize="sm" textAlign="center">
            © {year} Conduz.pt, uma empresa Alvorada Magistral LDA. {t("company.nipc")}.
          </Text>
          <Text color={colorSoft} fontSize="sm" textAlign="center">
            {t("footer.copyright")}
          </Text>
        </Stack>
      </VStack>

    </Container>

  );
}
