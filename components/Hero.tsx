import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { ContainerDivisions } from "./ContainerDivisions";

type Align = "left" | "center";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  maxW?: string | number;
  minH?: string | number;
  align?: Align;
  overlay?: boolean;
  bgOverlay?: string;
}

export default function Hero({
  title,
  subtitle,
  backgroundImage,
  badge,
  actions,
  children,
  maxW = "8xl",
  minH = "70vh",
  align = "left",
  overlay = true,
  bgOverlay = "#0d152b90",
}: HeroSectionProps) {
  const isCenter = align === "center";

  return (
    <Box as="section" position="relative" w="full" overflow="hidden" bgImage={backgroundImage} bgSize="cover" bgPosition="center">

      {overlay && <Box position="absolute" inset={0} bg={bgOverlay} zIndex={1} />}

      <Container maxW={maxW} p={8} px={4} flexGrow={1}
        alignItems="stretch"
        justifyContent="center" position="relative" zIndex={100}>

        <ContainerDivisions align="center" justify="center" gap={{ base: 16, lg: 8 }}>
          <VStack spacing={{ base: 4, lg: 8 }} minH={{ base: 'auto', lg: minH }}
            flexGrow={1} justify="center" align={{ base: 'center', lg: 'flex-start' }}>
            {badge && (
              <HStack>
                <Badge colorScheme="orange" variant="subtle" px={3} py={1} rounded="full">
                  {badge}
                </Badge>
              </HStack>
            )}

            <VStack spacing={2} align={{ base: 'center', lg: 'flex-start' }} justify="center" textAlign={{ base: 'center', lg: 'left' }} w="full">
              <Heading
                as="h1"
                color="whiteAlpha.900"
                fontWeight="semibold"
                lineHeight="1.15"
                fontSize={{ base: "3xl", sm: "4xl", lg: "5xl" }}
              >
                {title}
              </Heading>

              <Text
                color="whiteAlpha.900"
                fontSize={{ base: "md", sm: "lg", lg: "xl" }}
                maxW={{ base: "full", lg: "3xl" }}
                mt={2}
              >
                {subtitle}
              </Text>
            </VStack>
            {actions && (
              <Box mt={4} w="full">
                {actions}
              </Box>
            )}

          </VStack>
          {children && children}
        </ContainerDivisions>

      </Container>
    </Box>
  );
}
