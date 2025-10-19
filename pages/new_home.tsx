import NextLink from "next/link";
import { useMemo } from "react";
import { useLocalizedHref } from "@/lib/linkUtils";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";
import { useFacebookTracking } from "@/hooks/useFacebookTracking";

import {
  Box,
  Text,
  Button,
  VStack,
  SimpleGrid,
  Image as ChakraImage,
  HStack,
  Badge,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import Hero from "@/components/Hero";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { NEW_HOME } from "@/translations/new-home/constants";

const makeSafeT = (fn?: (key: string) => any) => (key: string, fallback?: any) => {
  if (!fn) return fallback ?? key;
  const value = fn(key);
  return value === undefined || value === null ? fallback ?? key : value;
};

export default function NewHome({ tPage: rawTPage, tCommon: rawTCommon }: PublicPageProps) {
  const getLocalizedHref = useLocalizedHref();
  const t = useMemo(() => makeSafeT(rawTPage), [rawTPage]);
  const tc = useMemo(() => makeSafeT(rawTCommon), [rawTCommon]);
  const { trackCheckoutStart } = useFacebookTracking();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Box bg={bgColor} minH="100vh">
      {/* HERO SECTION */}
      <Hero
        title="Não é só dirigir. É construir seu próprio negócio."
        subtitle="Sistema meritocrático onde seu desempenho determina seu ganho"
        backgroundImage="/img/hero-drivers.jpg"
        badge="TVDE PORTUGAL"
        actions={
          <HStack spacing={4} mt={8}>
            <Button
              as={NextLink}
              href={getLocalizedHref("/request")}
              colorScheme="green"
              size="lg"
              rightIcon={<ArrowRightIcon />}
              onClick={() => trackCheckoutStart("Driver Application - New Home")}
            >
              "Candidatar-me como Motorista"
            </Button>
            <Button
              as="a"
              href="https://wa.me/351XXXXXXXXX"
              variant="outline"
              borderColor="white"
              color="white"
              size="lg"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              "Falar no WhatsApp"
            </Button>
          </HStack>
        }
      />

      {/* DIFERENCIAIS ÚNICOS */}
      <Container maxW="7xl">
        <Title
          title="Por que Motoristas Escolhem Conduz"
          description="Sistema meritocrático que recompensa seu desempenho"
          feature="DIFERENCIAIS ÚNICOS"
        />

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mt={12}>
          {(() => {
            const differentials = t(NEW_HOME.DIFFERENTIALS.ITEMS);
            if (!Array.isArray(differentials)) return null;
            return differentials.map((diff: any, i: number) => (
              <Box
                key={i}
                bg={cardBg}
                borderRadius="lg"
                overflow="hidden"
                boxShadow="md"
                transition="all 0.3s"
                _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
              >
                {/* Imagem */}
                <Box h="200px" overflow="hidden" bg="gray.200">
                  <ChakraImage
                    src={diff.image}
                    alt={diff.title}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>

                {/* Conteúdo */}
                <VStack align="start" spacing={3} p={6}>
                  <Badge colorScheme="green" fontSize="xs">
                    {diff.badge}
                  </Badge>
                  <Heading size="md" color="gray.800">
                    {diff.title}
                  </Heading>
                  <Text color="gray.600" fontSize="sm" lineHeight="1.6">
                    {diff.description}
                  </Text>
                </VStack>
              </Box>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* COMO FUNCIONA */}
      <Container maxW="7xl" bg="white" borderY="1px solid" borderColor="gray.200">
        <Title
          title="Como Funciona"
          description="3 passos simples para começar"
          feature="PROCESSO"
        />

        <ContainerDivisions template={{ base: '1fr', md: 'repeat(3, 1fr)' }}>
          {(() => {
            const steps = t(NEW_HOME.HOW_IT_WORKS.STEPS);
            if (!Array.isArray(steps)) return null;
            return steps.map((step: any, i: number) => (
              <Card key={i} animated borded img={`/img/step-${i + 1}.jpg`}>
                <VStack spacing={4} align="center" textAlign="center">
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="full"
                    bg="green.500"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                    fontWeight="bold"
                  >
                    {step.number}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {step.title}
                  </Text>
                  <Text color="gray.600">
                    {step.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* SISTEMA MERITOCRÁTICO */}
      <Container maxW="7xl">
        <Title
          title="Sistema Meritocrático"
          description="Quanto melhor você trabalha, mais você ganha"
          feature="PROGRESSÃO"
        />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mt={12}>
          {(() => {
            const levels = t(NEW_HOME.MERITOCRATIC.LEVELS);
            if (!Array.isArray(levels)) return null;
            return levels.map((level: any, i: number) => (
              <Box
                key={i}
                bg={cardBg}
                p={8}
                borderRadius="lg"
                boxShadow="md"
                borderTop="4px solid"
                borderTopColor={level.color}
                textAlign="center"
              >
                <Heading size="lg" mb={2} color="gray.800">
                  {level.title}
                </Heading>
                <Text fontSize="3xl" fontWeight="bold" color={level.color} mb={4}>
                  {level.commission}
                </Text>
                <Text color="gray.600" mb={4}>
                  {level.description}
                </Text>
                <VStack align="start" spacing={2}>
                  {level.benefits && level.benefits.map((benefit: string, j: number) => (
                    <HStack key={j} spacing={2}>
                      <Text color={level.color}>✓</Text>
                      <Text fontSize="sm" color="gray.600">{benefit}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* TIPOS DE MOTORISTA */}
      <Container maxW="7xl" bg="white" borderY="1px solid" borderColor="gray.200">
        <Title
          title="Escolha Seu Caminho"
          description="Dois modelos para duas realidades"
          feature="FLEXIBILIDADE"
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt={12}>
          {(() => {
            const types = t(NEW_HOME.DRIVER_TYPES.TYPES);
            if (!Array.isArray(types)) return null;
            return types.map((type: any, i: number) => (
              <Card key={i} animated borded img={type.image} color={type.color}>
                <VStack spacing={4} align="start" h="full">
                  <Heading size="md" color={`${type.color}.600`}>
                    {type.title}
                  </Heading>
                  <Text color="gray.600" flex="1">
                    {type.description}
                  </Text>
                  <VStack align="start" spacing={2} w="full">
                    {type.benefits && type.benefits.map((benefit: string, j: number) => (
                      <HStack key={j} spacing={2}>
                        <Text color={`${type.color}.500`}>✓</Text>
                        <Text fontSize="sm" color="gray.600">{benefit}</Text>
                      </HStack>
                    ))}
                  </VStack>
                  <Button
                    as={NextLink}
                    href={getLocalizedHref("/request")}
                    colorScheme={type.color}
                    size="sm"
                    rightIcon={<ArrowRightIcon />}
                    w="full"
                    onClick={() => trackCheckoutStart(`Driver Application - ${type.title}`)}
                  >
                    "Candidatar-me"
                  </Button>
                </VStack>
              </Card>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* TRANSPARÊNCIA E SEGURANÇA */}
      <Container maxW="7xl">
        <Title
          title="Confiança e Segurança"
          description="Tudo que você precisa para trabalhar com tranquilidade"
          feature="GARANTIAS"
        />

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mt={12}>
          {(() => {
            const items = t(NEW_HOME.TRUST.ITEMS);
            if (!Array.isArray(items)) return null;
            return items.map((item: any, i: number) => (
              <Box
                key={i}
                bg={cardBg}
                p={6}
                borderRadius="lg"
                boxShadow="md"
                textAlign="center"
              >
                <Text fontSize="3xl" mb={3}>
                  {item.icon}
                </Text>
                <Heading size="sm" mb={2} color="gray.800">
                  {item.title}
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {item.description}
                </Text>
              </Box>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* CTA FINAL */}
      <Box bg="green.600" color="white" py={16} textAlign="center">
        <Container maxW="2xl">
          <Heading size="xl" mb={4}>
            "Pronto para Começar a Faturar?"
          </Heading>
          <Text fontSize="lg" mb={8} opacity={0.9}>
            "Você conduz, nós cuidamos do resto! Junte-se aos motoristas que já escolheram a Conduz"
          </Text>
          <HStack justify="center" spacing={4}>
            <Button
              as={NextLink}
              href={getLocalizedHref("/request")}
              colorScheme="whiteAlpha"
              bg="white"
              color="green.600"
              size="lg"
              rightIcon={<ArrowRightIcon />}
              onClick={() => trackCheckoutStart("Driver Application - Final CTA")}
            >
              "Candidatar-me Agora"
            </Button>
            <Button
              as="a"
              href="https://wa.me/351XXXXXXXXX"
              variant="outline"
              borderColor="white"
              color="white"
              size="lg"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              "Falar no WhatsApp"
            </Button>
          </HStack>
        </Container>
      </Box>
    </Box>
  );
}

export const getServerSideProps = withPublicSSR("new-home");

