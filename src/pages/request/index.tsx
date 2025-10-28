import {
  Box,
  Text,
  VStack,
  Link,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { RequestForm } from "@/components/RequestForm";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";
import { REQUEST, COMMON } from "@/translations";
import { useSiteContact } from "@/hooks/useSiteContact";

export default function RequestPage({ tPage, tCommon }: PublicPageProps) {
  const contact = useSiteContact();

  return (
    <>
      <Container softBg>
        <Title
          title={tPage(REQUEST.HERO.TITLE)}
          description={tPage(REQUEST.HERO.SUBTITLE)}
          feature={tPage(REQUEST.HERO.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "2fr 1fr" }}>
          <RequestForm tPage={tPage} tCommon={tCommon} />

          <VStack spacing={4} minW={'full'} align={'stretch'}>
            <Card
              title={tPage(REQUEST.CONTACT_INFO.TITLE)}
              borded
            >
              <VStack spacing={1} align="stretch">
                <Text>{contact.address}</Text>
                <Text>{contact.postalCode}</Text>
                <Text>{contact.city} - {contact.country}</Text>
              </VStack>
            </Card>

            <Card
              title="WhatsApp"
              borded
            >
              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" color="gray.600">{tCommon("company.phoneDescription")}</Text>
                <Link href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} isExternal display="block" textAlign="center">
                  <Text color="green.600" fontWeight="bold">
                    {contact.phone}
                  </Text>
                </Link>
              </VStack>
            </Card>

            <Card
              title="Email"
              borded
            >
              <VStack spacing={2} align="stretch">
                <Text fontSize="sm" color="gray.600">{tCommon("company.emailDescription")}</Text>
                <Link href={`mailto:${contact.email}`} isExternal display="block" textAlign="center">
                  <Text color="blue.600" fontWeight="bold">
                    {contact.email}
                  </Text>
                </Link>
              </VStack>
            </Card>
          </VStack>
        </ContainerDivisions>
      </Container>

      {/* Tipos de Motorista */}
      <Container>
        <Title
          title={tPage("driverTypes.title")}
          description={tPage("driverTypes.subtitle")}
          feature={tPage("driverTypes.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
          <Card borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  {tPage("driverTypes.affiliate.title")}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {tPage("driverTypes.affiliate.description")}
                </Text>
                <VStack spacing={2} align="start">
                  {(Array.isArray(tPage("driverTypes.affiliate.benefits")) ? (tPage("driverTypes.affiliate.benefits") as unknown as string[]) : []).map((benefit: string, i: number) => (
                    <Text key={i} fontSize="sm" color="gray.600">
                      ✓ {benefit}
                    </Text>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </Card>

          <Card borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={2}>
                  {tPage("driverTypes.renter.title")}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {tPage("driverTypes.renter.description")}
                </Text>
                <VStack spacing={2} align="start">
                  {(Array.isArray(tPage("driverTypes.renter.benefits")) ? (tPage("driverTypes.renter.benefits") as unknown as string[]) : []).map((benefit: string, i: number) => (
                    <Text key={i} fontSize="sm" color="gray.600">
                      ✓ {benefit}
                    </Text>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('request');
