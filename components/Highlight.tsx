import {
    Box,
    Text,
    AspectRatio,
    Image,
    usePrefersReducedMotion,
    VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type HighlightProps = {
    title: string;
    quote?: string;
    description?: string;
    img?: string;
    bgVideo?: any;
    bgColor?: string;             // fundo da área quadrada
    bgImage?: any;             // imagem de fundo
    ratio?: any;               // ex.: 1 (quadrado), 16/9, etc. Default 1
    rounded?: string;             // ex.: "2xl"
    delayImage?: number;          // atraso da imagem
    delayBox?: number;            // atraso da box com texto
    overlayPos?: "bl" | "br" | "tl" | "tr" | "bc" | "tc"; // posição da caixa (default bl)
    bgSizePersonalized?: any;
};

const imgIn = keyframes`
    0%   { opacity: 0; transform: translateX(14%) scale(1.25); }
    60%  { opacity: 1; transform: translateX(0)    scale(1.08); }
    100% { opacity: 1; transform: translateX(0)    scale(1.02); }
  `;

const boxIn = keyframes`
    0%   { opacity: 0; transform: translateY(12px) scale(.98); }
    100% { opacity: 1; transform: translateY(0)    scale(1); }
  `;

export const Highlight = ({
    title,
    quote,
    description,
    img,
    bgVideo,
    bgColor,    
    bgImage = null,
    ratio = { base: 1, md: 16 / 9 },
    rounded = "2xl",
    delayImage = 0.1,
    delayBox = 0.45,
    bgSizePersonalized,
    overlayPos = "bc",
}: HighlightProps) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    const overlayBg = "white";
    const overlayText = "gray.700";

    const pos: Record<typeof overlayPos, any> = {
        bl: { left: { base: -4, md: 4 }, bottom: { base: -4, md: 4 }, right: "auto", top: "auto" },
        br: { right: { base: -2, md: 4 }, bottom: { base: -4, md: 4 }, left: "auto", top: "auto" },
        tl: { left: { base: -2, md: 4 }, top: { base: -4, md: 4 }, right: "auto", bottom: "auto" },
        tr: { right: { base: -2, md: 4 }, top: { base: -4, md: 4 }, left: "auto", bottom: "auto" },
        bc: { bottom: { base: -2, md: 4 }, left: "auto", right: "auto", top: "auto" },
        tc: { top: { base: -4, md: 4 }, left: "auto", right: "auto", bottom: "auto" },
    };

    return (
        <AspectRatio ratio={ratio}  w="full">
            <Box
                position="relative"
                bg={'transparent'}
                bgImage={bgImage ? `url(${bgImage})` : undefined}
                bgSize={bgSizePersonalized ? bgSizePersonalized : { base: "180%", md: "110%" }}
                bgPosition="center"
                bgAttachment="scroll"
                bgBlendMode="soft-light"
                bgRepeat="no-repeat"
                borderRadius={rounded}
                boxShadow="md"
                _hover={!bgSizePersonalized ? {
                    bgSize: { base: "200%", md: "110%" },
                } : undefined}
                transition={"all 0.5s ease-in-out"}
            >
                {bgVideo && (
                    <Box
                        position="absolute"
                        inset={0}
                        borderRadius={rounded}
                        overflow="hidden"
                    >
                        <video 
                            src={bgVideo} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: bgSizePersonalized || 'cover'
                            }}
                        />
                    </Box>
                )}
                
                {bgColor && <Box
                    position="absolute"
                    bg={bgColor}
                    insetY={0}
                    right={0}
                    bottom={0}
                    left={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    pointerEvents="none"
                >
                </Box>}

                {img && <Box
                    position="absolute"
                    insetY={0}
                    right={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    pointerEvents="none"
                >
                    <Image
                        src={img}
                        alt={title}
                        h={{ base: "115%", md: "120%" }}
                        w="auto"
                        objectFit="contain"
                        draggable={false}
                        loading="lazy"
                        animation={
                            prefersReducedMotion
                                ? undefined
                                : `${imgIn} 900ms cubic-bezier(.2,.65,.3,1) ${delayImage}s both`
                        }
                        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,.15))" }}
                    />
                </Box>}

                <Box
                    position="absolute"
                    {...pos[overlayPos]}
                    zIndex={2}
                    bg={overlayBg}
                    color={overlayText}
                    borderRadius={rounded}
                    borderTopRadius={{ base: "none", md: rounded }}
                    p={{ base: 4, md: 6 }}
                    backdropFilter="blur(8px)"
                    borderWidth="1px"
                    borderColor={'whiteAlpha.200'}
                    maxW={{ base: "100%", md: "80%" }}
                    animation={
                        prefersReducedMotion
                            ? undefined
                            : `${boxIn} 420ms cubic-bezier(.2,.65,.3,1) ${delayBox}s both`
                    }
                    boxShadow="md"
                >
                    <VStack spacing={{ base: 4, md: 6 }} justifyContent="center" alignItems="center">

                        {quote && <Text fontStyle="italic" fontSize={{ base: "xs", md: "sm" }} textAlign={overlayPos === "bc" ? "center" : "left"}>
                            "{quote}"
                        </Text>}

                        <VStack spacing={{ base: 1, md: 0 }} justifyContent="center">
                            <Text color={'brand.500'} fontSize={"md"}
                                fontWeight="bold" lineHeight={1.2} textAlign={overlayPos === "bc" ? "center" : "left"}>
                                {title}
                            </Text>

                            {description && (
                                <Text mt={1} fontSize={{ base: "xs", md: "sm" }} opacity={0.95} textAlign={overlayPos === "bc" ? "center" : "left"}>
                                    {description}
                                </Text>
                            )}
                        </VStack>
                    </VStack>
                </Box>
            </Box>
        </AspectRatio>
    );
};
