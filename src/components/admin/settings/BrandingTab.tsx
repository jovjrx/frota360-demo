import { Box, Heading, Text, VStack, Divider, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { BrandingFileUpload } from '@/components/admin/BrandingFileUpload';
import { SiteSettings } from '@/types/site-settings';

type BrandingField = 'logo' | 'favicon' | 'heroImage' | 'socialImage' | 'appleTouchIcon';

interface BrandingTabProps {
  settings: SiteSettings;
  updateBranding: (field: BrandingField, value: string) => void;
}

export function BrandingTab({ settings, updateBranding }: BrandingTabProps) {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Imagens e Ícones</Heading>
      <Divider />

      {/* LOGO */}
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>Logo</Heading>
        {settings.branding.logo && (
          <Box mb={3}>
            <Text fontSize="sm" mb={2}>Preview:</Text>
            <img src={settings.branding.logo} alt="Logo" style={{ maxWidth: '200px', maxHeight: '64px' }} />
          </Box>
        )}
        <BrandingFileUpload
          fileType="logo"
          currentUrl={settings.branding.logo}
          onUploadComplete={(url) => updateBranding('logo', url)}
        />
        <FormControl mt={3}>
          <FormLabel>Ou digite URL manualmente</FormLabel>
          <Input
            value={settings.branding.logo}
            onChange={(e) => updateBranding('logo', e.target.value)}
            placeholder="/img/logo.png ou URL completa"
          />
        </FormControl>
      </Box>

      {/* FAVICON */}
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>Favicon</Heading>
        {settings.branding.favicon && (
          <Box mb={3}>
            <Text fontSize="sm" mb={2}>Preview:</Text>
            <img src={settings.branding.favicon} alt="Favicon" style={{ maxWidth: '32px', maxHeight: '32px' }} />
          </Box>
        )}
        <BrandingFileUpload
          fileType="favicon"
          currentUrl={settings.branding.favicon}
          onUploadComplete={(url) => updateBranding('favicon', url)}
        />
        <FormControl mt={3}>
          <FormLabel>Ou digite URL manualmente</FormLabel>
          <Input
            value={settings.branding.favicon}
            onChange={(e) => updateBranding('favicon', e.target.value)}
            placeholder="/img/icone.png ou URL completa"
          />
        </FormControl>
      </Box>

      {/* APPLE TOUCH ICON */}
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>Apple Touch Icon</Heading>
        {settings.branding.appleTouchIcon && (
          <Box mb={3}>
            <Text fontSize="sm" mb={2}>Preview:</Text>
            <img src={settings.branding.appleTouchIcon} alt="Apple Touch Icon" style={{ maxWidth: '180px', maxHeight: '180px' }} />
          </Box>
        )}
        <BrandingFileUpload
          fileType="appleTouchIcon"
          currentUrl={settings.branding.appleTouchIcon}
          onUploadComplete={(url) => updateBranding('appleTouchIcon', url)}
        />
        <FormControl mt={3}>
          <FormLabel>Ou digite URL manualmente</FormLabel>
          <Input
            value={settings.branding.appleTouchIcon}
            onChange={(e) => updateBranding('appleTouchIcon', e.target.value)}
            placeholder="/img/icone.png ou URL completa"
          />
        </FormControl>
      </Box>
    </VStack>
  );
}

