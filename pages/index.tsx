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
  HStack,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Image,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
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
      {/* Hero Premium */}
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

      {/* Como Funciona - Simples e Visual */}
      <Container>
        <Title
          title={t(HOME.HOW_IT_WORKS.TITLE)}
          description={t(HOME.HOW_IT_WORKS.SUBTITLE)}
          feature={t(HOME.HOW_IT_WORKS.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(4, 1fr)" }}>
          {(() => {
            const steps = t(HOME.HOW_IT_WORKS.STEPS);
            if (!Array.isArray(steps)) return null;

            return steps.map((step: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="center" textAlign="center" h="full">
                  <Box
                    w="70px"
                    h="70px"
                    borderRadius="full"
                    bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                    fontWeight="bold"
                    shadow="md"
                  >
                    {i + 1}
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {step.title}
                  </Text>
                  <Text color="gray.600" flex="1" fontSize="sm" lineHeight="1.6">
                    {step.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Escolha Seu Caminho - Premium Cards */}
      <Container softBg>
        <Title
          title={t(HOME.SERVICES.TITLE)}
          description={t(HOME.SERVICES.SUBTITLE)}
          feature="MODELOS"
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          {/* Afiliado */}
          <Card animated borded color='green'>
            <VStack spacing={5} align="start" h="full">
              <Box
                w="70px"
                h="70px"
                borderRadius="lg"
                bg="green.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="green.600"
                fontSize="3xl"
              >
                👤
              </Box>
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color="green.600">
                  {t(HOME.SERVICES.AFFILIATE.TITLE)}
                </Text>
                <Text color="gray.600" fontSize="sm" lineHeight="1.6">
                  {t(HOME.SERVICES.AFFILIATE.DESCRIPTION)}
                </Text>
              </VStack>
              <VStack spacing={2} align="start" flex="1" w="full">
                {(() => {
                  const benefits = t(HOME.SERVICES.AFFILIATE.BENEFITS);
                  if (!Array.isArray(benefits)) return null;
                  return benefits.map((benefit: any, i: number) => (
                    <HStack key={i} spacing={3}>
                      <CheckIcon color="green.600" w={4} h={4} flexShrink={0} />
                      <Text color="gray.700" fontSize="sm">{benefit}</Text>
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

          {/* Locatário */}
          <Card animated borded color='blue'>
            <VStack spacing={5} align="start" h="full">
              <Box
                w="70px"
                h="70px"
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
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                  {t(HOME.SERVICES.RENTER.TITLE)}
                </Text>
                <Text color="gray.600" fontSize="sm" lineHeight="1.6">
                  {t(HOME.SERVICES.RENTER.DESCRIPTION)}
                </Text>
              </VStack>
              <VStack spacing={2} align="start" flex="1" w="full">
                {(() => {
                  const benefits = t(HOME.SERVICES.RENTER.BENEFITS);
                  if (!Array.isArray(benefits)) return null;
                  return benefits.map((benefit: any, i: number) => (
                    <HStack key={i} spacing={3}>
                      <CheckIcon color="blue.600" w={4} h={4} flexShrink={0} />
                      <Text color="gray.700" fontSize="sm">{benefit}</Text>
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

      {/* Por que Conduz - Benefícios Reais */}
      <Container>
        <Title
          title={t(HOME.BENEFITS.TITLE)}
          description={t(HOME.BENEFITS.SUBTITLE)}
          feature={t(HOME.BENEFITS.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const benefits = t(HOME.BENEFITS.ITEMS);
            if (!Array.isArray(benefits)) return null;

            const icons = ["📞", "💰", "💻", "✅"];
            return benefits.map((benefit: any, i: number) => (
              <Card key={i} animated borded>
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
                    fontSize="2xl"
                  >
                    {icons[i]}
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    {benefit.title}
                  </Text>
                  <Text color="gray.600" flex="1" fontSize="sm" lineHeight="1.6">
                    {benefit.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Recursos - Funcionalidades */}
      <Container softBg>
        <Title
          title={t(HOME.FEATURES.TITLE)}
          description="Tudo que você precisa em um único lugar"
          feature="PLATAFORMA"
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          {(() => {
            const features = t(HOME.FEATURES.ITEMS);
            if (!Array.isArray(features)) return null;

            const icons = ["📊", "💳", "🗺️", "📄"];
            return features.map((feature: any, i: number) => (
              <Card key={i} animated borded>
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
                    fontSize="2xl"
                  >
                    {icons[i]}
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {feature.title}
                  </Text>
                  <Text color="gray.600" flex="1" fontSize="sm" lineHeight="1.6">
                    {feature.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Depoimentos - Social Proof */}
      <Container>
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
                  <HStack spacing={1}>
                    {[...Array(5)].map((_, j) => (
                      <Text key={j} color="yellow.400" fontSize="lg">⭐</Text>
                    ))}
                  </HStack>
                  <Text fontSize="md" fontStyle="italic" color="gray.700" lineHeight="1.6">
                    "{testimonial.quote}"
                  </Text>
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" color="green.600" fontSize="sm">
                      {testimonial.author}
                    </Text>
                    <Text color="gray.500" fontSize="xs">
                      📍 {testimonial.location}
                    </Text>
                  </VStack>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* FAQ - Respostas Rápidas */}
      <Container softBg>
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
                  <AccordionButton py={4} _hover={{ bg: "gray.50" }}>
                    <Box flex="1" textAlign="left" fontWeight="semibold" color="gray.800">
                      {item.question}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4} color="gray.700" lineHeight="1.6">
                    {item.answer}
                  </AccordionPanel>
                </AccordionItem>
              ));
            })()}
          </Accordion>
        </Box>
      </Container>

      {/* CTA Final - Ação */}
      <Container>
        <Box textAlign="center" py={{ base: 12, md: 16 }}>
          <VStack spacing={6}>
            <VStack spacing={3}>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="gray.800">
                {t(HOME.CTA.TITLE)}
              </Text>
              <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="2xl">
                {t(HOME.CTA.SUBTITLE)}
              </Text>
            </VStack>
            <Button
              as={NextLink}
              href={getLocalizedHref("/request")}
              size="lg"
              px={8}
              py={4}
              colorScheme="green"
              rightIcon={<ArrowRightIcon />}
              shadow="lg"
              onClick={() => trackCheckoutStart('Driver Application - Final CTA')}
            >
              {t(HOME.CTA.BUTTON)}
            </Button>
          </VStack>
        </Box>
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('home');

