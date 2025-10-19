import NextLink from "next/link";
import { useMemo } from "react";
import { useLocalizedHref } from "@/lib/linkUtils";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";

import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import Hero from "@/components/Hero";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { CheckIcon, ArrowRightIcon } from "@chakra-ui/icons";
import { COMMON } from "@/translations";

const makeSafeT = (fn?: (key: string) => any) => (key: string, fallback?: any) => {
  if (!fn) return fallback ?? key;
  const value = fn(key);
  return value === undefined || value === null ? fallback ?? key : value;
};

export default function About({ tPage: rawTPage, tCommon: rawTCommon }: PublicPageProps) {
  const getLocalizedHref = useLocalizedHref();
  const t = useMemo(() => makeSafeT(rawTPage), [rawTPage]);
  const tc = useMemo(() => makeSafeT(rawTCommon), [rawTCommon]);

  return (
    <>
      {/* Hero */}
      <Hero
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        backgroundImage="/img/bg-portugal.jpg"
        badge={t("hero.badge")}
        overlay
      />

      {/* Visão & Missão */}
      <Container>
        <Title
          title={t("vision.title")}
          description={t("vision.subtitle")}
          feature={t("vision.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(3, 1fr)" }}>
          {(() => {
            const items = t("vision.items");
            if (!Array.isArray(items)) return null;

            return items.map((item: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    px={3}
                    py={1}
                    borderRadius="md"
                    bg="green.100"
                    color="green.700"
                    fontWeight="bold"
                    fontSize="sm"
                  >
                    {item.label}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {item.title}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {item.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* O Modelo Explicado */}
      <Container softBg>
        <Title
          title={t("model.title")}
          description={t("model.subtitle")}
          feature={t("model.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          {(() => {
            const sections = t("model.sections");
            if (!Array.isArray(sections)) return null;

            return sections.map((section: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="lg"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="green.600"
                    fontSize="2xl"
                  >
                    {i === 0 ? "🔀" : i === 1 ? "📈" : i === 2 ? "👥" : "🛡️"}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {section.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                    {section.description}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {section.details}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Nossa Estrutura */}
      <Container>
        <Title
          title={t("organization.title")}
          description={t("organization.subtitle")}
          feature={t("organization.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const departments = t("organization.departments");
            if (!Array.isArray(departments)) return null;

            return departments.map((dept: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="lg"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="green.600"
                    fontSize="2xl"
                  >
                    {i === 0 ? "⚙️" : i === 1 ? "💰" : i === 2 ? "💻" : "🤝"}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {dept.name}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {dept.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Roadmap 2026 */}
      <Container softBg>
        <Title
          title={t("growth.title")}
          description={t("growth.subtitle")}
          feature={t("growth.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const timeline = t("growth.timeline");
            if (!Array.isArray(timeline)) return null;

            return timeline.map((q: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    px={3}
                    py={1}
                    borderRadius="md"
                    bg="green.100"
                    color="green.700"
                    fontWeight="bold"
                    fontSize="sm"
                  >
                    {q.quarter}
                  </Box>
                  <VStack spacing={2} align="start" flex="1" w="full">
                    <HStack>
                      <Text color="gray.500" fontSize="sm">Motoristas:</Text>
                      <Text fontWeight="bold" color="green.600">{q.motoristas}</Text>
                    </HStack>
                    <HStack>
                      <Text color="gray.500" fontSize="sm">Receita:</Text>
                      <Text fontWeight="bold" color="green.600">{q.receita}</Text>
                    </HStack>
                  </VStack>
                  <VStack spacing={2} align="start" w="full">
                    <Text fontWeight="bold" color="gray.800" fontSize="sm">
                      {q.milestone}
                    </Text>
                    <Text color="gray.600" fontSize="sm">
                      {q.description}
                    </Text>
                  </VStack>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Nossos Valores */}
      <Container>
        <Title
          title={t("values.title")}
          description={t("values.subtitle")}
          feature={t("values.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const values = t("values.items");
            if (!Array.isArray(values)) return null;

            return values.map((value: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="lg"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="green.600"
                    fontSize="2xl"
                  >
                    {i === 0 ? "🔍" : i === 1 ? "⭐" : i === 2 ? "🔒" : "🚀"}
                  </Box>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {value.title}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {value.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Números que Falam */}
      <Container softBg>
        <Title
          title={t("metrics.title")}
          description={t("metrics.subtitle")}
          feature={t("metrics.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
          {(() => {
            const stats = t("metrics.stats");
            if (!Array.isArray(stats)) return null;

            return stats.map((stat: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <HStack>
                    <Text fontSize="3xl" fontWeight="bold" color="green.600">
                      {stat.value}
                    </Text>
                    {stat.unit && (
                      <Text fontSize="lg" color="green.600" fontWeight="bold">
                        {stat.unit}
                      </Text>
                    )}
                  </HStack>
                  <VStack spacing={1} align="start" flex="1">
                    <Text fontWeight="bold" color="gray.800" fontSize="sm">
                      {stat.label}
                    </Text>
                    <Text color="gray.600" fontSize="sm">
                      {stat.description}
                    </Text>
                  </VStack>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Por que Escolher Conduz */}
      <Container>
        <Title
          title={t("why.title")}
          description={t("why.subtitle")}
          feature={t("why.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(3, 1fr)" }}>
          {(() => {
            const items = t("why.items");
            if (!Array.isArray(items)) return null;

            return items.map((item: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <HStack spacing={2}>
                    <CheckIcon color="green.600" w={5} h={5} />
                    <Text fontSize="lg" fontWeight="bold" color="green.600">
                      {item.title}
                    </Text>
                  </HStack>
                  <Text color="gray.600" flex="1">
                    {item.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* CTA Final */}
      <Container softBg>
        <Title
          title={t("cta.title")}
          description={t("cta.subtitle")}
          feature={t("cta.feature")}
          ctaText={t("cta.button")}
          cta={getLocalizedHref("/request")}
          center
        />
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('about');

