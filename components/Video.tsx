import { useState, useRef, useEffect } from "react";
import {
  Box,
  AspectRatio,
  Stack,
  HStack,
  IconButton,
  Button,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";

type VideoBlockProps = {
  poster: string;
  src: string;
  rounded?: string;
  t?: any;
  title?: string;
  description?: string;
  animated?: boolean;
};

export default function Video({ poster, src, t, rounded = "2xl", title, description, animated = true }: VideoBlockProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (playing && videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
  }, [playing]);


  const playAriaLabel = t ? t("video.playAriaLabel") : "Reproduzir vídeo";

  return (
    <AspectRatio ratio={16 / 9} w="full">
      <Box
        position="relative"
        w="100%"
        h="100%"
        overflow="hidden"
        rounded={rounded}

      >
        {playing ? (
          <Box
            as="video"
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            objectFit="cover"
            w="100%"
            h="100%"
          />
        ) : (

          <Box bgImage={poster}
            bgSize="110%"
            bgPosition="center"
            bgRepeat="no-repeat"
            w="100%"
            h="100%"

            position="relative"
            _hover={{
              bgSize: "120%",
            }}
            transition={"all 0.5s ease-in-out"}
          >

            <Box position="absolute" inset={0} bgGradient={"linear(to-t, brand.900, blackAlpha.700, blackAlpha.900)"} />

            <Stack
              position="absolute"
              align="center"
              justify="center"
              textAlign="center"
              bottom={0}
              left={0}
              right={0}
              top={0}
              spacing={4}
              zIndex={10}

              onClick={() => setPlaying(true)}
              cursor="pointer"

            >

              <IconButton
                aria-label={playAriaLabel}
                rounded="full"
                size="lg"
                colorScheme="brand"
                icon={
                  <Box as="svg" viewBox="0 0 24 24" boxSize={8} fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </Box>
                }
              />

              <VStack spacing={1} align="center" justify="center" textAlign="center">
                {title && (
                  <Heading color="brand.500" fontSize="3xl" fontWeight="light">
                    {title}
                  </Heading>
                )}
                {description && (
                  <Text color="white" fontSize="md" fontWeight="light" fontStyle="italic">
                    "{description}"
                  </Text>
                )}
              </VStack>


            </Stack>
          </Box>
        )}
      </Box>
    </AspectRatio>
  );
}
