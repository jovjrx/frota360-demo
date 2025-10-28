import {
  Box,
  Text,
  VStack,
  SimpleGrid,
  Divider,
  Link,
} from "@chakra-ui/react";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { Card } from "@/components/Card";
import { ContactForm } from "@/components/ContactForm";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";
import { CONTACT, COMMON } from "@/translations";
import { useSiteContact } from "@/hooks/useSiteContact";

export default function ContactPage({ tPage, tCommon }: PublicPageProps) {
  const contact = useSiteContact();

  return (
    <>
      <Container softBg>
        <Title
          title={tPage(CONTACT.HERO.TITLE)}
          description={tPage(CONTACT.HERO.SUBTITLE)}
          feature={tPage(CONTACT.HERO.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "2fr 1fr" }}>
          <ContactForm tPage={tPage} />

          <VStack spacing={4} minW={'full'} align={'stretch'}>
            <Card
              title={tPage(CONTACT.LOCATION.TITLE)}
              borded
            >
              <VStack spacing={1} align="stretch">
                <Text>{tPage(CONTACT.LOCATION.DESCRIPTION)}</Text>
                <Text>{contact.address}</Text>
                <Text>{contact.postalCode}</Text>
                <Text>{contact.city} - {contact.country}</Text>
              </VStack>
            </Card>

            <Card
              title={tPage("location.phone")}
              borded
            >
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">{tPage("location.phoneDescription")}</Text>
                <Link href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} isExternal display="block" textAlign="center">
                  <Text color="green.600" fontWeight="bold">
                    {contact.phone}
                  </Text>
                </Link>
              </VStack>
            </Card>

            <Card
              title={tPage("location.directEmail")}
              borded
            >
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.600">{tPage("location.directEmailDescription")}</Text>
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

      <Container>
        <Title
          title={tCommon("faq.title")}
          description={tCommon("faq.subtitle")}
          feature={tCommon("faq.feature")}
        />
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {(() => {
            const faqs = tCommon("faq.items");
            if (!Array.isArray(faqs)) return null;
            return faqs.map((faq: any, i: number) => (
              <Card
                key={i}
                title={faq.question}
                borded
              >
                <Text>{faq.answer}</Text>
              </Card>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* Localização e Informações */}
      <Container>
        <Title
          title={tPage("location.title")}
          description={tPage("location.description")}
          feature="INFORMAÇÕES"
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
          <Card borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  {tPage("location.directEmail")}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {tPage("location.directEmailDescription")}
                </Text>
                <Link href={`mailto:${contact.email}`} color="blue.600" fontWeight="medium">
                  {contact.email}
                </Link>
              </Box>
              <Divider />
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  {tPage("location.phone")}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {tPage("location.phoneDescription")}
                </Text>
                <Link href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} color="blue.600" fontWeight="medium">
                  {contact.phone}
                </Link>
              </Box>
            </VStack>
          </Card>

          <Card borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  {contact.address}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  {contact.postalCode}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {contact.city}, {contact.country}
                </Text>
              </Box>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('contact');
