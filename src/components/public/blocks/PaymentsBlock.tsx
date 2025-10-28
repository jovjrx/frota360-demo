import PaymentsCallout from '@/components/public/PaymentsCallout';

interface PaymentsBlockProps {
  block: any;
  getText: (value: any) => string;
  locale?: string;
}

export function PaymentsBlock({ block, getText, locale = 'pt' }: PaymentsBlockProps) {
  // Extrai dados multilínguas do bloco
  const badge = getText(block.badge);
  const title = getText(block.title);
  const subtitle = getText(block.subtitle);
  const description = getText(block.description);
  
  // Extrai features
  const features = block.features ? block.features.map((feature: any) => ({
    title: getText(feature.title),
    description: getText(feature.description),
    icon: feature.icon,
    color: feature.color,
  })) : [];
  
  // Extrai stats com valores padrão se não existir
  const stats = block.stats ? {
    reliability: getText(block.stats.reliability || ''),
    hidden: getText(block.stats.hidden || ''),
    processing: getText(block.stats.processing || ''),
  } : {
    reliability: '',
    hidden: '',
    processing: '',
  };
  
  // Extrai highlights (opcional)
  const highlights = block.highlights ? block.highlights.map((highlight: any) => getText(highlight)) : [];

  return (
    <PaymentsCallout
      badge={badge}
      title={title}
      subtitle={subtitle}
      description={description}
      features={features}
      stats={stats}
      highlights={highlights}
    />
  );
}

