import { Container } from '@/components/Container';
import { Title } from '@/components/Title';
import { useLocalizedHref } from '@/lib/linkUtils';

interface CTABlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getText?: (value: any) => string;
}

export function CTABlock({ block, t, getText }: CTABlockProps) {
  const getLocalizedHref = useLocalizedHref();
  const getValue = (value: any) => getText ? getText(value) : t(value);

  return (
    <Container softBg>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
        ctaText={getValue(block.buttonText)}
        cta={getLocalizedHref(block.buttonLink)}
        center={block.centered}
      />
    </Container>
  );
}

