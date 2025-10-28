import { Badge, Box, Button, Heading, Link, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useLocalizedHref } from "@/lib/linkUtils"
import { useLanguage } from "@/components/providers/Language"

// Helper para extrair string de objeto multilíngua
function getLocalizedText(value: any, locale: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if (value.pt || value.en) {
      return locale === 'pt' ? (value.pt || value.en || '') : (value.en || value.pt || '');
    }
  }
  return '';
}

export const Title = ({ title, description, feature, text, link, linkText, cta, ctaText, center = true }:
    { title: string | { pt: string; en: string }, description?: string | { pt: string; en: string }, feature?: string | { pt: string; en: string }, text?: string, link?: string, linkText?: string, cta?: string, ctaText?: string | { pt: string; en: string }, center?: boolean }) => {
    const subMuted = "gray.700";
    const alignment = { base: 'center', lg: center ? "center" : "flex-start" };
    const alignmentText: any = { base: 'center', lg: center ? "center" : "left" };
    const getLocalizedHref = useLocalizedHref();
    const { locale } = useLanguage();
    
    const titleText = getLocalizedText(title, locale);
    const descriptionText = description ? getLocalizedText(description, locale) : undefined;
    const featureText = feature ? getLocalizedText(feature, locale) : undefined;
    const ctaTextValue = ctaText ? getLocalizedText(ctaText, locale) : undefined;
    
    return (
        <VStack spacing={6}
            justifyContent={alignment}
            alignItems={alignment}
            mb={{ base: 8, md: 12 }}>

            {feature && featureText && <Badge colorScheme="brand" variant="subtle" px={3} py={1} rounded="full">
                {featureText}
            </Badge>}

            {(title || description) && <VStack spacing={0}
                alignItems={alignment}>
                <Heading size="lg" textAlign={alignmentText}>{titleText}</Heading>
                {description && descriptionText && <Text textAlign={alignmentText} color={subMuted} maxW="2xl">
                    {descriptionText}
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
                {ctaTextValue || cta}
            </Button>}
        </VStack>
    )
}

