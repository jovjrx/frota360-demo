import { VStack, Heading, Text, Divider, SimpleGrid, FormControl, FormLabel, Input, FormLabelProps, Switch, Box } from '@chakra-ui/react';
import { SiteSettings } from '@/types/site-settings';

interface SMTPTabProps {
  settings: SiteSettings;
  updateSMTP: (field: keyof SiteSettings['smtp'], value: string | number | boolean) => void;
}

export function SMTPTab({ settings, updateSMTP }: SMTPTabProps) {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Configurações SMTP</Heading>
      <Text color="gray.600">
        Configurações do servidor de email para envio de mensagens. A senha deve ser configurada como variável de ambiente (EMAIL_PASSWORD ou EMAIL_APP_PASSWORD).
      </Text>
      <Divider />

      <FormControl display="flex" alignItems="center" justifyContent="space-between">
        <FormLabel mb="0">Habilitar SMTP</FormLabel>
        <Switch
          isChecked={settings.smtp.enabled}
          onChange={(e) => updateSMTP('enabled', e.target.checked)}
        />
      </FormControl>

      <Divider />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Servidor SMTP</FormLabel>
          <Input
            value={settings.smtp.host}
            onChange={(e) => updateSMTP('host', e.target.value)}
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            Ex: smtp.gmail.com
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Porta</FormLabel>
          <Input
            type="number"
            value={settings.smtp.port}
            onChange={(e) => updateSMTP('port', parseInt(e.target.value))}
          />
          <Text fontSize="sm" color="gray.600" mt={1}>
            Ex: 465 (SSL) ou 587 (TLS)
          </Text>
        </FormControl>
      </SimpleGrid>

      <FormControl display="flex" alignItems="center" justifyContent="space-between">
        <FormLabel mb="0">Secure (SSL/TLS)</FormLabel>
        <Switch
          isChecked={settings.smtp.secure}
          onChange={(e) => updateSMTP('secure', e.target.checked)}
        />
        <Text fontSize="sm" color="gray.600">
          true para porta 465, false para 587
        </Text>
      </FormControl>

      <Divider />
      <Heading size="sm">Informações do Remetente</Heading>

      <FormControl>
        <FormLabel>Email (Usuario)</FormLabel>
        <Input
          value={settings.smtp.user}
          onChange={(e) => updateSMTP('user', e.target.value)}
        />
        <Text fontSize="sm" color="gray.600" mt={1}>
          Email que dispara as mensagens
        </Text>
      </FormControl>

      <FormControl>
        <FormLabel>Nome do Remetente</FormLabel>
        <Input
          value={settings.smtp.name}
          onChange={(e) => updateSMTP('name', e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormLabel>Reply-To</FormLabel>
        <Input
          value={settings.smtp.replyTo}
          onChange={(e) => updateSMTP('replyTo', e.target.value)}
        />
        <Text fontSize="sm" color="gray.600" mt={1}>
          Email para respostas
        </Text>
      </FormControl>

      <Box p={4} bg="yellow.50" borderRadius="md" borderWidth="1px" borderColor="yellow.200">
        <Text fontSize="sm" color="yellow.800" fontWeight="bold" mb={2}>
          ⚠️ Segurança
        </Text>
        <Text fontSize="sm" color="yellow.700">
          A senha do email deve ser configurada como variável de ambiente:
          <code style={{ display: 'block', marginTop: '8px', padding: '8px', background: '#fff', borderRadius: '4px' }}>
            EMAIL_PASSWORD ou EMAIL_APP_PASSWORD
          </code>
        </Text>
      </Box>
    </VStack>
  );
}

