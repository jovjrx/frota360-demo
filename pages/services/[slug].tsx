import { GetServerSideProps } from "next";
import {
  Box,
  Text,
  VStack,
  SimpleGrid,
  HStack,
  Badge,
  Button,
  Icon,
  Link
} from "@chakra-ui/react";
import { loadTranslations } from "@/lib/translations";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { PageProps } from "@/interface/Global";
import Hero from "@/components/Hero";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { useRouter } from "next/router";
import { FaCheckCircle, FaArrowRight, FaWhatsapp, FaPhone, FaEnvelope } from "react-icons/fa";

interface ServicePageProps extends PageProps {
  slug: string;
  locale: string;
}

export default function ServicePage({ tPage, tCommon, slug, locale }: ServicePageProps) {
  const router = useRouter();

  // Determinar se é página de motoristas ou empresas
  const isDrivers = slug === 'drivers';
  const isCompanies = slug === 'companies';
  const pageName = isDrivers ? 'services-drivers' : 'services-companies';

  return (
    <>
      <Container softBg>
        <Title
          title={tPage("benefits.title") || tPage("benefits.title")}
          description={tPage("benefits.subtitle") || tPage("benefits.subtitle")}
          feature={tPage("benefits.feature") || tPage("benefits.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeat(2, 1fr)" }}>
          <Card
            title={tPage("benefits.card.title")}
            description={tPage("benefits.card.description")}
            animated
            borded
          >
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" color="gray.700">
                {tPage("benefits.card.content")}
              </Text>
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={3}>
                  {tPage("benefits.card.list.title")}
                </Text>
                <VStack spacing={2} align="stretch">
                  {(() => {
                    const benefits = tPage("benefits.card.list.items");
                    if (!Array.isArray(benefits)) return null;
                    return benefits.map((benefit: any, i: number) => (
                      <HStack key={i} spacing={3}>
                        <Icon as={FaCheckCircle} color="green.500" />
                        <Text>{benefit}</Text>
                      </HStack>
                    ));
                  })()}
                </VStack>
              </Box>
            </VStack>
          </Card>

          <Highlight
            title={tPage("benefits.highlight.title")}
            description={tPage("benefits.highlight.description")}
            bgImage={isDrivers ? "/img/service-drivers.jpg" : "/img/service-companies.jpg"}
            bgSizePersonalized={'cover'}
            overlayPos="bl"
            delayImage={0.2}
            delayBox={0.5}
          />
        </ContainerDivisions>
      </Container>

      <Container>
        <Title
          title={tPage("services.title")}
          description={tPage("services.subtitle")}
          feature={tPage("services.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}>
          {(() => {
            const services = tPage("services.list");
            if (!Array.isArray(services)) return null;
            return services.map((service: any, i: number) => (
              <Card
                key={i}
                title={service.title}
                description={service.description}
                animated
                borded
              >
                <VStack spacing={4} align="center" textAlign="center">
                  <Text fontSize="3xl" role="img" aria-label={service.title}>
                    {service.icon}
                  </Text>
                  <Text fontSize="md" color="gray.600">
                    {service.details}
                  </Text>
                  {service.features && (
                    <Box w="full">
                      <VStack spacing={1} align="stretch">
                        {service.features.map((feature: string, j: number) => (
                          <HStack key={j} spacing={2} fontSize="xs">
                            <Box w={1.5} h={1.5} bg="green.400" borderRadius="full" />
                            <Text>{feature}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      <Container softBg>
        <Title
          title={tPage("support.title")}
          description={tPage("support.subtitle")}
          feature={tPage("support.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(3, 1fr)" }}>
          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaWhatsapp} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {tCommon("company.whatsDescription")}
              </Text>
              <Link href={tCommon("company.whats")} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {tCommon("company.phone")}
                </Button>
              </Link>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaPhone} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {tCommon("company.phoneDescription")}
              </Text>
              <Link href={`tel:${tCommon("company.phone")}`} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {tCommon("company.phone")}
                </Button>
              </Link>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaEnvelope} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {tCommon("company.emailDescription")}
              </Text>
              <Link href={`mailto:${tCommon("company.email")}`} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {tCommon("company.email")}
                </Button>
              </Link>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      <Container>
        <Title
          title={tPage("cta.title")}
          description={tPage("cta.subtitle")}
          feature={tPage("cta.feature")}
          ctaText={tPage("cta.button")}
          cta="/contact"
          center
        />
      </Container>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;

  try {
    // Extract locale from middleware header
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    const translations = await loadTranslations(locale, ["common", `services-${slug}`]);
    const { common, [`services-${slug}`]: page } = translations;

    return {
      props: {
        translations: { common, page },
        slug,
        locale,
      },
    };
  } catch (error) {
    console.error("Failed to load translations:", error);
    return {
      props: {
        translations: { common: {}, page: {} },
        slug,
        locale: 'pt',
      },
    };
  }
};

