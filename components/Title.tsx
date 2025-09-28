import { Badge, Box, Button, Heading, Link, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useLocalizedHref } from "@/lib/linkUtils"

export const Title = ({ title, description, feature, text, link, linkText, cta, ctaText, center = true }:
    { title: string, description?: string, feature?: string, text?: string, link?: string, linkText?: string, cta?: string, ctaText?: string, center?: boolean }) => {
    const subMuted = "gray.700";
    const alignment = { base: 'center', lg: center ? "center" : "flex-start" };
    const alignmentText: any = { base: 'center', lg: center ? "center" : "left" };
    const getLocalizedHref = useLocalizedHref();
    return (
        <VStack spacing={6}
            justifyContent={alignment}
            alignItems={alignment}
            mb={{ base: 8, md: 12 }}>

            {feature && <Badge colorScheme="brand" variant="subtle" px={3} py={1} rounded="full">
                {feature}
            </Badge>}

            {(title || description) && <VStack spacing={0}
                alignItems={alignment}>
                <Heading size="lg" textAlign={alignmentText}>{title}</Heading>
                {description && <Text textAlign={alignmentText} color={subMuted} maxW="2xl">
                    {description}
                </Text>}
            </VStack>}

            {text && <Text color={subMuted} maxW="2xl"
                textAlign={alignmentText}>{text}</Text>}

            {link && <Button
                as={NextLink}
                href={getLocalizedHref(link)}
                size="sm"
                variant="outline"
                colorScheme="brand"
            >
                {linkText || link}
            </Button>}

            {cta && <Button
                as={NextLink}
                href={getLocalizedHref(cta)}
                size="lg"
                colorScheme="brand"
                rightIcon={<Box as="span">→</Box>}
            >
                {ctaText || cta}
            </Button>}
        </VStack>
    )
}
