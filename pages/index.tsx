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
  Image,
  HStack,
  Icon,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { Progress } from "@/components/Progress";
import Hero from "@/components/Hero";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { CheckIcon, ArrowRightIcon } from "@chakra-ui/icons";
import { COMMON, HOME } from "@/translations";

const makeSafeT = (fn?: (key: string) => any) => (key: string, fallback?: any) => {
  if (!fn) return fallback ?? key;
  const value = fn(key);
  return value === undefined || value === null ? fallback ?? key : value;
};

export default function Home({ tPage: rawTPage, tCommon: rawTCommon }: PublicPageProps) {
  const getLocalizedHref = useLocalizedHref();
  const t = useMemo(() => makeSafeT(rawTPage), [rawTPage]);
  const tc = useMemo(() => makeSafeT(rawTCommon), [rawTCommon]);
  const { trackCheckoutStart } = useFacebookTracking();

  return (
    <>
      {/* Hero - Diferencial Principal */}
      <Hero
        title={t(HOME.HERO.TITLE)}
        subtitle={t(HOME.HERO.SUBTITLE)}
        backgroundImage="/img/bg-portugal.jpg"
        badge={t(HOME.HERO.BADGE)}
        overlay
        actions={
          <VStack spacing={{ base: 3, md: 0 }} w="full">
            <HStack
              spacing={{ base: 2, md: 4 }}
              flexDirection={{ base: "column", md: "row" }}
              w="full"
              align="center"
            >
              <Button
                as={NextLink}
                href={getLocalizedHref("/request")}
                size={{ base: "md", md: "lg" }}
                px={{ base: 6, md: 8 }}
                py={{ base: 3, md: 4 }}
                w={{ base: "full", md: "auto" }}
                shadow="lg"
                colorScheme="green"
                rightIcon={<ArrowRightIcon />}
                onClick={() => trackCheckoutStart('Driver Application - Hero')}
              >
                {t(HOME.HERO.CTA_PRIMARY)}
              </Button>
              <Button
                as={NextLink}
                href={tc(COMMON.COMPANY.WHATSAPP)}
                size={{ base: "md", md: "lg" }}
                px={{ base: 6, md: 8 }}
                py={{ base: 3, md: 4 }}
                w={{ base: "full", md: "auto" }}
                variant="outline"
                colorScheme="whiteAlpha"
                borderColor="whiteAlpha.400"
                color="white"
                _hover={{
                  bg: "whiteAlpha.100",
                  borderColor: "whiteAlpha.600"
                }}
              >
                {t(HOME.HERO.CTA_SECONDARY)}
              </Button>
            </HStack>
          </VStack>
        }
      >
        <Highlight
          title={t(HOME.HERO.HIGHLIGHT.TITLE)}
          description={t(HOME.HERO.HIGHLIGHT.DESCRIPTION)}
          bgImage="/img/driver-app.jpg"
          delayImage={0.5}
          delayBox={0.8}
        />
      </Hero>

      {/* Seção: Por que Conduz é diferente */}
      <Container>
        <Title
          title={t(HOME.DIFFERENTIATION.TITLE)}
          description={t(HOME.DIFFERENTIATION.SUBTITLE)}
          feature={t(HOME.DIFFERENTIATION.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const items = t(HOME.DIFFERENTIATION.ITEMS);
            if (!Array.isArray(items)) return null;

            return items.map((item: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="lg"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="green.600"
                    fontSize="2xl"
                  >
                    {i === 0 ? "🔀" : i === 1 ? "📈" : i === 2 ? "🛡️" : "✨"}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {item.title}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {item.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Seção de Benefícios */}
      <Container softBg>
        <Title
          title={t(HOME.BENEFITS.TITLE)}
          description={t(HOME.BENEFITS.SUBTITLE)}
          feature={t(HOME.BENEFITS.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const benefits = t(HOME.BENEFITS.ITEMS);
            if (!Array.isArray(benefits)) return null;

            return benefits.map((benefit: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {benefit.title}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {benefit.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Como Funciona o Modelo Afiliado */}
      <Container>
        <Title
          title={t(HOME.HOW_IT_WORKS.TITLE)}
          description={t(HOME.HOW_IT_WORKS.SUBTITLE)}
          feature={t(HOME.HOW_IT_WORKS.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(3, 1fr)" }}>
          {(() => {
            const steps = t(HOME.HOW_IT_WORKS.STEPS);
            if (!Array.isArray(steps)) return null;

            return steps.map((step: any, i: number) => (
              <Card key={i} animated borded>
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
                    {i + 1}
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

      {/* Escolha Seu Caminho */}
      <Container softBg>
        <Title
          title={t(HOME.SERVICES.TITLE)}
          description={t(HOME.SERVICES.SUBTITLE)}
          feature="MODELOS"
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          <Card animated borded color='green'>
            <VStack spacing={4} align="start" h="full">
              <Box
                w="60px"
                h="60px"
                borderRadius="lg"
                bg="green.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="green.600"
                fontSize="3xl"
              >
                🎯
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="green.600">
                {t(HOME.SERVICES.AFFILIATE.TITLE)}
              </Text>
              <Text color="gray.600" fontSize="sm">
                {t(HOME.SERVICES.AFFILIATE.DESCRIPTION)}
              </Text>
              <VStack spacing={2} align="start" flex="1" w="full">
                {(() => {
                  const benefits = t(HOME.SERVICES.AFFILIATE.BENEFITS);
                  if (!Array.isArray(benefits)) return null;
                  return benefits.map((benefit: any, i: number) => (
                    <HStack key={i} spacing={2}>
                      <CheckIcon color="green.600" w={4} h={4} />
                      <Text color="gray.600" fontSize="sm">{benefit}</Text>
                    </HStack>
                  ));
                })()}
              </VStack>
              <Button
                as={NextLink}
                href={getLocalizedHref("/request")}
                colorScheme="green"
                w="full"
                rightIcon={<ArrowRightIcon />}
                onClick={() => trackCheckoutStart('Driver Application - Affiliate')}
              >
                Candidatar-me
              </Button>
            </VStack>
          </Card>

          <Card animated borded color='blue'>
            <VStack spacing={4} align="start" h="full">
              <Box
                w="60px"
                h="60px"
                borderRadius="lg"
                bg="blue.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="blue.600"
                fontSize="3xl"
              >
                🚗
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                {t(HOME.SERVICES.RENTER.TITLE)}
              </Text>
              <Text color="gray.600" fontSize="sm">
                {t(HOME.SERVICES.RENTER.DESCRIPTION)}
              </Text>
              <VStack spacing={2} align="start" flex="1" w="full">
                {(() => {
                  const benefits = t(HOME.SERVICES.RENTER.BENEFITS);
                  if (!Array.isArray(benefits)) return null;
                  return benefits.map((benefit: any, i: number) => (
                    <HStack key={i} spacing={2}>
                      <CheckIcon color="blue.600" w={4} h={4} />
                      <Text color="gray.600" fontSize="sm">{benefit}</Text>
                    </HStack>
                  ));
                })()}
              </VStack>
              <Button
                as={NextLink}
                href={getLocalizedHref("/request")}
                colorScheme="blue"
                w="full"
                rightIcon={<ArrowRightIcon />}
                onClick={() => trackCheckoutStart('Driver Application - Renter')}
              >
                Candidatar-me
              </Button>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      {/* Metas de Crescimento 2026 */}
      <Container>
        <Title
          title={t(HOME.GROWTH.TITLE)}
          description={t(HOME.GROWTH.SUBTITLE)}
          feature={t(HOME.GROWTH.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const quarters = t(HOME.GROWTH.QUARTERS);
            if (!Array.isArray(quarters)) return null;

            return quarters.map((q: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    px={3}
                    py={1}
                    borderRadius="md"
                    bg="green.100"
                    color="green.700"
                    fontWeight="bold"
                    fontSize="sm"
                  >
                    {q.quarter}
                  </Box>
                  <VStack spacing={2} align="start" flex="1">
                    <HStack>
                      <Text color="gray.500" fontSize="sm">Motoristas:</Text>
                      <Text fontWeight="bold" color="green.600">{q.motoristas}</Text>
                    </HStack>
                    <HStack>
                      <Text color="gray.500" fontSize="sm">Receita:</Text>
                      <Text fontWeight="bold" color="green.600">{q.receita}</Text>
                    </HStack>
                  </VStack>
                  <Text color="gray.600" fontSize="sm">
                    {q.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Métricas */}
      <Container softBg>
        <Title
          title={t(HOME.METRICS.TITLE)}
          description={t(HOME.METRICS.SUBTITLE)}
          feature={t(HOME.METRICS.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const stats = t(HOME.METRICS.STATS);

            if (!Array.isArray(stats)) return null;

            return stats.map((item: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <HStack>
                    <Text fontSize="3xl" fontWeight="bold" color="green.600">
                      {item.value}
                    </Text>
                    {item.unit && (
                      <Text fontSize="lg" color="green.600" fontWeight="bold">
                        {item.unit}
                      </Text>
                    )}
                  </HStack>
                  <VStack spacing={1} align="start" flex="1">
                    <Text fontWeight="bold" color="gray.800" fontSize="sm">
                      {item.label}
                    </Text>
                    <Text color="gray.600" fontSize="sm">
                      {item.description}
                    </Text>
                  </VStack>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Nossos Valores */}
      <Container>
        <Title
          title={t(HOME.VALUES.TITLE)}
          description={t(HOME.VALUES.SUBTITLE)}
          feature={t(HOME.VALUES.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const values = t(HOME.VALUES.ITEMS);
            if (!Array.isArray(values)) return null;

            return values.map((value: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="lg"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="green.600"
                    fontSize="2xl"
                  >
                    {i === 0 ? "🔍" : i === 1 ? "⭐" : i === 2 ? "🔒" : "🚀"}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {value.title}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {value.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Depoimentos */}
      <Container softBg>
        <Title
          title={tc(COMMON.TESTIMONIALS.TITLE)}
          description={tc(COMMON.TESTIMONIALS.SUBTITLE)}
          feature={tc(COMMON.TESTIMONIALS.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          {(() => {
            const testimonials = tc(COMMON.TESTIMONIALS.ITEMS, []);
            if (!Array.isArray(testimonials)) return null;

            return testimonials.map((testimonial: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start">
                  <Text fontSize="lg" fontStyle="italic" color="gray.700">
                    "{testimonial.quote}"
                  </Text>
                  <HStack>
                    <Text fontWeight="bold" color="green.600">
                      {testimonial.author}
                    </Text>
                    <Text color="gray.500">
                      {testimonial.location}
                    </Text>
                  </HStack>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* FAQ */}
      <Container>
        <Title
          title={tc(COMMON.FAQ.TITLE)}
          description={tc(COMMON.FAQ.SUBTITLE)}
          feature={tc(COMMON.FAQ.FEATURE)}
        />
        <Box maxW="4xl" mx="auto">
          <Accordion allowToggle>
            {(() => {
              const faqItems = tc(COMMON.FAQ.ITEMS, []);
              if (!Array.isArray(faqItems)) return null;

              return faqItems.map((item: any, i: number) => (
                <AccordionItem key={i} border="1px" borderColor="gray.200" borderRadius="md" mb={2}>
                  <AccordionButton py={4}>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      {item.question}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4} color="gray.600">
                    {item.answer}
                  </AccordionPanel>
                </AccordionItem>
              ));
            })()}
          </Accordion>
        </Box>
      </Container>

      {/* CTA Final */}
      <Container softBg>
        <Title
          title={t(HOME.CTA.TITLE)}
          description={t(HOME.CTA.SUBTITLE)}
          feature={t(HOME.CTA.FEATURE)}
          ctaText={t(HOME.CTA.BUTTON)}
          cta={getLocalizedHref("/request")}
          center
        />
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('home');

