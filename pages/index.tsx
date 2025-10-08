import NextLink from "next/link";
import { useMemo } from "react";
import { useLocalizedHref } from "@/lib/linkUtils";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";

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

  return (
    <>
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

      {/* Tipos de Motorista */}
      <Container softBg>
        <Title
          title={t(HOME.SERVICES.TITLE)}
          description={t(HOME.SERVICES.SUBTITLE)}
          feature="Tipos de Motorista"
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          <Card animated borded img="/img/service-drivers.jpg" color='green'>
            <VStack spacing={4} align="start">
              <Text fontSize="xl" fontWeight="bold" color="green.600">
                {t(HOME.SERVICES.AFFILIATE.TITLE)}
              </Text>
              <Text color="gray.600">
                {t(HOME.SERVICES.AFFILIATE.DESCRIPTION)}
              </Text>
              <Button
                as={NextLink}
                href={getLocalizedHref("/request")}
                colorScheme="green"
                size="sm"
                rightIcon={<ArrowRightIcon />}
              >
                Candidatar-me
              </Button>
            </VStack>
          </Card>

          <Card animated borded color='blue' img="/img/driver-app.jpg">
            <VStack spacing={4} align="start">
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                {t(HOME.SERVICES.RENTER.TITLE)}
              </Text>
              <Text color="gray.600">
                {t(HOME.SERVICES.RENTER.DESCRIPTION)}
              </Text>
              <Button
                as={NextLink}
                href={getLocalizedHref("/request")}
                colorScheme="blue"
                size="sm"
                rightIcon={<ArrowRightIcon />}
              >
                Candidatar-me
              </Button>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      {/* Porquê Escolher a Conduz PT */}
      <Container>
        <Title
          title={t(HOME.FEATURES.TITLE)}
          description="Descubra as vantagens de trabalhar connosco"
          feature="VANTAGENS"
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          {(() => {
            const features = t(HOME.FEATURES.ITEMS);
            if (!Array.isArray(features)) return null;

            return features.map((feature: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start">
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {feature.title}
                  </Text>
                  <Text color="gray.600">
                    {feature.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Métricas */}
      <Container>
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
              <Card key={i} title={item?.label || "Sem título"}
                description={item?.description || "Sem descrição"} animated borded>
                <Progress
                  currentValue={Number(item?.value) || 0}
                  totalValue={Number(item?.total) || 100}
                  unit={item?.unit || ""}
                  colorScheme="green"
                  size="lg"
                  animated
                  variant={i === 0 ? "gradient" : i === 1 ? "striped" : i === 2 ? "glow" : "default"}
                />
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
              <Card key={i} animated borded img={`/img/testmonials-${i + 1}.jpg`}>
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
