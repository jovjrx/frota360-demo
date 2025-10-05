import { GetServerSideProps } from "next";
import {
  Box,
  Text,
  VStack,
  Divider,
} from "@chakra-ui/react";
import { loadTranslations } from "@/lib/translations";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { PageProps } from "@/interface/Global";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { RequestForm } from "@/components/RequestForm";
import Link from "next/link";

export default function Request({ tPage, tCommon, locale }: PageProps & { locale: string }) {
  return (
    <>
      <Container softBg>
        <Title
          title="Candidatura de Motorista TVDE"
          description="Você conduz, nós cuidamos do resto!"
          feature="CANDIDATURA"
        />
        <ContainerDivisions template={{ base: "1fr", lg: "2fr 1fr" }}>
          <RequestForm tPage={tPage} tCommon={tCommon} />

          <VStack spacing={4} minW={'full'} align={'stretch'}>
            <Card
              title="Informações de Contacto"
              description="Fale connosco"
              borded
            >
              <VStack spacing={1} align="stretch">
                <Text>{tCommon("company.address")}</Text>
                <Text>{tCommon("company.postalCode")}</Text>
                <Text>{tCommon("company.city")} - {tCommon("company.state")}</Text>
                <Text>{tCommon("company.country")}</Text>
              </VStack>
            </Card>

            <Card
              title="WhatsApp"
              description={tCommon("company.phoneDescription")}
              borded
            >
              <Link href={`${tCommon("company.whats")}`}>
                <Text textAlign={'center'} color="green.600" fontWeight="bold">
                  {tCommon("company.phone")}
                </Text>
              </Link>
            </Card>

            <Card
              title="Email"
              description={tCommon("company.emailDescription")}
              borded
            >
              <Text textAlign={'center'} color="blue.600" fontWeight="bold">
                {tCommon("company.email")}
              </Text>
            </Card>
          </VStack>
        </ContainerDivisions>
      </Container>

      {/* Tipos de Motorista */}
      <Container>
        <Title
          title="Tipos de Motorista"
          description="Escolha o modelo que melhor se adapta à sua situação"
          feature="OPÇÕES"
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)" }}>
          <Card animated borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="green.600" mb={2}>
                  Motorista Afiliado
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Trabalhe com o seu próprio veículo e tenha total controlo sobre o seu negócio.
                </Text>
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" color="gray.600">✓ Flexibilidade total de horários</Text>
                  <Text fontSize="sm" color="gray.600">✓ Receita 100% sua</Text>
                  <Text fontSize="sm" color="gray.600">✓ Controlo total do veículo</Text>
                  <Text fontSize="sm" color="gray.600">✓ Suporte técnico completo</Text>
                </VStack>
              </Box>
            </VStack>
          </Card>

          <Card animated borded>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={2}>
                  Motorista Locatário
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Alugue um veículo da Conduz PT e comece a trabalhar imediatamente.
                </Text>
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" color="gray.600">✓ Sem investimento inicial</Text>
                  <Text fontSize="sm" color="gray.600">✓ Veículos sempre atualizados</Text>
                  <Text fontSize="sm" color="gray.600">✓ Manutenção incluída</Text>
                  <Text fontSize="sm" color="gray.600">✓ Seguro completo</Text>
                </VStack>
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
    const locale = Array.isArray(context.req.headers['x-locale']) 
      ? context.req.headers['x-locale'][0] 
      : context.req.headers['x-locale'] || 'pt';
    
    const translations = await loadTranslations(locale, ["common", "request"]);
    const { common, request: page } = translations;

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
