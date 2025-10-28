import ReferralSection from '@/components/public/ReferralSection';

interface ReferralBlockProps {
  block: any;
  getText: (value: any) => string;
  getArray?: (value: any) => any[];
  locale?: string;
}

export function ReferralBlock({ block, getText, getArray, locale = 'pt' }: ReferralBlockProps) {
  const getArrayData = getArray || ((value: any) => Array.isArray(value) ? value : []);
  
  // Extrai dados multilínguas do bloco
  const feature = getText(block.feature);
  const title = getText(block.title);
  const subtitle = getText(block.subtitle);
  const description = getText(block.description);
  const cta = getText(block.cta);
  const ctaAuth = getText(block.ctaAuth);
  
  // Extrai howItWorks
  const howItWorks = block.howItWorks ? getArrayData(block.howItWorks).map((item: any) => getText(item)) : [];

  return (
    <ReferralSection
      feature={feature}
      title={title}
      subtitle={subtitle}
      description={description}
      howItWorks={howItWorks}
      cta={cta}
      ctaAuth={ctaAuth}
    />
  );
}

