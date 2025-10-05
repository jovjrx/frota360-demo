import { GetServerSideProps } from "next";
import {
  Box,
  Text,
  VStack,
  SimpleGrid,
  useToast,
  Divider,
  Heading,
} from "@chakra-ui/react";
import { loadTranslations } from "@/lib/translations";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { PageProps } from "@/interface/Global";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { ContactForm } from "@/components/ContactForm";
import Link from "next/link";

export default function Contact({ tPage, tCommon, locale }: PageProps & { locale: string }) {
  return (
    <>
      <Container softBg>
        <Title
          title={tPage("hero.title") || tPage("hero.title")}
          description={tPage("hero.subtitle") || tPage("hero.subtitle")}
          feature={tPage("hero.feature") || tPage("hero.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "2fr 1fr" }}>
          <ContactForm tPage={tPage} />

          <VStack spacing={4} minW={'full'} align={'stretch'}>
            <Card
              title={tPage("location.title")}
              description={tPage("location.description")}
              borded
            >
              <VStack spacing={1} align="stretch">
                <Text>{tCommon("company.address")}</Text>
                <Text>{tCommon("company.postalCode")}</Text>
                <Text>{tCommon("company.city")} - {tCommon("company.state")} - {tCommon("company.country")}</Text>
              </VStack>
            </Card>
            <Card
              title={tPage("location.phone")}
              description={tPage("location.phoneDescription")}
              borded
            >
              <Link href={`${tCommon("company.whats")}`}>
                <Text textAlign={'center'}>{tCommon("company.phone")}</Text>
              </Link>

            </Card>

            <Card
              title={tPage("location.directEmail")}
              description={tPage("location.directEmailDescription")}
              borded
            >

              <Text textAlign={'center'}>{tCommon("company.email")}</Text>

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
                description={faq.answer}
                animated
                borded
              />
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
          <Card animated borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  {tPage("location.directEmail")}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {tPage("location.directEmailDescription")}
                </Text>
                <Text fontSize="md" color="blue.600" fontWeight="medium">
                  info@conduz.pt
                </Text>
              </Box>
              <Divider />
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  {tPage("location.phone")}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  {tPage("location.phoneDescription")}
                </Text>
                <Text fontSize="md" color="blue.600" fontWeight="medium">
                  +351 912 345 678
                </Text>
              </Box>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  Horário de Atendimento
                </Text>
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" color="gray.600">
                    <strong>Segunda a Sexta:</strong> 9h às 18h
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    <strong>Sábado:</strong> 9h às 13h
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    <strong>Domingo:</strong> Fechado
                  </Text>
                </VStack>
              </Box>
              <Divider />
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  Endereço
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Lisboa, Portugal<br />
                  Serviços de mobilidade TVDE
                </Text>
              </Box>
            </VStack>
          </Card>
        </ContainerDivisions>
      </Container>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Extract locale from middleware header
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    const translations = await loadTranslations(locale, ["common", "contact"]);
    const { common, contact: page } = translations;

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
