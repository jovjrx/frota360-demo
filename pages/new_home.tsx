import NextLink from "next/link";
import { useMemo } from "react";
import { useLocalizedHref } from "@/lib/linkUtils";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";
import { useFacebookTracking } from "@/hooks/useFacebookTracking";

import {
  Box,
  Text,
  Button,
  VStack,
  SimpleGrid,
  Image as ChakraImage,
  HStack,
  Badge,
  Heading,
  useColorModeValue,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import Hero from "@/components/Hero";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { ArrowRightIcon } from "@chakra-ui/icons";
import { NEW_HOME } from "@/translations/new-home/constants";

const makeSafeT = (fn?: (key: string) => any) => (key: string, fallback?: any) => {
  if (!fn) return fallback ?? key;
  const value = fn(key);
  return value === undefined || value === null ? fallback ?? key : value;
};

export default function NewHome({ tPage: rawTPage, tCommon: rawTCommon }: PublicPageProps) {
  const getLocalizedHref = useLocalizedHref();
  const t = useMemo(() => makeSafeT(rawTPage), [rawTPage]);
  const tc = useMemo(() => makeSafeT(rawTCommon), [rawTCommon]);
  const { trackCheckoutStart } = useFacebookTracking();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Box bg={bgColor} minH="100vh">
      {/* HERO SECTION */}
      <Hero
        title="Não é só dirigir. É construir seu próprio negócio."
        subtitle="Sistema meritocrático onde seu desempenho determina seu ganho"
        backgroundImage="/img/hero-drivers-new.png"
        badge="TVDE PORTUGAL"
        actions={
          <HStack spacing={4} mt={8}>
            <Button
              as={NextLink}
              href={getLocalizedHref("/request")}
              colorScheme="green"
              size="lg"
              rightIcon={<ArrowRightIcon />}
              onClick={() => trackCheckoutStart("Driver Application - New Home")}
            >
              "Candidatar-me como Motorista"
            </Button>
            <Button
              as="a"
              href="https://wa.me/351XXXXXXXXX"
              variant="outline"
              borderColor="white"
              color="white"
              size="lg"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              "Falar no WhatsApp"
            </Button>
          </HStack>
        }
      />

      {/* DIFERENCIAIS ÚNICOS */}
      <Container maxW="7xl">
        <Title
          title="Por que Motoristas Escolhem Conduz"
          description="Sistema meritocrático que recompensa seu desempenho"
          feature="DIFERENCIAIS ÚNICOS"
        />

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mt={12}>
          {(() => {
            const differentials = [
              {
                title: "Comissões Progressivas",
                description: "Quanto melhor você trabalha, mais você ganha. De 5% até 10% de comissão.",
                badge: "CRESCIMENTO",
                image: "/img/driver-app-new.png",
              },
              {
                title: "Ganhos por Recrutamento",
                description: "Recrute motoristas e ganhe comissões passivas. De 2% até 5%.",
                badge: "RENDA PASSIVA",
                image: "/img/driver-app-new.png",
              },
              {
                title: "Pagamentos Semanais",
                description: "Toda quinta-feira, sem atrasos. Fluxo de caixa previsível e garantido.",
                badge: "CONFIANÇA",
                image: "/img/driver-app-new.png",
              },
              {
                title: "Dashboard em Tempo Real",
                description: "Veja seus números: receita, aceitação, avaliação, recrutamentos e horas.",
                badge: "CONTROLO",
                image: "/img/driver-app-new.png",
              },
              {
                title: "Suporte Especializado TVDE",
                description: "Equipe que entende o setor. Onboarding em dias, não semanas.",
                badge: "SUPORTE",
                image: "/img/driver-app-new.png",
              },
              {
                title: "Múltiplas Plataformas",
                description: "Integrado com Uber, Bolt e Free Now. Múltiplas fontes de renda.",
                badge: "FLEXIBILIDADE",
                image: "/img/driver-app-new.png",
              },
              {
                title: "Transparência Total",
                description: "Acesso a todos os cálculos. Sem mistérios. Você sabe exatamente como funciona.",
                badge: "HONESTIDADE",
                image: "/img/driver-app-new.png",
              },
              {
                title: "Segurança Financeira",
                description: "Reserva técnica de 25% garante estabilidade. Mesmo em crises, você recebe.",
                badge: "PROTEÇÃO",
                image: "/img/driver-app-new.png",
              },
            ];
            if (!Array.isArray(differentials)) return null;
            return differentials.map((diff: any, i: number) => (
              <Box
                key={i}
                bg={cardBg}
                borderRadius="lg"
                overflow="hidden"
                boxShadow="md"
                transition="all 0.3s"
                _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
              >
                {/* Imagem */}
                <Box h="200px" overflow="hidden" bg="gray.200">
                  <ChakraImage
                    src={diff.image}
                    alt={diff.title}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>

                {/* Conteúdo */}
                <VStack align="start" spacing={3} p={6}>
                  <Badge colorScheme="green" fontSize="xs">
                    {diff.badge}
                  </Badge>
                  <Heading size="md" color="gray.800">
                    {diff.title}
                  </Heading>
                  <Text color="gray.600" fontSize="sm" lineHeight="1.6">
                    {diff.description}
                  </Text>
                </VStack>
              </Box>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* COMO FUNCIONA */}
      <Container maxW="7xl" bg="white" borderY="1px solid" borderColor="gray.200">
        <Title
          title="Como Funciona"
          description="3 passos simples para começar"
          feature="PROCESSO"
        />

        <ContainerDivisions template={{ base: '1fr', md: 'repeat(3, 1fr)' }}>
          {(() => {
            const steps = [
              {
                number: "1",
                title: "Solicitação",
                description: "Preencha o formulário de candidatura online",
              },
              {
                number: "2",
                title: "Validação & Formação",
                description: "Compliance, seguro, kit de boas-vindas",
              },
              {
                number: "3",
                title: "Comece a Faturar",
                description: "Pagamentos semanais, monitorização em tempo real e acesso a empréstimos",
              },
            ];
            if (!Array.isArray(steps)) return null;
            return steps.map((step: any, i: number) => (
              <Card key={i} animated borded img={`/img/step-${i + 1}-new.png`}>
                <VStack spacing={4} align="center" textAlign="center">
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="full"
                    bg="green.500"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                    fontWeight="bold"
                  >
                    {step.number}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {step.title}
                  </Text>
                  <Text color="gray.600">
                    {step.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* SISTEMA MERITOCRÁTICO */}
      <Container maxW="7xl">
        <Title
          title="Sistema Meritocrático"
          description="Quanto melhor você trabalha, mais você ganha"
          feature="PROGRESSÃO"
        />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mt={12}>
          {(() => {
            const levels = [
              {
                title: "Nível 1",
                subtitle: "Afiliado Inicial",
                commission: "5%",
                color: "blue",
                description: "Comece sua jornada com comissões competitivas",
                benefits: [
                  "5% de comissão base",
                  "2% de comissão de recrutamento",
                  "Acesso ao dashboard",
                  "Suporte dedicado",
                ],
              },
              {
                title: "Nível 2",
                subtitle: "Afiliado Ativo",
                commission: "7,5%",
                color: "green",
                description: "Crescimento reconhecido e recompensado",
                benefits: [
                  "7,5% de comissão base",
                  "3,5% de comissão de recrutamento",
                  "Relatórios avançados",
                  "Prioridade no suporte",
                ],
              },
              {
                title: "Nível 3",
                subtitle: "Afiliado Premium",
                commission: "10%",
                color: "gold",
                description: "Máxima recompensa para máximo desempenho",
                benefits: [
                  "10% de comissão base",
                  "5% de comissão de recrutamento",
                  "Acesso VIP",
                  "Consultor pessoal",
                ],
              },
            ];
            if (!Array.isArray(levels)) return null;
            return levels.map((level: any, i: number) => (
              <Box
                key={i}
                bg={cardBg}
                p={8}
                borderRadius="lg"
                boxShadow="md"
                borderTop="4px solid"
                borderTopColor={level.color}
                textAlign="center"
              >
                <Heading size="lg" mb={2} color="gray.800">
                  {level.title}
                </Heading>
                <Text fontSize="3xl" fontWeight="bold" color={level.color} mb={4}>
                  {level.commission}
                </Text>
                <Text color="gray.600" mb={4}>
                  {level.description}
                </Text>
                <VStack align="start" spacing={2}>
                  {level.benefits && level.benefits.map((benefit: string, j: number) => (
                    <HStack key={j} spacing={2}>
                      <Text color={level.color}>✓</Text>
                      <Text fontSize="sm" color="gray.600">{benefit}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* TIPOS DE MOTORISTA */}
      <Container maxW="7xl" bg="white" borderY="1px solid" borderColor="gray.200">
        <Title
          title="Escolha Seu Caminho"
          description="Dois modelos para duas realidades"
          feature="FLEXIBILIDADE"
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt={12}>
          {(() => {
            const types = [
              {
                title: "Motorista Afiliado",
                description: "Trabalhe com o seu próprio veículo e tenha total controlo sobre o seu negócio.",
                color: "green",
                image: "/img/service-drivers-new.png",
                benefits: [
                  "Flexibilidade total de horários",
                  "Receita 100% sua",
                  "Controlo total do veículo",
                  "Suporte técnico completo",
                ],
              },
              {
                title: "Motorista Locatário",
                description: "Alugue um veículo da Conduz PT e comece a trabalhar imediatamente.",
                color: "blue",
                image: "/img/service-companies-new.png",
                benefits: [
                  "Sem investimento inicial",
                  "Veículos sempre atualizados",
                  "Manutenção incluída",
                  "Seguro completo",
                ],
              },
            ];
            if (!Array.isArray(types)) return null;
            return types.map((type: any, i: number) => (
              <Card key={i} animated borded img={type.image} color={type.color}>
                <VStack spacing={4} align="start" h="full">
                  <Heading size="md" color={`${type.color}.600`}>
                    {type.title}
                  </Heading>
                  <Text color="gray.600" flex="1">
                    {type.description}
                  </Text>
                  <VStack align="start" spacing={2} w="full">
                    {type.benefits && type.benefits.map((benefit: string, j: number) => (
                      <HStack key={j} spacing={2}>
                        <Text color={`${type.color}.500`}>✓</Text>
                        <Text fontSize="sm" color="gray.600">{benefit}</Text>
                      </HStack>
                    ))}
                  </VStack>
                  <Button
                    as={NextLink}
                    href={getLocalizedHref("/request")}
                    colorScheme={type.color}
                    size="sm"
                    rightIcon={<ArrowRightIcon />}
                    w="full"
                    onClick={() => trackCheckoutStart(`Driver Application - ${type.title}`)}
                  >
                    "Candidatar-me"
                  </Button>
                </VStack>
              </Card>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* TRANSPARÊNCIA E SEGURANÇA */}
      <Container maxW="7xl">
        <Title
          title="Confiança e Segurança"
          description="Tudo que você precisa para trabalhar com tranquilidade"
          feature="GARANTIAS"
        />

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mt={12}>
          {(() => {
            const items = [
              {
                icon: "✓",
                title: "95% Aprovação",
                description: "Taxa de aprovação de documentos",
              },
              {
                icon: "⚡",
                title: "24h Análise",
                description: "Tempo médio para análise",
              },
              {
                icon: "⭐",
                title: "4.8/5 Satisfação",
                description: "Avaliação do suporte",
              },
              {
                icon: "🕐",
                title: "7 Dias Suporte",
                description: "Suporte disponível",
              },
            ];
            if (!Array.isArray(items)) return null;
            return items.map((item: any, i: number) => (
              <Box
                key={i}
                bg={cardBg}
                p={6}
                borderRadius="lg"
                boxShadow="md"
                textAlign="center"
              >
                <Text fontSize="3xl" mb={3}>
                  {item.icon}
                </Text>
                <Heading size="sm" mb={2} color="gray.800">
                  {item.title}
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  {item.description}
                </Text>
              </Box>
            ));
          })()}
        </SimpleGrid>
      </Container>

      {/* CTA FINAL */}
      <Box bg="green.600" color="white" py={16} textAlign="center">
        <Container maxW="2xl">
          <Heading size="xl" mb={4}>
            "Pronto para Começar a Faturar?"
          </Heading>
          <Text fontSize="lg" mb={8} opacity={0.9}>
            "Você conduz, nós cuidamos do resto! Junte-se aos motoristas que já escolheram a Conduz"
          </Text>
          <HStack justify="center" spacing={4}>
            <Button
              as={NextLink}
              href={getLocalizedHref("/request")}
              colorScheme="whiteAlpha"
              bg="white"
              color="green.600"
              size="lg"
              rightIcon={<ArrowRightIcon />}
              onClick={() => trackCheckoutStart("Driver Application - Final CTA")}
            >
              "Candidatar-me Agora"
            </Button>
            <Button
              as="a"
              href="https://wa.me/351XXXXXXXXX"
              variant="outline"
              borderColor="white"
              color="white"
              size="lg"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              "Falar no WhatsApp"
            </Button>
          </HStack>
        </Container>
      </Box>
    </Box>
  );
}

export const getServerSideProps = withPublicSSR("new-home");

