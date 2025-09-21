import { GetStaticProps } from "next";
import NextLink from "next/link";

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
import { loadTranslations } from "@/lib/translations";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { Progress } from "@/components/Progress";
import { PageProps } from "@/interface/Global";
import Hero from "@/components/Hero";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { CheckIcon, ArrowRightIcon } from "@chakra-ui/icons";

export default function Home({ tPage, tCommon }: PageProps) {

  return (
    <>
      <Hero
        title={tPage("hero.title")}
        subtitle={tPage("hero.subtitle")}
        backgroundImage="/img/bg-portugal.jpg"
        badge={tPage("hero.badge") as string}
        overlay
        actions={
          <HStack spacing={4}>
            <Button
              as={NextLink}
              href="/signup"
              size="lg"
              px={8}
              py={4}
              shadow="lg"
              colorScheme="green"
              rightIcon={<ArrowRightIcon />}
            >
              {tPage("hero.ctaPrimary")}
            </Button>
            <Button
              as={NextLink}
              href={tCommon("company.whats")}
              size="lg"
              px={8}
              py={4}
              variant="outline"
              colorScheme="whiteAlpha"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{
                bg: "whiteAlpha.100",
                borderColor: "whiteAlpha.600"
              }}
            >
              {tPage("hero.ctaSecondary")}
            </Button>
          </HStack>
        }
      >
        <Highlight
          title={tPage("hero.highlight.title")}
          description={tPage("hero.highlight.description")}
          bgImage="/img/driver-app.jpg"
          delayImage={0.5}
          delayBox={0.8}
        />
      </Hero>

      {/* Como funciona */}
      <Container>
        <Title
          title={tPage("howItWorks.title")}
          description={tPage("howItWorks.subtitle")}
          feature={tPage("howItWorks.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(3, 1fr)" }}>
          {(() => {
            const steps = tPage("howItWorks.steps");
            if (!Array.isArray(steps)) return null;

            return steps.map((step: any, i: number) => (
              <Card key={i} animated borded img={`/img/step-${i+1}.jpg`}>
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

      {/* Segmentos */}
      <Container softBg>
        <Title
          title={tPage("segments.title")}
          description={tPage("segments.subtitle")}
          feature={tPage("segments.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
          <Card animated borded img="/img/service-drivers.jpg" color='green'>
            <VStack spacing={4} align="start">
              <Text fontSize="xl" fontWeight="bold" color="green.600">
                {tPage("segments.drivers.title")}
              </Text>
              <Text color="gray.600">
                {tPage("segments.drivers.description")}
              </Text>
              <Button
                as={NextLink}
                href="/services/painels"
                colorScheme="green"
                size="sm"
                rightIcon={<ArrowRightIcon />}
              >
                {tPage("segments.drivers.cta")}
              </Button>
            </VStack>
          </Card>

          <Card animated borded color='red' img="/img/service-companies.jpg">
            <VStack spacing={4} align="start">
              <Text fontSize="xl" fontWeight="bold" color="red.600">
                {tPage("segments.companies.title")}
              </Text>
              <Text color="gray.600">
                {tPage("segments.companies.description")}
              </Text>
              <Button
                as={NextLink}
                href="/services/companies"
                colorScheme="red"
                size="sm"
                rightIcon={<ArrowRightIcon />}
              >
                {tPage("segments.companies.cta")}
              </Button>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      {/* Métricas */}
      <Container>
        <Title
          title={tPage("metrics.title")}
          description={tPage("metrics.subtitle")}
          feature={tPage("metrics.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}>
          {(() => {
            const stats = tPage("metrics.stats");

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
          title={tCommon("testimonials.title")}
          description={tCommon("testimonials.subtitle")}
          feature={tCommon("testimonials.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
          {(() => {
            const testimonials = tCommon("testimonials.items");
            if (!Array.isArray(testimonials)) return null;

            return testimonials.map((testimonial: any, i: number) => (
              <Card key={i} animated borded img={`/img/testmonials-${i+1}.jpg`}>
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
          title={tCommon("faq.title")}
          description={tCommon("faq.subtitle")}
          feature={tCommon("faq.feature")}
        />
        <Box maxW="4xl" mx="auto">
          <Accordion allowToggle>
            {(() => {
              const faqItems = tCommon("faq.items");
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
          title={tPage("cta.title")}
          description={tPage("cta.subtitle")}
          feature={tPage("cta.feature")}
          ctaText={tPage("cta.button")}
          cta={"/contact"}
          center
        />
      </Container>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale = "pt" }) => {
  try {
    const translations = await loadTranslations(locale, ["common", "home"]);
    const { common, home: page } = translations;

    return {
      props: {
        translations: { common, page },
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Failed to load translations:", error);
    return {
      props: {
        translations: { common: {}, page: {} },
      },
      revalidate: 3600,
    };
  }
};
