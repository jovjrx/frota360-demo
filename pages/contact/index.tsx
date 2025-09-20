import { GetStaticProps } from "next";
import {
  Box,
  Text,
  VStack,
  SimpleGrid,
  useToast,
  useColorModeValue,
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

export default function Contact({ tPage, tCommon }: PageProps) {
  return (
    <>
      <Container softBg>
        <Title
          title={tPage("hero.title")}
          description={tPage("hero.subtitle")}
          feature={tPage("hero.feature")}
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
  );
}

export const getStaticProps: GetStaticProps = async ({ locale = "pt" }) => {
  try {
    const translations = await loadTranslations(locale, ["common", "contact"]);
    const { common, contact: page } = translations;

    return {
      props: {
        translations: { common, page },
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Failed to load translations:", error);
    return {
      props: {
        translations: { common: {}, page: {} },
      },
      revalidate: 3600,
    };
  }
};
