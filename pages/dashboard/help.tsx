import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Link as ChakraLink,
  Button,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import {
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiExternalLink,
  FiSend,
} from 'react-icons/fi';
import { useState } from 'react';
import PainelLayout from '@/components/layouts/DashboardLayout';
import Link from 'next/link';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';

const CONTACT_INFO = {
  phone: '+351 91 234 5678',
  phoneFormatted: '+351 91 234 5678',
  whatsappLink: 'https://wa.me/351912345678',
  email: 'conduz@alvoradamagistral.eu',
  emailLink: 'mailto:conduz@alvoradamagistral.eu',
};

const EXTERNAL_LINKS = {
  uber: 'https://www.uber.com/pt/drive/',
  bolt: 'https://partners.bolt.eu/',
  myprio: 'https://www.myprio.pt/',
  viaverde: 'https://www.viaverde.pt/',
};

const SCHEDULE = {
  weekday: 'Segunda a Sexta',
  weekdayHours: '9h - 18h',
  saturday: 'Sábado',
  saturdayHours: '9h - 13h',
  sunday: 'Domingo e Feriados',
  sundayStatus: 'Fechado',
};

const TEXTS = {
  contactCards: {
    phone: 'Telefone / WhatsApp',
    email: 'Email',
    chat: 'Chat Online',
    chatAvailability: 'Segunda a Sexta',
    chatHours: '9h - 18h',
  },
  contactForm: {
    title: 'Envie-nos uma Mensagem',
    description: 'Preencha o formulário abaixo e nossa equipe entrará em contato em breve.',
    labelName: 'Nome',
    labelEmail: 'Email',
    labelSubject: 'Assunto',
    labelMessage: 'Mensagem',
    placeholderSubject: 'Ex: Dúvida sobre contracheque, alteração de dados...',
    placeholderMessage: 'Descreva sua dúvida ou solicitação com o máximo de detalhes possível...',
    buttonSubmit: 'Enviar Mensagem',
    buttonSubmitting: 'Enviando...',
  },
  toast: {
    errorTitle: 'Erro',
    errorRequired: 'Por favor, preencha todos os campos',
    successTitle: 'Mensagem enviada!',
    successDescription: 'Recebemos sua mensagem e entraremos em contato em breve.',
    errorSendTitle: 'Erro ao enviar mensagem',
    errorSendDescription: 'Tente novamente mais tarde',
  },
  faq: {
    title: 'Perguntas Frequentes',
  },
  links: {
    title: 'Links Úteis',
    uber: 'Portal Uber Driver',
    bolt: 'Portal Bolt Driver',
    myprio: 'Portal myprio',
    viaverde: 'Portal ViaVerde',
  },
  schedule: {
    title: 'Horário de Atendimento',
  },
};

interface PainelAjudaProps extends DashboardPageProps {
  motorista: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

export default function PainelAjuda({ translations, locale, motorista }: PainelAjudaProps) {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const t = (key: string, fallback?: string) => {
    if (!translations?.common) return fallback || key;
    return getTranslation(translations.common, key) || fallback || key;
  };

  const tDashboard = (key: string, fallback?: string) => {
    if (!translations?.dashboard) return fallback || key;
    return getTranslation(translations.dashboard, key) || fallback || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/painel/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      toast({
        title: 'Mensagem enviada!',
        description: 'Recebemos sua mensagem e entraremos em contato em breve.',
        status: 'success',
        duration: 5000,
      });

      setSubject('');
      setMessage('');
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Tente novamente mais tarde',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PainelLayout 
      title={tDashboard('help.title', 'Ajuda e Suporte')}
      subtitle={tDashboard('help.subtitle', 'Tire suas dúvidas e entre em contato conosco')}
      breadcrumbs={[{ label: tDashboard('help.breadcrumb', 'Ajuda') }]}
      translations={translations}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" textAlign="center">
          <Icon as={FiPhone} boxSize={8} color="green.500" mb={3} />
          <Text fontSize="md" fontWeight="bold" mb={2}>{TEXTS.contactCards.phone}</Text>
          <ChakraLink href={CONTACT_INFO.whatsappLink} isExternal color="green.600" fontWeight="semibold">
            {CONTACT_INFO.phoneFormatted}
          </ChakraLink>
        </Box>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" textAlign="center">
          <Icon as={FiMail} boxSize={8} color="green.500" mb={3} />
          <Text fontSize="md" fontWeight="bold" mb={2}>{TEXTS.contactCards.email}</Text>
          <ChakraLink href={CONTACT_INFO.emailLink} color="green.600" fontWeight="semibold">
            {CONTACT_INFO.email}
          </ChakraLink>
        </Box>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" textAlign="center">
          <Icon as={FiMessageCircle} boxSize={8} color="green.500" mb={3} />
          <Text fontSize="md" fontWeight="bold" mb={2}>{TEXTS.contactCards.chat}</Text>
          <Text fontSize="sm" color="gray.600">
            {TEXTS.contactCards.chatAvailability}<br />{TEXTS.contactCards.chatHours}
          </Text>
        </Box>
      </SimpleGrid>

      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack mb={4}>
          <Icon as={FiSend} boxSize={5} color="green.500" />
          <Text fontSize="lg" fontWeight="bold">{TEXTS.contactForm.title}</Text>
        </HStack>
        <Text fontSize="sm" color="gray.600" mb={6}>{TEXTS.contactForm.description}</Text>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">{TEXTS.contactForm.labelName}</FormLabel>
                <Input value={motorista?.fullName || ''} isReadOnly bg="gray.50" size="sm" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">{TEXTS.contactForm.labelEmail}</FormLabel>
                <Input value={motorista?.email || ''} isReadOnly bg="gray.50" size="sm" />
              </FormControl>
            </SimpleGrid>
            <FormControl isRequired>
              <FormLabel fontSize="sm">{TEXTS.contactForm.labelSubject}</FormLabel>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={TEXTS.contactForm.placeholderSubject} size="sm" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">{TEXTS.contactForm.labelMessage}</FormLabel>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={TEXTS.contactForm.placeholderMessage} rows={6} size="sm" />
            </FormControl>
            <Button type="submit" colorScheme="green" leftIcon={<Icon as={FiSend} />} isLoading={loading} loadingText={TEXTS.contactForm.buttonSubmitting}>
              {TEXTS.contactForm.buttonSubmit}
            </Button>
          </VStack>
        </form>
      </Box>

      <Box bg="green.50" p={6} borderRadius="lg" borderWidth="1px" borderColor="green.200">
        <Text fontSize="md" fontWeight="bold" mb={2} color="green.800">{TEXTS.schedule.title}</Text>
        <Text fontSize="sm" color="green.700">
          <strong>{SCHEDULE.weekday}:</strong> {SCHEDULE.weekdayHours}<br />
          <strong>{SCHEDULE.saturday}:</strong> {SCHEDULE.saturdayHours}<br />
          <strong>{SCHEDULE.sunday}:</strong> {SCHEDULE.sundayStatus}
        </Text>
      </Box>
    </PainelLayout>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: true },
  async (context, user, driverId) => {
    return {};
  }
);
