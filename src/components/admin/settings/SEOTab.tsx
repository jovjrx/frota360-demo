import { VStack, Heading, Divider, FormControl, FormLabel, Input, Textarea, Tabs, TabList, TabPanels, Tab, TabPanel, Text } from '@chakra-ui/react';
import { SiteSettings, SEOConfig } from '@/types/site-settings';

interface SEOTabProps {
  settings: SiteSettings;
  availableLocales: string[];
  localeNames: { [key: string]: string };
  updateSEO: (locale: string, field: keyof SEOConfig, value: string) => void;
}

export function SEOTab({ settings, availableLocales, localeNames, updateSEO }: SEOTabProps) {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Configurações SEO</Heading>
      <Divider />

      <Tabs isLazy>
        <TabList>
          {availableLocales.map(locale => (
            <Tab key={locale}>{localeNames[locale] || locale.toUpperCase()}</Tab>
          ))}
        </TabList>

        <TabPanels>
          {availableLocales.map(locale => (
            <TabPanel key={locale}>
              <VStack spacing={4} align="stretch">
                <Heading size="sm">SEO para {localeNames[locale] || locale.toUpperCase()}</Heading>
                <Divider />

                <FormControl>
                  <FormLabel>{locale === 'pt' ? 'Título' : 'Title'}</FormLabel>
                  <Input
                    value={settings.seo[locale]?.title || ''}
                    onChange={(e) => updateSEO(locale, 'title', e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>{locale === 'pt' ? 'Descrição' : 'Description'}</FormLabel>
                  <Textarea
                    value={settings.seo[locale]?.description || ''}
                    onChange={(e) => updateSEO(locale, 'description', e.target.value)}
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Keywords</FormLabel>
                  <Input
                    value={settings.seo[locale]?.keywords || ''}
                    onChange={(e) => updateSEO(locale, 'keywords', e.target.value)}
                    placeholder="palavra-chave1, palavra-chave2, palavra-chave3"
                  />
                </FormControl>

                <Divider />
                <Heading size="sm">Open Graph (Redes Sociais)</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Informações exibidas quando o link é compartilhado nas redes sociais
                </Text>

                <FormControl>
                  <FormLabel>OG Image URL</FormLabel>
                  <Input
                    value={settings.seo[locale]?.defaultOgImage || ''}
                    onChange={(e) => updateSEO(locale, 'defaultOgImage', e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </FormControl>
              </VStack>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

