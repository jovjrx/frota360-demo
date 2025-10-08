import {
  Box,
  Text,
  VStack,
  SimpleGrid,
  HStack,
  Avatar,
  Badge
} from "@chakra-ui/react";
import { Card } from "@/components/Card";
import { Title } from "@/components/Title";
import { Container } from "@/components/Container";
import { Highlight } from "@/components/Highlight";
import { ContainerDivisions } from "@/components/ContainerDivisions";
import { withPublicSSR, PublicPageProps } from "@/lib/ssr";
import { ABOUT } from "@/translations";

export default function AboutPage({ tPage }: PublicPageProps) {
  return (
    <>
      <Container softBg>
        <Title
          title={tPage(ABOUT.MISSION.TITLE)}
          description={tPage(ABOUT.MISSION.SUBTITLE)}
          feature={tPage(ABOUT.MISSION.FEATURE)}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
          <Card
            title={tPage(ABOUT.MISSION.CARD.TITLE)}
            description={tPage(ABOUT.MISSION.CARD.DESCRIPTION)}
            animated
            borded
          >
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" color="gray.700">
                {tPage(ABOUT.MISSION.CARD.CONTENT)}
              </Text>
              <Box>
                <Text fontWeight="semibold" color="green.600" mb={2}>
                  {tPage(ABOUT.MISSION.CARD.VALUES.TITLE)}
                </Text>
                <VStack spacing={2} align="stretch">
                  {(() => {
                    const values = tPage(ABOUT.MISSION.CARD.VALUES.LIST);
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
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(4, 1fr)" }}>
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
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
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
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)", lg: "repeatPage(3, 1fr)" }}>
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

      {/* Nossa Abordagem */}
      <Container>
        <Title
          title={tPage("approach.title")}
          description={tPage("approach.subtitle")}
          feature={tPage("approach.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(2, 1fr)" }}>
          {(() => {
            const methods = tPage("approach.methods");
            if (!Array.isArray(methods)) return null;
            return methods.map((method: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start">
                  <HStack spacing={3}>
                    <Text fontSize="3xl">{method.icon}</Text>
                    <Text fontSize="xl" fontWeight="bold" color="green.600">
                      {method.title}
                    </Text>
                  </HStack>
                  <Text color="gray.600">
                    {method.description}
                  </Text>
                </VStack>
              </Card>
            ));
          })()}
        </ContainerDivisions>
      </Container>

      {/* Nossa Experiência */}
      <Container softBg>
        <Title
          title={tPage("experience.title")}
          description={tPage("experience.subtitle")}
          feature={tPage("experience.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", lg: "repeatPage(2, 1fr)" }}>
          <Card
            title={tPage("experience.card.title")}
            description={tPage("experience.card.description")}
            animated
            borded
          >
            <VStack spacing={4} align="start">
              <Text color="gray.600">{tPage("experience.card.content")}</Text>
              <Box w="full">
                <Text fontWeight="bold" mb={4} color="green.600">
                  {tPage("experience.card.stats.title")}
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  {(() => {
                    const stats = tPage("experience.card.stats.list");
                    if (!Array.isArray(stats)) return null;
                    return stats.map((stat: any, i: number) => (
                      <Box key={i} textAlign="center" p={4} bg="green.50" borderRadius="md">
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
            bgImage="/img/about.jpg"
            delayImage={0.5}
            delayBox={0.8}
          />
        </ContainerDivisions>
      </Container>

      {/* Nossa Equipa */}
      <Container>
        <Title
          title={tPage("team.title")}
          description={tPage("team.subtitle")}
          feature={tPage("team.feature")}
        />
        <ContainerDivisions template={{ base: "1fr", md: "repeatPage(3, 1fr)" }}>
          {(() => {
            const members = tPage("team.members");
            if (!Array.isArray(members)) return null;
            return members.map((member: any, i: number) => (
              <Card key={i} animated borded>
                <VStack spacing={4} align="start">
                  <Avatar size="lg" name={member.name} />
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" color="green.600">
                      {member.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      {member.position}
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      {member.bio}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {member.expertise.map((skill: string, j: number) => (
                        <Badge key={j} colorScheme="green" variant="subtle">
                          {skill}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
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

export const getServerSideProps = withPublicSSR('about');
