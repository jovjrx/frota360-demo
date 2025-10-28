import { Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { Container } from '@/components/Container';
import { Title } from '@/components/Title';

interface FAQBlockProps {
  block: any;
  t: (key: string, fallback?: any) => any;
  getArray?: (value: any) => any[];
  getText?: (value: any) => string;
}

export function FAQBlock({ block, t, getArray, getText }: FAQBlockProps) {
  const getValue = (value: any) => getText ? getText(value) : t(value);
  const faqItems = getArray ? getArray(block.items) : (Array.isArray(block.items) ? block.items : []);

  return (
    <Container>
      <Title
        title={getValue(block.title)}
        description={getValue(block.subtitle)}
        feature={getValue(block.feature)}
      />
      <Box maxW="4xl" mx="auto">
        <Accordion allowToggle>
          {Array.isArray(faqItems) &&
            faqItems.map((item: any, i: number) => (
              <AccordionItem key={i} border="1px" borderColor="gray.200" borderRadius="md" mb={2}>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold">
                    {getValue(item.question)}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} color="gray.600">
                  {getValue(item.answer)}
                </AccordionPanel>
              </AccordionItem>
            ))}
        </Accordion>
      </Box>
    </Container>
  );
}

