import { GetServerSideProps } from "next";
import NextLink from "next/link";
import { useLocalizedHref } from "@/lib/linkUtils";
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { loadTranslations, getTranslation } from "@/lib/translations";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import Hero from "@/components/Hero";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { COMMON } from "@/translations";

interface HomeProps {
  translations: any;
  locale: string;
}

export default function Home({ translations, locale }: HomeProps) {
  const getLocalizedHref = useLocalizedHref();
  
  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables);
  };

  const tHome = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.home, key, variables);
  };
  
  return (
    <>
          <Hero
            title={tHome("hero.title")}
            subtitle={tHome("hero.subtitle")}
            backgroundImage="/img/bg-portugal.jpg"
            badge="Motoristas TVDE"
            overlay
            actions={
              <HStack spacing={4}>
                <Button
                  as={NextLink}
                  href={getLocalizedHref("/request")}
                  size="lg"
                  px={8}
                  py={4}
                  shadow="lg"
                  colorScheme="green"
                  rightIcon={<ArrowRightIcon />}
                >
                  {tHome("hero.ctaPrimary")}
                </Button>
                <Button
                  as={NextLink}
                  href={t(COMMON.COMPANY.WHATSAPP)}
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
                  {tHome("hero.ctaSecondary")}
                </Button>
              </HStack>
            }
          >
            <Highlight
              title="Plataforma Completa"
              description={tHome("hero.description")}
              bgImage="/img/driver-app.jpg"
              delayImage={0.5}
              delayBox={0.8}
            />
          </Hero>

          {/* Como funciona */}
          <Container>
            <Title
              title={tHome("howItWorks.title")}
              description={tHome("howItWorks.subtitle")}
              feature="Como Funciona"
            />
            <ContainerDivisions template={{ base: "1fr", md: "repeat(3, 1fr)" }}>
              {(() => {
                const steps = tHome("howItWorks.steps");
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
              title={tHome("services.title")}
              description={tHome("services.subtitle")}
              feature="Tipos de Motorista"
            />
            <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
              <Card animated borded img="/img/service-drivers.jpg" color='green'>
                <VStack spacing={4} align="start">
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {tHome("services.affiliate.title")}
                  </Text>
                  <Text color="gray.600">
                    {tHome("services.affiliate.description")}
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

              <Card animated borded color='blue' img="/img/service-drivers.jpg">
                <VStack spacing={4} align="start">
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    {tHome("services.renter.title")}
                  </Text>
                  <Text color="gray.600">
                    {tHome("services.renter.description")}
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
              title={tHome("features.title")}
              description="Descubra as vantagens de trabalhar connosco"
              feature="Vantagens"
            />
            <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
              {(() => {
                const features = tHome("features.items");
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

          {/* Depoimentos */}
          <Container>
            <Title
              title={t(COMMON.TESTIMONIALS.TITLE)}
              description={t(COMMON.TESTIMONIALS.SUBTITLE)}
              feature={t(COMMON.TESTIMONIALS.FEATURE)}
            />
            <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
              {(() => {
                const testimonials = t(COMMON.TESTIMONIALS.ITEMS);
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
          <Container softBg>
            <Title
              title={t(COMMON.FAQ.TITLE)}
              description={t(COMMON.FAQ.SUBTITLE)}
              feature={t(COMMON.FAQ.FEATURE)}
            />
            <Box maxW="4xl" mx="auto">
              <Accordion allowToggle>
                {(() => {
                  const faqItems = t(COMMON.FAQ.ITEMS);
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
          <Container>
            <Title
              title="Pronto para Começar?"
              description="Junte-se à Conduz PT e comece a sua jornada como motorista TVDE"
              feature="CTA"
              ctaText="Candidatar-me Agora"
              cta={getLocalizedHref("/request")}
              center
            />
          </Container>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    const translations = await loadTranslations(locale, ["common", "home"]);

    return {
      props: {
        translations,
        locale,
      },
    };
  } catch (error) {
    console.error("Failed to load translations:", error);
    return {
      props: {
        translations: { common: {}, home: {} },
        locale: 'pt',
      },
    };
  }
};
