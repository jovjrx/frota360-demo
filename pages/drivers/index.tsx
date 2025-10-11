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
import { SERVICES } from "@/translations/services/constants";

interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  details: string;
  features?: string[];
}

export default function DriversPage({ tPage, tCommon }: PublicPageProps) {
  const pageT = (tPage as ((key: string) => unknown) | undefined) ?? ((key: string) => key);
  const commonT = (tCommon as ((key: string) => string) | undefined) ?? ((key: string) => key);

  const benefitsData = pageT(SERVICES.BENEFITS.CARD.LIST_ITEMS);
  const benefitsList = Array.isArray(benefitsData) ? (benefitsData as string[]) : [];

  const servicesData = pageT(SERVICES.SERVICES.LIST);
  const servicesList = Array.isArray(servicesData) ? (servicesData as ServiceItem[]) : [];

  const phoneNumber = commonT("company.phone");
  const sanitizedPhone = typeof phoneNumber === "string" ? phoneNumber.replace(/\s+/g, "") : "";
  const whatsappCandidate = commonT("company.whatsapp");
  const whatsappFallback = commonT("company.whats");
  const whatsappLink = typeof whatsappCandidate === "string" ? whatsappCandidate : whatsappFallback;
  const whatsappDescription = commonT("company.whatsDescription");
  const phoneDescription = commonT("company.phoneDescription");
  const emailAddress = commonT("company.email");
  const emailDescription = commonT("company.emailDescription");

  const ctaValue = pageT(SERVICES.CTA.LINK);
  const ctaLink = typeof ctaValue === "string" ? ctaValue : undefined;

  return (
    <>
      <Container softBg>
        <Title
          title={pageT(SERVICES.BENEFITS.TITLE) as string}
          description={pageT(SERVICES.BENEFITS.SUBTITLE) as string}
          feature={pageT(SERVICES.BENEFITS.FEATURE) as string}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
          <Card
            title={pageT(SERVICES.BENEFITS.CARD.TITLE) as string}
            description={pageT(SERVICES.BENEFITS.CARD.DESCRIPTION) as string}
            animated
            borded
          >
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" color="gray.700">
                {pageT(SERVICES.BENEFITS.CARD.CONTENT) as string}
              </Text>
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={3}>
                  {pageT(SERVICES.BENEFITS.CARD.LIST_TITLE) as string}
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
            title={pageT(SERVICES.BENEFITS.HIGHLIGHT.TITLE) as string}
            description={pageT(SERVICES.BENEFITS.HIGHLIGHT.DESCRIPTION) as string}
            bgImage="/img/service-drivers.jpg"
            bgSizePersonalized="cover"
            overlayPos="bl"
            delayImage={0.2}
            delayBox={0.5}
          />
        </ContainerDivisions>
      </Container>

      <Container>
        <Title
          title={pageT(SERVICES.SERVICES.TITLE) as string}
          description={pageT(SERVICES.SERVICES.SUBTITLE) as string}
          feature={pageT(SERVICES.SERVICES.FEATURE) as string}
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

      {/* Seção de Explicação de Ganhos */}
      <Container softBg>
        <Title
          title={pageT(SERVICES.EARNINGS.TITLE) as string}
          description={pageT(SERVICES.EARNINGS.SUBTITLE) as string}
          feature={pageT(SERVICES.EARNINGS.FEATURE) as string}
        />
        <Card
          title={pageT(SERVICES.EARNINGS.CARD.TITLE) as string}
          description={pageT(SERVICES.EARNINGS.CARD.DESCRIPTION) as string}
          animated
          borded
        >
          <VStack spacing={3} align="stretch">
            {(() => {
              const items = pageT(SERVICES.EARNINGS.CARD.ITEMS);
              if (!Array.isArray(items)) return null;

              return items.map((item: any, index: number) => (
                <HStack key={index} spacing={3} align="start" p={3} bg={index % 2 === 0 ? 'gray.50' : 'white'} borderRadius="md">
                  <Box w="2px" h="full" bg={item.label.startsWith('-') ? 'red.400' : item.label.startsWith('=') ? 'green.500' : 'blue.400'} />
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontWeight="bold" color={item.label.startsWith('=') ? 'green.600' : 'gray.800'}>
                      {item.label}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {item.description}
                    </Text>
                  </VStack>
                </HStack>
              ));
            })()}
          </VStack>
        </Card>
      </Container>

      {/* Seção de Financiamento */}
      <Container>
        <Title
          title={pageT(SERVICES.FINANCING.TITLE) as string}
          description={pageT(SERVICES.FINANCING.SUBTITLE) as string}
          feature={pageT(SERVICES.FINANCING.FEATURE) as string}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
          <Card
            title={pageT(SERVICES.FINANCING.CARD.TITLE) as string}
            description={pageT(SERVICES.FINANCING.CARD.DESCRIPTION) as string}
            animated
            borded
          >
            <VStack spacing={4} align="stretch">
              <Box p={4} bg="orange.50" borderRadius="md" borderLeft="4px" borderLeftColor="orange.400">
                <Text fontSize="sm" color="orange.800" fontWeight="semibold">
                  {pageT(SERVICES.FINANCING.CARD.ALERT) as string}
                </Text>
              </Box>

              <Box>
                <Text fontWeight="semibold" color="green.600" mb={3}>
                  Benefícios:
                </Text>
                <VStack spacing={2} align="stretch">
                  {(() => {
                    const benefits = pageT(SERVICES.FINANCING.CARD.BENEFITS);
                    if (!Array.isArray(benefits)) return null;

                    return benefits.map((benefit, index) => (
                      <HStack key={index} spacing={3}>
                        <Icon as={FaCheckCircle} color="green.500" />
                        <Text fontSize="sm">{benefit}</Text>
                      </HStack>
                    ));
                  })()}
                </VStack>
              </Box>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                {pageT(SERVICES.FINANCING.CARD.EXAMPLE.TITLE) as string}
              </Text>
              <Text fontSize="sm" color="gray.700" fontStyle="italic">
                {pageT(SERVICES.FINANCING.CARD.EXAMPLE.SCENARIO) as string}
              </Text>
              
              <VStack spacing={2} align="stretch" mt={2}>
                {(() => {
                  const details = pageT(SERVICES.FINANCING.CARD.EXAMPLE.DETAILS);
                  if (!Array.isArray(details)) return null;

                  return details.map((detail, index) => (
                    <HStack key={index} spacing={2}>
                      <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                      <Text fontSize="sm" color="gray.700">{detail}</Text>
                    </HStack>
                  ));
                })()}
              </VStack>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      {/* Seção de Requisitos e Documentos */}
      <Container softBg>
        <Title
          title={pageT(SERVICES.REQUIREMENTS.TITLE) as string}
          description={pageT(SERVICES.REQUIREMENTS.SUBTITLE) as string}
          feature={pageT(SERVICES.REQUIREMENTS.FEATURE) as string}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(3, 1fr)" }}>
          {/* Documentos Necessários */}
          <Card
            title={pageT(SERVICES.REQUIREMENTS.DOCUMENTS.TITLE) as string}
            animated
            borded
          >
            <VStack spacing={2} align="stretch">
              {(() => {
                const documents = pageT(SERVICES.REQUIREMENTS.DOCUMENTS.ITEMS);
                if (!Array.isArray(documents)) return null;

                return documents.map((doc, index) => (
                  <HStack key={index} spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text fontSize="sm">{doc}</Text>
                  </HStack>
                ));
              })()}
            </VStack>
          </Card>

          {/* Conexão com Plataformas */}
          <Card
            title={pageT(SERVICES.REQUIREMENTS.INTEGRATIONS.TITLE) as string}
            description={pageT(SERVICES.REQUIREMENTS.INTEGRATIONS.DESCRIPTION) as string}
            animated
            borded
          >
            <VStack spacing={3} align="stretch">
              {(() => {
                const integrations = pageT(SERVICES.REQUIREMENTS.INTEGRATIONS.ITEMS);
                if (!Array.isArray(integrations)) return null;

                return integrations.map((integration: any, index) => (
                  <Box key={index} p={3} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" color="blue.700">
                      {integration.platform}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {integration.requirement}
                    </Text>
                  </Box>
                ));
              })()}
            </VStack>
          </Card>

          {/* Dados Bancários */}
          <Card
            title={pageT(SERVICES.REQUIREMENTS.BANKING.TITLE) as string}
            description={pageT(SERVICES.REQUIREMENTS.BANKING.DESCRIPTION) as string}
            animated
            borded
          >
            <VStack spacing={2} align="stretch">
              {(() => {
                const banking = pageT(SERVICES.REQUIREMENTS.BANKING.ITEMS);
                if (!Array.isArray(banking)) return null;

                return banking.map((item, index) => (
                  <HStack key={index} spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text fontSize="sm">{item}</Text>
                  </HStack>
                ));
              })()}
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      {/* Suporte */}
      <Container>
        <Title
          title={pageT(SERVICES.SUPPORT.TITLE) as string}
          description={pageT(SERVICES.SUPPORT.SUBTITLE) as string}
          feature={pageT(SERVICES.SUPPORT.FEATURE) as string}
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
          title={pageT(SERVICES.CTA.TITLE) as string}
          description={pageT(SERVICES.CTA.SUBTITLE) as string}
          feature={pageT(SERVICES.CTA.FEATURE) as string}
          ctaText={pageT(SERVICES.CTA.BUTTON) as string}
          cta={ctaLink}
          center
        />
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR("services-drivers");
