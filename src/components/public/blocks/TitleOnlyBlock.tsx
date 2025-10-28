import { Container } from '@/components/Container';
import { Title } from '@/components/Title';

interface TitleOnlyBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getText?: (value: any) => string;
}

export function TitleOnlyBlock({ block, t, getText }: TitleOnlyBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  
  return (
    <Container softBg>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
    </Container>
  );
}

