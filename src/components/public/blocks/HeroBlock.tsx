import NextLink from 'next/link';
import { VStack, HStack, Button } from '@chakra-ui/react';
import { ArrowRightIcon } from '@chakra-ui/icons';
import Hero from '@/components/Hero';
import { Highlight } from '@/components/Highlight';
import BadgesValue from '@/components/public/BadgesValue';
import { useLocalizedHref } from '@/lib/linkUtils';
import { useFacebookTracking } from '@/hooks/useFacebookTracking';

interface HeroBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  tPage: (key: string) => any;
  getText: (value: any) => string;
}

export function HeroBlock({ block, t, tPage, getText }: HeroBlockProps) {
  const getLocalizedHref = useLocalizedHref();
  const { trackCheckoutStart } = useFacebookTracking();

  return (
    <Hero
      title={getText(block.title)}
      subtitle={getText(block.subtitle)}
      backgroundImage={block.backgroundImage}
      badge={getText(block.badge)}
      overlay
      actions={
        <VStack spacing={{ base: 3, md: 4 }} w="full">
          <BadgesValue t={tPage} />
          <HStack
            spacing={{ base: 2, md: 4 }}
            flexDirection={{ base: 'column', md: 'row' }}
            w="full"
            align="center"
          >
            <Button
              as={NextLink}
              href={getLocalizedHref(block.primaryButtonLink)}
              size={{ base: 'md', md: 'lg' }}
              px={{ base: 6, md: 8 }}
              py={{ base: 3, md: 4 }}
              w={{ base: 'full', md: 'auto' }}
              shadow="lg"
              colorScheme="green"
              rightIcon={<ArrowRightIcon />}
              onClick={() => trackCheckoutStart('Driver Application - Hero')}
            >
              {getText(block.primaryButtonText)}
            </Button>
            <Button
              as={NextLink}
              href={block.secondaryButtonLink}
              size={{ base: 'md', md: 'lg' }}
              px={{ base: 6, md: 8 }}
              py={{ base: 3, md: 4 }}
              w={{ base: 'full', md: 'auto' }}
              variant="outline"
              colorScheme="whiteAlpha"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{
                bg: 'whiteAlpha.100',
                borderColor: 'whiteAlpha.600',
              }}
            >
              {getText(block.secondaryButtonText)}
            </Button>
          </HStack>
        </VStack>
      }
    >
      <Highlight
        title={getText(block.highlightTitle)}
        description={getText(block.highlightDescription)}
        bgImage={block.highlightImage}
        delayImage={0.5}
        delayBox={0.8}
      />
    </Hero>
  );
}

