import { useEffect } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Link,
  Heading,
  SimpleGrid,
  Badge,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import PaymentsCallout from "@/components/public/PaymentsCallout";
import ReferralSection from "@/components/public/ReferralSection";
import FinancingTeaser from "@/components/public/FinancingTeaser";
import { FaCheckCircle, FaWhatsapp, FaPhone, FaEnvelope, FaRocket, FaChartLine, FaShieldAlt } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";
import { SERVICES } from "@/translations/services/constants";
import { useFacebookTracking } from "@/hooks/useFacebookTracking";
import { useLocalizedHref } from "@/lib/linkUtils";

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
  const { trackContentView, trackCheckoutStart } = useFacebookTracking();
  const getLocalizedHref = useLocalizedHref();

  // Track ViewContent ao carregar a página
  useEffect(() => {
    trackContentView('Drivers Page', 'drivers');
  }, [trackContentView]);

  const benefitsData = pageT(SERVICES.BENEFITS.CARD.LIST_ITEMS);
  const benefitsList = Array.isArray(benefitsData) ? (benefitsData as string[]) : [];

  const servicesData = pageT(SERVICES.SERVICES.LIST);
  const servicesList = Array.isArray(servicesData) ? (servicesData as ServiceItem[]) : [];

  const t = (key: string, fallback?: string): string => {
    const value = pageT(key);
    return typeof value === 'string' ? value : (fallback || key);
  };

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
      {/* Header Section */}
      <Container softBg>
        <Title
          title="Seja Motorista TVDE"
          description="Comece a faturar em dias, não semanas. Gestão completa, suporte 24/7 e tecnologia que simplifica."
          feature="PARA MOTORISTAS"
        />
      </Container>

      {/* 3 Cards de Valor */}
      <Container>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 8 }}>
          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Box
                p={4}
                borderRadius="full"
                bg="green.100"
                color="green.600"
              >
                <Icon as={FaRocket} boxSize={8} />
              </Box>
              <Heading as="h3" fontSize="xl" fontWeight="bold">
                Comece Rápido
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Aprovação em 24h. Documentos validados rapidamente e você começa a trabalhar já amanhã.
              </Text>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Box
                p={4}
                borderRadius="full"
                bg="blue.100"
                color="blue.600"
              >
                <Icon as={FaChartLine} boxSize={8} />
              </Box>
              <Heading as="h3" fontSize="xl" fontWeight="bold">
                Maximize Ganhos
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Repasse IVA 6%, taxa fixa €25/semana. Você sabe exatamente quanto vai ganhar.
              </Text>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Box
                p={4}
                borderRadius="full"
                bg="purple.100"
                color="purple.600"
              >
                <Icon as={FaShieldAlt} boxSize={8} />
              </Box>
              <Heading as="h3" fontSize="xl" fontWeight="bold">
                Total Suporte
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Suporte 24/7 via WhatsApp. Pessoa real para resolver seus problemas rapidamente.
              </Text>
            </VStack>
          </Card>
        </SimpleGrid>
      </Container>

      {/* Tipos de Motorista - DESTAQUE */}
      <Container softBg>
        <Title
          title="Tipos de Motorista"
          description="Escolha o modelo que se adapta melhor a você e comece a ganhar hoje"
          feature="ESCOLHA SEU MODELO"
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
          <Card
            title="🚗 Motorista Afiliado"
            description="Tem carro próprio e quer maximizar ganhos"
            animated
            borded
            img="/img/service-drivers.jpg"
            color="green"
          >
            <VStack spacing={5} align="start">
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                MAIS POPULAR
              </Badge>
              <Text fontSize="md" color="gray.700" lineHeight="1.7">
                Você tem seu próprio carro e quer maximizar seus ganhos. Oferecemos gestão completa, repasse de IVA 6%, e taxa fixa de €25/semana.
              </Text>
              <Box w="full">
                <Text fontWeight="bold" color="green.700" mb={3} fontSize="lg">
                  ✓ Benefícios Incluídos:
                </Text>
                <VStack spacing={3} align="stretch">
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                    <Text fontWeight="medium">Repasse IVA 6%</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                    <Text fontWeight="medium">Taxa fixa €25/semana</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                    <Text fontWeight="medium">Pagamentos toda segunda-feira</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                    <Text fontWeight="medium">Gestão administrativa completa</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                    <Text fontWeight="medium">Suporte 24/7 via WhatsApp</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                    <Text fontWeight="medium">Aprovação em 24h</Text>
                  </HStack>
                </VStack>
              </Box>
              <Button
                as={NextLink}
                href={getLocalizedHref("/request")}
                colorScheme="green"
                size="lg"
                w="full"
                rightIcon={<FiArrowRight />}
                onClick={() => trackCheckoutStart('Driver Application - Affiliate')}
              >
                Candidatar-me como Afiliado
              </Button>
            </VStack>
          </Card>

          <Card
            title="🚙 Motorista Locatário"
            description="Não tem carro? Alugue uma viatura TVDE"
            animated
            borded
            img="/img/driver-app.jpg"
            color="blue"
          >
            <VStack spacing={5} align="start">
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                SEM INVESTIMENTO INICIAL
              </Badge>
              <Text fontSize="md" color="gray.700" lineHeight="1.7">
                Não tem carro? Sem problema. Oferecemos aluguel de viaturas TVDE completas, prontas para trabalhar, com seguro incluído e manutenção garantida.
              </Text>
              <Box w="full">
                <Text fontWeight="bold" color="blue.700" mb={3} fontSize="lg">
                  ✓ Benefícios Incluídos:
                </Text>
                <VStack spacing={3} align="stretch">
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="blue.500" boxSize={5} />
                    <Text fontWeight="medium">Viatura TVDE completa</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="blue.500" boxSize={5} />
                    <Text fontWeight="medium">Seguro incluído</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="blue.500" boxSize={5} />
                    <Text fontWeight="medium">Manutenção garantida</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="blue.500" boxSize={5} />
                    <Text fontWeight="medium">Comece já amanhã</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="blue.500" boxSize={5} />
                    <Text fontWeight="medium">Sem custos de manutenção</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaCheckCircle} color="blue.500" boxSize={5} />
                    <Text fontWeight="medium">Flexibilidade de contrato</Text>
                  </HStack>
                </VStack>
              </Box>
              <Button
                as={NextLink}
                href={getLocalizedHref("/request")}
                colorScheme="blue"
                size="lg"
                w="full"
                rightIcon={<FiArrowRight />}
                onClick={() => trackCheckoutStart('Driver Application - Renter')}
              >
                Candidatar-me como Locatário
              </Button>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      {/* Pagamentos Garantidos */}
      <PaymentsCallout t={t} />

      {/* Sistema de Comissões */}
      <ReferralSection t={t} />

      {/* Módulos Funcionais */}
      <Container softBg>
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

      {/* CTA Final */}
      <Container softBg>
        <VStack spacing={8} py={{ base: 12, md: 16 }} align="center" textAlign="center">
          <Badge colorScheme="green" fontSize="md" px={4} py={2}>
            COMECE HOJE
          </Badge>
          <Heading as="h2" fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }} fontWeight="bold">
            Pronto para começar a ganhar?
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} color="gray.600" maxW="3xl">
            Junte-se aos motoristas que já escolheram a Frota360.pt. Aprovação rápida, pagamentos garantidos e suporte 24/7.
          </Text>
          <HStack spacing={4} flexWrap="wrap" justify="center">
            <Button
              as={NextLink}
              href={getLocalizedHref("/request")}
              size="lg"
              colorScheme="green"
              px={8}
              py={6}
              fontSize="lg"
              rightIcon={<FiArrowRight />}
              shadow="lg"
              _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
              transition="all 0.3s"
              onClick={() => trackCheckoutStart('Driver Application - Final CTA')}
            >
              Realizar Solicitação
            </Button>
            <Button
              as={Link}
              href={typeof whatsappLink === "string" ? whatsappLink : undefined}
              isExternal
              size="lg"
              variant="outline"
              colorScheme="green"
              px={8}
              py={6}
              fontSize="lg"
              leftIcon={<FaWhatsapp />}
            >
              Falar no WhatsApp
            </Button>
          </HStack>
          <Box pt={4}>
            <Text fontSize="sm" color="gray.500">
              ✓ Aprovação em 24h • ✓ Sem taxas escondidas • ✓ Suporte 7 dias por semana
            </Text>
          </Box>
        </VStack>
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR("services-drivers");
