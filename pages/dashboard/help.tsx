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
} from '@chakra-ui/react';
import {
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiExternalLink,
} from 'react-icons/fi';
import PainelLayout from '@/components/layouts/DashboardLayout';
import Link from 'next/link';

export default function PainelAjuda() {
  return (
    <PainelLayout 
      title="Ajuda e Suporte"
      subtitle="Tire suas dúvidas e entre em contato conosco"
      breadcrumbs={[{ label: 'Ajuda' }]}
    >
      {/* Contatos de Suporte */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box 
          bg="white" 
          p={6} 
          borderRadius="lg" 
          shadow="sm" 
          borderWidth="1px"
          textAlign="center"
        >
          <Icon as={FiPhone} boxSize={8} color="green.500" mb={3} />
          <Text fontSize="md" fontWeight="bold" mb={2}>Telefone / WhatsApp</Text>
          <ChakraLink 
            href="https://wa.me/351912345678" 
            isExternal
            color="green.600"
            fontWeight="semibold"
          >
            +351 91 234 5678
          </ChakraLink>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="lg" 
          shadow="sm" 
          borderWidth="1px"
          textAlign="center"
        >
          <Icon as={FiMail} boxSize={8} color="green.500" mb={3} />
          <Text fontSize="md" fontWeight="bold" mb={2}>Email</Text>
          <ChakraLink 
            href="mailto:suporte@conduz.pt"
            color="green.600"
            fontWeight="semibold"
          >
            suporte@conduz.pt
          </ChakraLink>
        </Box>

        <Box 
          bg="white" 
          p={6} 
          borderRadius="lg" 
          shadow="sm" 
          borderWidth="1px"
          textAlign="center"
        >
          <Icon as={FiMessageCircle} boxSize={8} color="green.500" mb={3} />
          <Text fontSize="md" fontWeight="bold" mb={2}>Chat Online</Text>
          <Text fontSize="sm" color="gray.600">
            Segunda a Sexta
            <br />
            9h - 18h
          </Text>
        </Box>
      </SimpleGrid>

      {/* FAQ */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <HStack mb={6}>
          <Icon as={FiHelpCircle} boxSize={5} color="green.500" />
          <Text fontSize="lg" fontWeight="bold">Perguntas Frequentes</Text>
        </HStack>

        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Como funciona o pagamento semanal?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              Os pagamentos são processados semanalmente, de segunda a domingo. 
              Após o fechamento da semana, o administrador importa os dados das plataformas 
              (Uber, Bolt, myprio, ViaVerde) e calcula o repasse líquido. 
              O pagamento é realizado normalmente na terça-feira seguinte e você pode 
              acompanhar o status no painel de contracheques.
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Como é calculado o meu repasse?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              O cálculo segue estas etapas:
              <br />
              1. <strong>Ganhos Total</strong> = Uber + Bolt
              <br />
              2. <strong>IVA 6%</strong> = Ganhos Total × 0.06
              <br />
              3. <strong>Ganhos - IVA</strong> = Ganhos Total × 0.94
              <br />
              4. <strong>Despesas Administrativas 7%</strong> = (Ganhos - IVA) × 0.07
              <br />
              5. <strong>Total Despesas</strong> = Combustível + ViaVerde* + Aluguel*
              <br />
              6. <strong>Repasse</strong> = (Ganhos - IVA) - Desp. Adm - Total Despesas
              <br />
              <br />
              * ViaVerde e Aluguel são descontados apenas de motoristas locatários.
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Qual a diferença entre Afiliado e Locatário?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              <strong>Motorista Afiliado:</strong> Trabalha com veículo próprio, 
              tem total controle sobre o veículo, não paga aluguel e não tem desconto de ViaVerde.
              <br />
              <br />
              <strong>Motorista Locatário:</strong> Utiliza veículo da empresa, 
              paga aluguel semanal, tem acesso ao rastreamento Cartrack e tem desconto 
              de portagens (ViaVerde) se aplicável.
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Como posso baixar meus contracheques?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              Acesse a página de <strong>Contracheques</strong> no menu principal. 
              Lá você encontrará todos os seus contracheques. Para os pagamentos já realizados, 
              você pode visualizar os detalhes e baixar o PDF clicando no botão "Baixar PDF".
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Como alterar meus dados bancários?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              Para alterar seus dados bancários (IBAN), entre em contato com o administrador 
              através do email <strong>suporte@conduz.pt</strong> ou pelo WhatsApp. 
              Por questões de segurança, essa alteração não pode ser feita diretamente pelo painel.
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  O que fazer se houver erro no meu contracheque?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              Se você identificar algum erro ou discrepância no seu contracheque, 
              entre em contato imediatamente com o administrador através do email 
              <strong> suporte@conduz.pt</strong> informando:
              <br />
              - Semana do contracheque
              <br />
              - Descrição do erro identificado
              <br />
              - Valores esperados vs valores apresentados
              <br />
              <br />
              A equipe irá analisar e corrigir se necessário.
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Como funciona o rastreamento Cartrack?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              O rastreamento Cartrack está disponível apenas para <strong>motoristas locatários</strong> 
              que utilizam veículos da empresa. Através dele você pode acompanhar:
              <br />
              - Quilometragem diária e semanal
              <br />
              - Tempo em movimento
              <br />
              - Última localização do veículo
              <br />
              - Estatísticas de uso
              <br />
              <br />
              Motoristas afiliados (veículo próprio) não têm acesso a esta funcionalidade.
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Minha conta está suspensa, o que fazer?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} color="gray.600">
              Se sua conta foi suspensa, entre em contato imediatamente com o administrador 
              para entender o motivo e resolver a situação. Você pode entrar em contato através:
              <br />
              - Email: <strong>suporte@conduz.pt</strong>
              <br />
              - WhatsApp: <strong>+351 91 234 5678</strong>
              <br />
              - Telefone: <strong>+351 91 234 5678</strong>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>

      {/* Links Úteis */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
        <Text fontSize="lg" fontWeight="bold" mb={4}>Links Úteis</Text>
        <VStack align="stretch" spacing={3}>
          <ChakraLink 
            href="https://www.uber.com/pt/drive/" 
            isExternal
            color="green.600"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={FiExternalLink} />
            Portal Uber Driver
          </ChakraLink>
          <ChakraLink 
            href="https://partners.bolt.eu/" 
            isExternal
            color="green.600"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={FiExternalLink} />
            Portal Bolt Driver
          </ChakraLink>
          <ChakraLink 
            href="https://www.myprio.pt/" 
            isExternal
            color="green.600"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={FiExternalLink} />
            Portal myprio
          </ChakraLink>
          <ChakraLink 
            href="https://www.viaverde.pt/" 
            isExternal
            color="green.600"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={FiExternalLink} />
            Portal ViaVerde
          </ChakraLink>
        </VStack>
      </Box>

      {/* Horário de Atendimento */}
      <Box bg="green.50" p={6} borderRadius="lg" borderWidth="1px" borderColor="green.200">
        <Text fontSize="md" fontWeight="bold" mb={2} color="green.800">
          Horário de Atendimento
        </Text>
        <Text fontSize="sm" color="green.700">
          <strong>Segunda a Sexta:</strong> 9h - 18h
          <br />
          <strong>Sábado:</strong> 9h - 13h
          <br />
          <strong>Domingo e Feriados:</strong> Fechado
        </Text>
      </Box>
    </PainelLayout>
  );
}
