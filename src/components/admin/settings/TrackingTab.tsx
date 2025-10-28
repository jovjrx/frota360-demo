import { VStack, Heading, Divider, FormControl, FormLabel, Input, Text, Switch, SimpleGrid } from '@chakra-ui/react';
import { SiteSettings } from '@/types/site-settings';

interface TrackingTabProps {
  settings: SiteSettings;
  updateTracking: (field: string, value: string | boolean) => void;
}

export function TrackingTab({ settings, updateTracking }: TrackingTabProps) {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Tracking e Analytics</Heading>
      <Divider />

      {/* Google */}
      <Heading size="sm">Google</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Google Analytics ID</FormLabel>
          <Input
            value={settings.tracking.googleAnalyticsId || ''}
            onChange={(e) => updateTracking('googleAnalyticsId', e.target.value)}
            placeholder="G-XXXXXXXXXX"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            ID do Google Analytics
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Google Tag Manager ID</FormLabel>
          <Input
            value={settings.tracking.googleTagManagerId || ''}
            onChange={(e) => updateTracking('googleTagManagerId', e.target.value)}
            placeholder="GTM-XXXXXXX"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            ID do Google Tag Manager
          </Text>
        </FormControl>
      </SimpleGrid>

      <Divider />

      {/* Meta/Facebook */}
      <Heading size="sm">Meta/Facebook</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Facebook Pixel ID</FormLabel>
          <Input
            value={settings.tracking.facebookPixelId || ''}
            onChange={(e) => updateTracking('facebookPixelId', e.target.value)}
            placeholder="123456789012345"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            ID do Pixel do Facebook
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Meta Access Token</FormLabel>
          <Input
            value={(settings.tracking as any).metaAccessToken || ''}
            onChange={(e) => updateTracking('metaAccessToken', e.target.value)}
            placeholder="EAABsbCS1iHg..."
            type="password"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            Access Token do Meta Business
          </Text>
        </FormControl>
      </SimpleGrid>

      <Divider />

      {/* TikTok */}
      <Heading size="sm">TikTok</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>TikTok Pixel ID</FormLabel>
          <Input
            value={(settings.tracking as any).tiktokPixelId || ''}
            onChange={(e) => updateTracking('tiktokPixelId', e.target.value)}
            placeholder="CXXXXXXXXXXXXXXX"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            ID do Pixel do TikTok
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>TikTok Access Token</FormLabel>
          <Input
            value={(settings.tracking as any).tiktokAccessToken || ''}
            onChange={(e) => updateTracking('tiktokAccessToken', e.target.value)}
            placeholder="your_access_token"
            type="password"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            Access Token do TikTok
          </Text>
        </FormControl>
      </SimpleGrid>

      <Divider />

      {/* Outros */}
      <Heading size="sm">Outros</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Microsoft Clarity ID</FormLabel>
          <Input
            value={(settings.tracking as any).microsoftClarityId || ''}
            onChange={(e) => updateTracking('microsoftClarityId', e.target.value)}
            placeholder="xxxxxxxxxx"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            ID do Microsoft Clarity
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Hotjar Site ID</FormLabel>
          <Input
            value={(settings.tracking as any).hotjarSiteId || ''}
            onChange={(e) => updateTracking('hotjarSiteId', e.target.value)}
            placeholder="1234567"
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            Site ID do Hotjar
          </Text>
        </FormControl>
      </SimpleGrid>

      <Divider />

      <Heading size="sm">Vercel</Heading>
      <FormControl display="flex" alignItems="center" justifyContent="space-between">
        <FormLabel mb="0">Vercel Analytics</FormLabel>
        <Switch
          isChecked={settings.tracking.vercelAnalyticsEnabled || false}
          onChange={(e) => updateTracking('vercelAnalyticsEnabled', e.target.checked)}
        />
      </FormControl>

      <FormControl display="flex" alignItems="center" justifyContent="space-between">
        <FormLabel mb="0">Vercel Speed Insights</FormLabel>
        <Switch
          isChecked={settings.tracking.vercelSpeedInsightsEnabled || false}
          onChange={(e) => updateTracking('vercelSpeedInsightsEnabled', e.target.checked)}
        />
      </FormControl>
    </VStack>
  );
}

