import { GetStaticProps } from "next";
import {
  Box,
  Text,
  VStack,
  SimpleGrid,
  HStack,
  Avatar,
  Badge
} from "@chakra-ui/react";
import { loadTranslations } from "@/lib/translations";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { PageProps } from "@/interface/Global";
import Hero from "@/components/Hero";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";

export default function About({ tPage }: PageProps) {
  return (
    <>
      <Container softBg>
        <Title
          title={tPage("mission.title")}
          description={tPage("mission.subtitle")}
          feature={tPage("mission.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeat(2, 1fr)" }}>
          <Card
            title={tPage("mission.card.title")}
            description={tPage("mission.card.description")}
            animated
            borded
          >
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" color="gray.700">
                {tPage("mission.card.content")}
              </Text>
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={2}>
                  {tPage("mission.card.values.title")}
                </Text>
                <VStack spacing={2} align="stretch">
                  {(() => {
                    const values = tPage("mission.card.values.list");
                    if (!Array.isArray(values)) return null;
                    return values.map((value: any, i: number) => (
                      <Box key={i} display="flex" alignItems="center">
                        <Box
                          w={2}
                          h={2}
                          bg="green.500"
                          borderRadius="full"
                          mr={3}
                        />
                        <Text>{value}</Text>
                      </Box>
                    ));
                  })()}
                </VStack>
              </Box>
            </VStack>
          </Card>

          <Highlight
            title={tPage("mission.highlight.title")}
            description={tPage("mission.highlight.description")}
            bgImage="/img/about.jpg"
            bgSizePersonalized={'cover'}
            overlayPos="bl"
            delayImage={0.2}
            delayBox={0.5}
          />
        </ContainerDivisions>
      </Container>

      <Container>
        <Title
          title={tPage("approach.title")}
          description={tPage("approach.subtitle")}
          feature={tPage("approach.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}>
          {(() => {
            const methods = tPage("approach.methods");
            if (!Array.isArray(methods)) return null;
            return methods.map((method: any, i: number) => (
              <Card
                key={i}
                title={method.title}
                description={method.description}
                animated
                borded
              >
                <VStack spacing={4} align="center" textAlign="center">
                  <Text fontSize="3xl" role="img" aria-label={method.title}>
                    {method.icon}
                  </Text>
                  <Text fontSize="md" color="gray.600">
                    {method.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      <Container softBg>
        <Title
          title={tPage("experience.title")}
          description={tPage("experience.subtitle")}
          feature={tPage("experience.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeat(2, 1fr)" }}>
          <Card
            title={tPage("experience.card.title")}
            description={tPage("experience.card.description")}
            animated
            borded
          >
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" color="gray.700">
                {tPage("experience.card.content")}
              </Text>
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={3}>
                  {tPage("experience.card.stats.title")}
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  {(() => {
                    const stats = tPage("experience.card.stats.list");
                    if (!Array.isArray(stats)) return null;
                    return stats.map((stat: any, i: number) => (
                      <Box key={i} textAlign="center" p={4} bg="green.50" borderRadius="lg" border="1px" borderColor="green.100">
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          {stat.value}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {stat.label}
                        </Text>
                      </Box>
                    ));
                  })()}
                </SimpleGrid>
              </Box>
            </VStack>
          </Card>

          <Highlight
            title={tPage("experience.highlight.title")}
            description={tPage("experience.highlight.description")}
            bgImage="/img/driver-app.jpg"
            overlayPos="tr"
            bgSizePersonalized={'cover'}
            delayImage={0.4}
            delayBox={0.7}
          />
        </ContainerDivisions>
      </Container>

      <Container>
        <Title
          title={tPage("team.title")}
          description={tPage("team.subtitle")}
          feature={tPage("team.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}>
          {(() => {
            const members = tPage("team.members");
            if (!Array.isArray(members)) return null;
            return members.map((member: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="center" textAlign="center">
                  <Avatar
                    size="xl"
                    name={member.name}
                    src={member.photo}
                    bg="green.500"
                    color="white"
                  />
                  <VStack spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      {member.name}
                    </Text>
                    <Badge colorScheme="green" variant="subtle">
                      {member.position}
                    </Badge>
                  </VStack>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {member.bio}
                  </Text>
                  <HStack spacing={2}>
                    {member.expertise && member.expertise.map((skill: string, idx: number) => (
                      <Badge key={idx} size="sm" colorScheme="gray" variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      <Container softBg>
        <Title
          title={tPage("cta.title")}
          description={tPage("cta.subtitle")}
          feature={tPage("cta.feature")}
          ctaText={tPage("cta.button")}
          cta="/contact"
          center
        />
      </Container>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale = "pt" }) => {
  try {
    const translations = await loadTranslations(locale, ["common", "about"]);
    const { common, about: page } = translations;

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

