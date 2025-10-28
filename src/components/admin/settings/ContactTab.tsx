import { VStack, Heading, Divider, SimpleGrid, FormControl, FormLabel, Input, Textarea, Text } from '@chakra-ui/react';
import { SiteSettings } from '@/types/site-settings';

interface ContactTabProps {
  settings: SiteSettings;
  updateContact: (field: keyof SiteSettings['contact'], value: string) => void;
}

export function ContactTab({ settings, updateContact }: ContactTabProps) {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Informações de Contato</Heading>
      <Divider />

      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input
          value={settings.contact.email || ''}
          onChange={(e) => updateContact('email', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Telefone</FormLabel>
        <Input
          value={settings.contact.phone || ''}
          onChange={(e) => updateContact('phone', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Endereço</FormLabel>
        <Input
          value={settings.contact.address || ''}
          onChange={(e) => updateContact('address', e.target.value)}
        />
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Cidade</FormLabel>
          <Input
            value={settings.contact.city || ''}
            onChange={(e) => updateContact('city', e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Código Postal</FormLabel>
          <Input
            value={settings.contact.postalCode || ''}
            onChange={(e) => updateContact('postalCode', e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>País</FormLabel>
          <Input
            value={settings.contact.country || ''}
            onChange={(e) => updateContact('country', e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>NIPC/NIF</FormLabel>
          <Input
            value={settings.contact.nipc || ''}
            onChange={(e) => updateContact('nipc', e.target.value)}
          />
        </FormControl>
      </SimpleGrid>

      <Divider />
      <Heading size="sm">Redes Sociais</Heading>

      <FormControl>
        <FormLabel>Facebook URL</FormLabel>
        <Input
          value={settings.contact.facebookUrl || ''}
          onChange={(e) => updateContact('facebookUrl', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Instagram URL</FormLabel>
        <Input
          value={settings.contact.instagramUrl || ''}
          onChange={(e) => updateContact('instagramUrl', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Twitter Handle</FormLabel>
        <Input
          value={settings.contact.twitterHandle || ''}
          onChange={(e) => updateContact('twitterHandle', e.target.value)}
        />
      </FormControl>

      <Divider />
      <Heading size="sm">Textos do Footer</Heading>

      <FormControl>
        <FormLabel>Tagline</FormLabel>
        <Input
          value={settings.contact.tagline || ''}
          onChange={(e) => updateContact('tagline', e.target.value)}
        />
        <Text fontSize="sm" color="gray.600" mt={1}>
          Frase de efeito principal
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>Descrição</FormLabel>
        <Textarea
          value={settings.contact.description || ''}
          onChange={(e) => updateContact('description', e.target.value)}
          rows={2}
        />
        <Text fontSize="sm" color="gray.600" mt={1}>
          Descrição da empresa
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>Copyright</FormLabel>
        <Input
          value={settings.contact.copyright || ''}
          onChange={(e) => updateContact('copyright', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Texto "Desenvolvido por"</FormLabel>
        <Input
          value={settings.contact.developerBy || ''}
          onChange={(e) => updateContact('developerBy', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Nome do Desenvolvedor</FormLabel>
        <Input
          value={settings.contact.developer || ''}
          onChange={(e) => updateContact('developer', e.target.value)}
        />
      </FormControl>
    </VStack>
  );
}

