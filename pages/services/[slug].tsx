import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Link
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { FaCheckCircle, FaWhatsapp, FaPhone, FaEnvelope } from "react-icons/fa";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";

interface ServicePageProps extends PublicPageProps {
  slug: string;
}

export default function ServicePage({ tPage, slug }: ServicePageProps) {
  const isDrivers = slug === 'drivers';
  return (
    <>
      <Container softBg>
        <Title
          title={tPage("benefits.title")}
          description={tPage("benefits.subtitle")}
          feature={tPage("benefits.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
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
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(3, 1fr)" }}>
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
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(3, 1fr)" }}>
          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaWhatsapp} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {tPage("company.whatsDescription")}
              </Text>
              <Link href={tPage("company.whats")} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {tPage("company.phone")}
                </Button>
              </Link>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaPhone} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {tPage("company.phoneDescription")}
              </Text>
              <Link href={`tel:${tPage("company.phone")}`} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {tPage("company.phone")}
                </Button>
              </Link>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="center" textAlign="center">
              <Icon as={FaEnvelope} fontSize="3xl" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                {tPage("company.emailDescription")}
              </Text>
              <Link href={`mailto:${tPage("company.email")}`} isExternal>
                <Button colorScheme="green" variant="outline" size="sm">
                  {tPage("company.email")}
                </Button>
              </Link>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>

      <Container softBg>
        <Title
          title={isDrivers ? "Pronto para Fazer Parte?" : tPage("cta.title")}
          description={isDrivers ? "Você conduz, nós cuidamos do resto! Candidate-se agora e comece sua jornada como motorista TVDE." : tPage("cta.subtitle")}
          feature="PRÓXIMO PASSO"
          ctaText={isDrivers ? "Candidatar-me Agora" : tPage("cta.button")}
          cta={isDrivers ? "/request" : "/contact"}
          center
        />
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('services-drivers', async (context, user) => {
  const slug = context.params?.slug as string;
  
  // Retornar slug para a página
  return { slug };
});
