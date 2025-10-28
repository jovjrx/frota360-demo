import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  useToast,
  Spinner,
  Text,
} from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { SiteSettings } from '@/types/site-settings';
import { GlobalTabs, TabConfig } from '@/components/GlobalTabs';
import { BrandingTab } from '@/components/admin/settings/BrandingTab';
import { ColorsTab } from '@/components/admin/settings/ColorsTab';
import { SEOTab } from '@/components/admin/settings/SEOTab';
import { ContactTab } from '@/components/admin/settings/ContactTab';
import { SMTPTab } from '@/components/admin/settings/SMTPTab';
import { TrackingTab } from '@/components/admin/settings/TrackingTab';

export default function Settings({ translations }: AdminPageProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/site-settings');
      const data = await res.json();
      if (data?.success) {
        setSettings(data.settings);
      } else {
        toast({ status: 'error', title: 'Erro ao carregar configurações' });
      }
    } catch (error) {
      toast({ status: 'error', title: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!settings) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Configurações salvas!' });
        await load();
      } else {
        toast({ status: 'error', title: data?.error || 'Erro ao salvar' });
      }
    } catch (error) {
      toast({ status: 'error', title: 'Erro ao salvar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = (field: keyof typeof settings.branding, value: string) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      branding: { ...prev.branding, [field]: value }
    } : null);
  };

  const updateColors = (field: keyof typeof settings.colors, value: string) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      colors: { ...prev.colors, [field]: value }
    } : null);
  };

  const updateSEO = (locale: string, field: keyof SiteSettings['seo']['pt'], value: string) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      seo: {
        ...prev.seo,
        [locale]: {
          ...prev.seo[locale],
          [field]: value
        }
      }
    } : null);
  };

  const availableLocales = settings ? Object.keys(settings.seo || {}) : ['pt', 'en'];
  const localeNames: { [key: string]: string } = {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
  };

  const updateTracking = (field: keyof typeof settings.tracking, value: string | boolean) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      tracking: { ...prev.tracking, [field]: value }
    } : null);
  };

  const updateContact = (field: keyof typeof settings.contact, value: string) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      contact: { ...prev.contact, [field]: value }
    } : null);
  };

  const updateSMTP = (field: keyof typeof settings.smtp, value: string | number | boolean) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      smtp: { ...prev.smtp, [field]: value }
    } : null);
  };

  // Build tabs with components
  const tabs: TabConfig[] = useMemo(() => {
    if (!settings) return [];
    const baseTabs: TabConfig[] = [
      {
        key: 'branding',
        label: 'Branding',
        content: <BrandingTab settings={settings} updateBranding={updateBranding} />
      },
      {
        key: 'colors',
        label: 'Cores',
        content: (
          <ColorsTab 
            settings={settings} 
            updateColors={updateColors}
            setSettings={setSettings}
          />
        )
      },
      {
        key: 'seo',
        label: 'SEO',
        content: (
          <SEOTab
            settings={settings}
            availableLocales={availableLocales}
            localeNames={localeNames}
            updateSEO={updateSEO}
          />
        )
      },
      {
        key: 'contact',
        label: 'Contato',
        content: <ContactTab settings={settings} updateContact={updateContact} />
      },
      {
        key: 'smtp',
        label: 'SMTP',
        content: <SMTPTab settings={settings} updateSMTP={updateSMTP} />
      },
      {
        key: 'tracking',
        label: 'Tracking',
        content: <TrackingTab settings={settings} updateTracking={updateTracking} />
      },
    ];

    return baseTabs;
  }, [settings, availableLocales, localeNames, updateBranding, updateColors, updateSEO, updateContact, updateSMTP, updateTracking]);

  if (!settings) {
    return (
      <AdminLayout
        title="Configurações do Site"
        subtitle="Gerencie todas as configurações da plataforma"
        translations={translations}
      >
        <VStack justify="center" align="center" minH="400px">
          <Spinner size="lg" />
          <Text>Carregando configurações...</Text>
        </VStack>
      </AdminLayout>
  );
}

  return (
    <AdminLayout
      title="Configurações do Site"
      subtitle="Gerencie todas as configurações da plataforma"
      translations={translations}
      side={
        <HStack spacing={2}>
          <Button onClick={load} isLoading={loading} variant="outline" size="sm">
            Recarregar
          </Button>
          <Button onClick={save} isLoading={loading} colorScheme="blue" size="sm">
            Salvar Alterações
          </Button>
        </HStack>
      }
    >
      <GlobalTabs tabs={tabs} />
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => ({}));
