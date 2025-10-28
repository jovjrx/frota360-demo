// Tipos para blocos de página dinâmica

export type BlockType =
  | 'hero'
  | 'payments'
  | 'benefits'
  | 'referral'
  | 'how_it_works'
  | 'services'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'card_with_highlight'
  | 'team'
  | 'value_cards'
  | 'financing'
  | 'requirements'
  | 'support'
  | 'title_only';

export interface HeroBlock {
  type: 'hero';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  badge?: string | { pt: string; en: string };
  backgroundImage: string; // URL da imagem
  highlightTitle: string | { pt: string; en: string };
  highlightDescription: string | { pt: string; en: string };
  highlightImage: string; // URL da imagem
  primaryButtonText: string | { pt: string; en: string };
  primaryButtonLink: string;
  secondaryButtonText: string | { pt: string; en: string };
  secondaryButtonLink: string;
}

export interface PaymentsBlock {
  type: 'payments';
}

export interface BenefitsBlock {
  type: 'benefits';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  items: string | Array<{
    title: string | { pt: string; en: string };
    description: string | { pt: string; en: string };
    icon?: string;
  }>;
}

export interface ReferralBlock {
  type: 'referral';
}

export interface HowItWorksBlock {
  type: 'how_it_works';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  steps: string | Array<{
    number?: string;
    title: string | { pt: string; en: string };
    description: string | { pt: string; en: string };
    image?: string; // URL da imagem
  }>;
}

export interface ServicesBlock {
  type: 'services';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  services?: Array<{
    title: string | { pt: string; en: string };
    description: string | { pt: string; en: string };
    color: string;
    buttonText: string | { pt: string; en: string };
    buttonLink: string;
    image: string; // URL da imagem
  }>;
}

export interface TestimonialsBlock {
  type: 'testimonials';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  items: string | Array<{
    name: string;
    text: string | { pt: string; en: string };
    rating?: number;
  }>;
}

export interface FAQBlock {
  type: 'faq';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  items: string | Array<{
    question: string | { pt: string; en: string };
    answer: string | { pt: string; en: string };
  }>;
}

export interface CTABlock {
  type: 'cta';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  buttonText: string | { pt: string; en: string };
  buttonLink: string;
  centered?: boolean;
}

export interface CardWithHighlightBlock {
  type: 'card_with_highlight';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  cardTitle: string | { pt: string; en: string };
  cardDescription: string | { pt: string; en: string };
  cardContent: string | { pt: string; en: string };
  valuesTitle: string | { pt: string; en: string };
  values: string | string[] | Array<{ pt: string; en: string }>;
  statsTitle: string | { pt: string; en: string };
  stats: string | Array<{ value: string; label: string | { pt: string; en: string } }>;
  highlight?: any;
  highlightTitle?: string | { pt: string; en: string };
  highlightDescription?: string | { pt: string; en: string };
  highlightImage?: string; // URL da imagem
  overlayPos?: string;
  bgSizePersonalized?: string;
  delayImage?: number;
  delayBox?: number;
}

export interface TeamBlock {
  type: 'team';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  items: string | Array<{
    name: string;
    position: string | { pt: string; en: string };
    bio: string | { pt: string; en: string };
    photo?: string; // URL da foto
    expertise?: string[] | Array<{ pt: string; en: string }>;
  }>;
}

export interface ValueCardsBlock {
  type: 'value_cards';
  title?: string | { pt: string; en: string };
  subtitle?: string | { pt: string; en: string };
  feature?: string | { pt: string; en: string };
  items: string | Array<{
    title: string | { pt: string; en: string };
    description: string | { pt: string; en: string };
    icon?: string;
    color: string;
  }>;
}

export interface FinancingBlock {
  type: 'financing';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  cardTitle: string | { pt: string; en: string };
  cardDescription: string | { pt: string; en: string };
  alert?: string | { pt: string; en: string };
  benefits?: string | string[] | Array<{ pt: string; en: string }>;
  example?: any;
}

export interface RequirementsBlock {
  type: 'requirements';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  documentsTitle: string | { pt: string; en: string };
  documents: string | string[] | Array<{ pt: string; en: string }>;
  integrationsTitle: string | { pt: string; en: string };
  integrationsDescription: string | { pt: string; en: string };
  integrations: string | Array<{ platform: string; requirement: string | { pt: string; en: string } }>;
  bankingTitle: string | { pt: string; en: string };
  bankingDescription: string | { pt: string; en: string };
  banking: string | string[] | Array<{ pt: string; en: string }>;
}

export interface SupportBlock {
  type: 'support';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
  items: string | Array<{
    icon?: string;
    description: string | { pt: string; en: string };
    link: string;
    label: string | { pt: string; en: string };
  }>;
}

export interface TitleOnlyBlock {
  type: 'title_only';
  title: string | { pt: string; en: string };
  subtitle: string | { pt: string; en: string };
  feature: string | { pt: string; en: string };
}

export type PageBlock =
  | HeroBlock
  | PaymentsBlock
  | BenefitsBlock
  | ReferralBlock
  | HowItWorksBlock
  | ServicesBlock
  | TestimonialsBlock
  | FAQBlock
  | CTABlock
  | CardWithHighlightBlock
  | TeamBlock
  | ValueCardsBlock
  | FinancingBlock
  | RequirementsBlock
  | SupportBlock
  | TitleOnlyBlock;

export interface PageBlocksConfig {
  blocks: PageBlock[];
}

