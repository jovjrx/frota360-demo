import { Badge, VStack, Box, Heading, Text, Card as ChakraCard, CardBody, CardHeader, Image } from "@chakra-ui/react";


export const Card = ({ title, description, icon, children, borded, animated, img, color = 'brand' }:
    {
        title?: string,
        borded?: boolean,
        description?: string,
        icon?: string,
        children?: React.ReactNode,
        animated?: boolean,
        img?: string
        color?: string
    }) => {
    const cardBg = "white"
    const subMuted = "gray.700"
    return (
        <ChakraCard bg={cardBg} shadow="lg" borderRadius="2xl" overflow="hidden"
            borderTop={borded ? "4px" : "0px"}
            borderColor={borded ? `${color || 'brand'}.500` : "transparent"}
            _hover={animated ? {
                transform: "translateY(-4px)",
                boxShadow: "xl",
            } : {}}
            transition={animated ? "transform 0.2s ease-in-out" : "none"}
            alignItems="space-between"
        >
            {img && <Image src={img} w="full" h="auto" objectFit="cover" alt={title} />}

            <CardHeader>
                {(icon || title || description) &&
                    (<VStack justify="center" align="center" spacing={4}>
                        {icon && <Box fontSize="4xl">
                            {icon}
                        </Box>}
                        {title && <Heading size="md" textAlign="center">
                            {title}
                        </Heading>}
                        {description && <Text color={subMuted} fontSize="sm" textAlign="center">
                            {description}
                        </Text>}

                    </VStack>)}
            </CardHeader>
            {children && <CardBody p={8}>
                {children}
            </CardBody>}
        </ChakraCard>);
};
