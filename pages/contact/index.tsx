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
import { ContentManager } from "@/components/ContentManager";
import Link from "next/link";

export default function Contact({ tPage, tCommon, locale }: PageProps & { locale: string }) {
  return (
    <ContentManager page="contact" locale={locale} translations={{ page: tPage, common: tCommon }}>
      {(content) => (
        <>
      <Container softBg>
        <Title
          title={content.page("hero.title") || tPage("hero.title")}
          description={content.page("hero.subtitle") || tPage("hero.subtitle")}
          feature={content.page("hero.feature") || tPage("hero.feature")}
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
        </>
      )}
    </ContentManager>
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
