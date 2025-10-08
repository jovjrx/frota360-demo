import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Link,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { FaCheckCircle, FaWhatsapp, FaPhone, FaEnvelope } from "react-icons/fa";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";
import { loadTranslations } from "@/lib/translations";
import { SERVICES } from "@/translations/services/constants";

interface ServicePageProps extends PublicPageProps {
  slug: string;
}

interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  details: string;
  features?: string[];
}

export default function ServicePage({ tPage, tCommon, slug }: ServicePageProps) {
  const translatePageFn = (tPage as ((key: string) => unknown) | undefined) ?? ((key: string) => key);
  const translateCommon = tCommon ?? ((key: string) => key);
  const isDrivers = slug === "drivers";

  const translatePageText = (key: string): string => {
    const value = translatePageFn(key);
    return typeof value === "string" ? value : key;
  };

  const translatePageList = <T = unknown>(key: string): T[] => {
    const value = translatePageFn(key);
    return Array.isArray(value) ? (value as T[]) : [];
  };

  const benefitsList = translatePageList<string>(SERVICES.BENEFITS.CARD.LIST_ITEMS);
  const servicesList = translatePageList<ServiceItem>(SERVICES.SERVICES.LIST);

  const phoneNumber = translateCommon("company.phone");
  const sanitizedPhone =
    typeof phoneNumber === "string" ? phoneNumber.replace(/\s+/g, "") : "";
  const whatsappLink =
    translateCommon("company.whatsapp") ?? translateCommon("company.whats");
  const whatsappDescription = translateCommon("company.whatsDescription");
  const phoneDescription = translateCommon("company.phoneDescription");
  const emailAddress = translateCommon("company.email");
  const emailDescription = translateCommon("company.emailDescription");

  const ctaLink = translatePageFn(SERVICES.CTA.LINK);

  return (
    <>
      <Container softBg>
        <Title
          title={translatePageText(SERVICES.BENEFITS.TITLE)}
          description={translatePageText(SERVICES.BENEFITS.SUBTITLE)}
          feature={translatePageText(SERVICES.BENEFITS.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
          <Card
            title={translatePageText(SERVICES.BENEFITS.CARD.TITLE)}
            description={translatePageText(SERVICES.BENEFITS.CARD.DESCRIPTION)}
            animated
            borded
          >
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" color="gray.700">
                {translatePageText(SERVICES.BENEFITS.CARD.CONTENT)}
              </Text>
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={3}>
                  {translatePageText(SERVICES.BENEFITS.CARD.LIST_TITLE)}
                </Text>
                <VStack spacing={2} align="stretch">
                  {benefitsList.map((benefit, index) => (
                    <HStack key={index} spacing={3}>
                      <Icon as={FaCheckCircle} color="green.500" />
                      <Text>{benefit}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </Card>

          <Highlight
            title={translatePageText(SERVICES.BENEFITS.HIGHLIGHT.TITLE)}
            description={translatePageText(SERVICES.BENEFITS.HIGHLIGHT.DESCRIPTION)}
            bgImage={isDrivers ? "/img/service-drivers.jpg" : "/img/service-companies.jpg"}
            bgSizePersonalized="cover"
            overlayPos="bl"
            delayImage={0.2}
            delayBox={0.5}
          />
        </ContainerDivisions>
      </Container>

      <Container>
        <Title
          title={translatePageText(SERVICES.SERVICES.TITLE)}
          description={translatePageText(SERVICES.SERVICES.SUBTITLE)}
          feature={translatePageText(SERVICES.SERVICES.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(3, 1fr)" }}>
          {servicesList.map((service, index) => (
              <Card
                key={index}
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
                  {(service.features ?? []).length > 0 && (
                    <Box w="full">
                      <VStack spacing={1} align="stretch">
                        {(service.features ?? []).map((feature, featureIndex) => (
                          <HStack key={featureIndex} spacing={2} fontSize="xs">
                            <Box w={1.5} h={1.5} bg="green.400" borderRadius="full" />
                            <Text>{feature}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Card>
            ))}
        </ContainerDivisions>
      </Container>

      <Container softBg>
        <Title
          title={translatePageText(SERVICES.SUPPORT.TITLE)}
          description={translatePageText(SERVICES.SUPPORT.SUBTITLE)}
          feature={translatePageText(SERVICES.SUPPORT.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(3, 1fr)" }}>
          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaWhatsapp} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {whatsappDescription}
              </Text>
              <Link href={typeof whatsappLink === "string" ? whatsappLink : undefined} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {phoneNumber}
                </Button>
              </Link>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaPhone} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {phoneDescription}
              </Text>
              <Link href={sanitizedPhone ? `tel:${sanitizedPhone}` : undefined} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {phoneNumber}
                </Button>
              </Link>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaEnvelope} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {emailDescription}
              </Text>
              <Link href={typeof emailAddress === "string" ? `mailto:${emailAddress}` : undefined} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {emailAddress}
                </Button>
              </Link>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      <Container softBg>
        <Title
          title={translatePageText(SERVICES.CTA.TITLE)}
          description={translatePageText(SERVICES.CTA.SUBTITLE)}
          feature={translatePageText(SERVICES.CTA.FEATURE)}
          ctaText={translatePageText(SERVICES.CTA.BUTTON)}
          cta={typeof ctaLink === "string" ? ctaLink : undefined}
          center
        />
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR("services-drivers", async (context) => {
  const slugParam = context.params?.slug;
  const slug = typeof slugParam === "string" ? slugParam : "drivers";
  const locale = (context.locale || context.defaultLocale || "pt") as string;
  const pageName = slug === "companies" ? "services-companies" : "services-drivers";
  const translations = await loadTranslations(locale, ["common/common", `public/${pageName}`]);

  return {
    slug,
    translations: {
      common: translations["common/common"] || {},
      page: translations[`public/${pageName}`] || {},
    },
  };
});
