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
import { loadTranslations } from "@/lib/translations";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { PageProps } from "@/interface/Global";
import Hero from "@/components/Hero";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { ContentManager } from "@/components/ContentManager";
import { COMMON } from "@/translations";

export default function Home({ tPage, tCommon, locale }: PageProps & { locale: string }) {
  const getLocalizedHref = useLocalizedHref();
  
  return (
    <ContentManager page="home" locale={locale} translations={{ page: tPage, common: tCommon }}>
      {(content) => (
        <>
          <Hero
            title={content.page("hero.title") || tPage("hero.title")}
            subtitle={content.page("hero.subtitle") || tPage("hero.subtitle")}
            backgroundImage="/img/bg-portugal.jpg"
            badge={content.page("hero.badge") || tPage("hero.badge") as string}
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
                  {content.page("hero.ctaPrimary") || tPage("hero.ctaPrimary")}
                </Button>
                <Button
                  as={NextLink}
                  href={tCommon(COMMON.COMPANY.WHATSAPP)}
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
                  {content.page("hero.ctaSecondary") || tPage("hero.ctaSecondary")}
                </Button>
              </HStack>
            }
          >
            <Highlight
              title={content.page("hero.highlight.title") || tPage("hero.highlight.title")}
              description={content.page("hero.highlight.description") || tPage("hero.highlight.description")}
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

          {/* Tipos de Motorista */}
          <Container softBg>
            <Title
              title={tPage("driverTypes.title")}
              description={tPage("driverTypes.subtitle")}
              feature={tPage("driverTypes.feature")}
            />
            <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
              <Card animated borded img="/img/service-drivers.jpg" color='green'>
                <VStack spacing={4} align="start">
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {tPage("driverTypes.affiliate.title")}
                  </Text>
                  <Text color="gray.600">
                    {tPage("driverTypes.affiliate.description")}
                  </Text>
                  <Button
                    as={NextLink}
                    href={getLocalizedHref("/services/drivers")}
                    colorScheme="green"
                    size="sm"
                    rightIcon={<ArrowRightIcon />}
                  >
                    {tPage("driverTypes.affiliate.cta")}
                  </Button>
                </VStack>
              </Card>

              <Card animated borded color='blue' img="/img/service-companies.jpg">
                <VStack spacing={4} align="start">
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    {tPage("driverTypes.renter.title")}
                  </Text>
                  <Text color="gray.600">
                    {tPage("driverTypes.renter.description")}
                  </Text>
                  <Button
                    as={NextLink}
                    href={getLocalizedHref("/services/drivers")}
                    colorScheme="blue"
                    size="sm"
                    rightIcon={<ArrowRightIcon />}
                  >
                    {tPage("driverTypes.renter.cta")}
                  </Button>
                </VStack>
              </Card>
            </ContainerDivisions>
          </Container>

          {/* Depoimentos */}
          <Container>
            <Title
              title={tCommon(COMMON.TESTIMONIALS.TITLE)}
              description={tCommon(COMMON.TESTIMONIALS.SUBTITLE)}
              feature={tCommon(COMMON.TESTIMONIALS.FEATURE)}
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
          <Container softBg>
            <Title
              title={tCommon(COMMON.FAQ.TITLE)}
              description={tCommon(COMMON.FAQ.SUBTITLE)}
              feature={tCommon(COMMON.FAQ.FEATURE)}
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
          <Container>
            <Title
              title={tPage("cta.title")}
              description={tPage("cta.subtitle")}
              feature={tPage("cta.feature")}
              ctaText={tPage("cta.button")}
              cta={getLocalizedHref("/request")}
              center
            />
          </Container>
        </>
      )}
    </ContentManager>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    const translations = await loadTranslations(locale, ["common", "home"]);
    const { common, home: page } = translations;

    return {
      props: {
        translations: { common, page },
        locale,
      },
    };
  } catch (error) {
    console.error("Failed to load translations:", error);
    return {
      props: {
        translations: { common: {}, page: {} },
        locale: 'pt',
      },
    };
  }
};
