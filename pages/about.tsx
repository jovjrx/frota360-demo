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
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import Hero from "@/components/Hero";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { CheckIcon, ArrowRightIcon } from "@chakra-ui/icons";
import { ABOUT } from "@/translations";

const makeSafeT = (fn?: (key: string) => any) => (key: string, fallback?: any) => {
  if (!fn) return fallback ?? key;
  const value = fn(key);
  return value === undefined || value === null ? fallback ?? key : value;
};

export default function About({ tPage: rawTPage }: PublicPageProps) {
  const getLocalizedHref = useLocalizedHref();
  const t = useMemo(() => makeSafeT(rawTPage), [rawTPage]);

  return (
    <>
      {/* Hero */}
      <Hero
        title={t(ABOUT.HERO.TITLE)}
        subtitle={t(ABOUT.HERO.SUBTITLE)}
        backgroundImage="/img/about.jpg"
        badge={t(ABOUT.HERO.BADGE)}
        overlay
      >
        <Highlight
          title={t(ABOUT.MISSION.CARD.TITLE)}
          description={t(ABOUT.MISSION.CARD.DESCRIPTION)}
          bgImage="/img/driver-app.jpg"
          delayImage={0.5}
          delayBox={0.8}
        />
      </Hero>

      {/* Missão */}
      <Container>
        <Title
          title={t(ABOUT.MISSION.TITLE)}
          description={t(ABOUT.MISSION.SUBTITLE)}
          feature={t(ABOUT.MISSION.FEATURE)}
        />
        <Card animated borded>
          <VStack spacing={6} align="start">
            <Text color="gray.700" fontSize="md" lineHeight="1.8">
              {t(ABOUT.MISSION.CARD.CONTENT)}
            </Text>
            <Divider />
            <Box w="full">
              <Text fontWeight="bold" fontSize="lg" mb={4} color="green.600">
                {t(ABOUT.MISSION.CARD.VALUES.TITLE)}
              </Text>
              <VStack spacing={2} align="start">
                {(() => {
                  const values = t(ABOUT.MISSION.CARD.VALUES.LIST);
                  if (!Array.isArray(values)) return null;
                  return values.map((value: any, i: number) => (
                    <HStack key={i} spacing={3}>
                      <CheckIcon color="green.600" w={5} h={5} />
                      <Text color="gray.700">{value}</Text>
                    </HStack>
                  ));
                })()}
              </VStack>
            </Box>
          </VStack>
        </Card>
      </Container>

      {/* Abordagem */}
      <Container softBg>
        <Title
          title={t(ABOUT.APPROACH.TITLE)}
          description={t(ABOUT.APPROACH.SUBTITLE)}
          feature={t(ABOUT.APPROACH.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          {(() => {
            const methods = t(ABOUT.APPROACH.METHODS);
            if (!Array.isArray(methods)) return null;

            return methods.map((method: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="lg"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="3xl"
                  >
                    {method.icon}
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    {method.title}
                  </Text>
                  <Text color="gray.600" flex="1">
                    {method.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Experiência */}
      <Container>
        <Title
          title={t(ABOUT.EXPERIENCE.TITLE)}
          description={t(ABOUT.EXPERIENCE.SUBTITLE)}
          feature={t(ABOUT.EXPERIENCE.FEATURE)}
        />
        <Card animated borded>
          <VStack spacing={6} align="start">
            <Text color="gray.700" fontSize="md" lineHeight="1.8">
              {t(ABOUT.EXPERIENCE.CARD.CONTENT)}
            </Text>
            <Divider />
            <Box w="full">
              <Text fontWeight="bold" fontSize="lg" mb={6} color="green.600">
                {t(ABOUT.EXPERIENCE.CARD.STATS.TITLE)}
              </Text>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                {(() => {
                  const stats = t(ABOUT.EXPERIENCE.CARD.STATS.LIST);
                  if (!Array.isArray(stats)) return null;
                  return stats.map((stat: any, i: number) => (
                    <VStack key={i} spacing={2} align="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {stat.value}
                      </Text>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {stat.label}
                      </Text>
                    </VStack>
                  ));
                })()}
              </SimpleGrid>
            </Box>
          </VStack>
        </Card>
      </Container>

      {/* Equipa */}
      <Container softBg>
        <Title
          title={t(ABOUT.TEAM.TITLE)}
          description={t(ABOUT.TEAM.SUBTITLE)}
          feature={t(ABOUT.TEAM.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(3, 1fr)" }}>
          {(() => {
            const members = t(ABOUT.TEAM.MEMBERS);
            if (!Array.isArray(members)) return null;

            return members.map((member: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start" h="full">
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="full"
                    bg="green.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="green.600"
                    fontSize="2xl"
                  >
                    {i === 0 ? "📋" : i === 1 ? "💬" : "🤝"}
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    {member.name}
                  </Text>
                  <Text fontSize="sm" color="gray.500" fontStyle="italic">
                    {member.position}
                  </Text>
                  <Text color="gray.600" flex="1" fontSize="sm">
                    {member.bio}
                  </Text>
                  <VStack spacing={1} align="start" w="full">
                    {(() => {
                      const expertise = member.expertise;
                      if (!Array.isArray(expertise)) return null;
                      return expertise.map((skill: any, j: number) => (
                        <HStack key={j} spacing={2}>
                          <CheckIcon color="green.600" w={3} h={3} />
                          <Text fontSize="xs" color="gray.600">{skill}</Text>
                        </HStack>
                      ));
                    })()}
                  </VStack>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* CTA Final */}
      <Container>
        <Title
          title={t(ABOUT.CTA.TITLE)}
          description={t(ABOUT.CTA.SUBTITLE)}
          feature={t(ABOUT.CTA.FEATURE)}
          ctaText={t(ABOUT.CTA.BUTTON)}
          cta={getLocalizedHref("/request")}
          center
        />
      </Container>
    </>
  );
}

export const getServerSideProps = withPublicSSR('about');

