import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiPackage,
  FiLink,
} from 'react-icons/fi';
import Head from 'next/head';
import PainelLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';

interface Motorista {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  birthDate?: string | null;
  city?: string;
  status: string;
  type: 'affiliate' | 'renter';
  banking?: {
    iban?: string | null;
    accountHolder?: string | null;
  };
  vehicle?: {
    plate?: string;
    model?: string;
    assignedDate?: string;
  } | null;
  rentalFee?: number;
  createdAt: string;
  activatedAt?: string | null;
  integrations?: {
    uber?: { key?: string; active?: boolean; lastSync?: string };
    bolt?: { key?: string; active?: boolean; lastSync?: string };
    myprio?: { key?: string; active?: boolean; lastSync?: string };
    viaverde?: { key?: string; active?: boolean; lastSync?: string };
  };
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  documents?: {
    nif?: string;
    drivingLicense?: string;
    licenseExpiry?: string;
  };
}

interface PainelDadosProps extends DashboardPageProps {
  motorista: Motorista;
}

const InfoRow = ({ icon, label, value, valueColor }: any) => (
  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
    <HStack>
      <Icon as={icon} color="green.500" boxSize={5} />
      <Text fontWeight="medium" fontSize="sm">{label}</Text>
    </HStack>
    <Text color={valueColor || 'gray.700'} fontSize="sm">{value || 'Não informado'}</Text>
  </HStack>
);

export default function PainelDados({ motorista, translations }: PainelDadosProps) {
  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.common, key, variables) || key;
  };

  const tPainel = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.dashboard, key, variables) || key;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Não informado';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-PT');
    } catch {
      return dateStr;
    }
  };

  const maskIban = (iban?: string | null) => {
    if (!iban) return 'Não informado';
    return `${iban.substring(0, 4)} **** **** **** ${iban.substring(iban.length - 2)}`;
  };

  return (
    <>
      <Head>
        <title>Meus Dados - Conduz.pt</title>
      </Head>
      
      <PainelLayout
        title="Meus Dados"
        subtitle="Visualize todas as suas informações cadastradas"
        breadcrumbs={[{ label: 'Meus Dados' }]}
        translations={translations}
      >
        <VStack spacing={6} align="stretch">
          {/* Status e Tipo */}
          <Card>
            <CardHeader>
              <Heading size="md">Status da Conta</Heading>
            </CardHeader>
            <CardBody>
              <HStack spacing={4}>
                <Badge 
                  colorScheme={motorista.status === 'active' ? 'green' : 'gray'} 
                  fontSize="md" 
                  px={3} 
                  py={1}
                >
                  {motorista.status === 'active' ? '✓ Ativo' : motorista.status}
                </Badge>
                <Badge 
                  colorScheme={motorista.type === 'renter' ? 'blue' : 'purple'} 
                  fontSize="md" 
                  px={3} 
                  py={1}
                >
                  {motorista.type === 'renter' ? '🚗 Locatário' : '🤝 Afiliado'}
                </Badge>
              </HStack>
            </CardBody>
          </Card>

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <Heading size="md">Informações Pessoais</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <InfoRow 
                  icon={FiUser} 
                  label="Nome Completo" 
                  value={motorista.fullName} 
                />
                <InfoRow 
                  icon={FiMail} 
                  label="Email" 
                  value={motorista.email} 
                />
                <InfoRow 
                  icon={FiPhone} 
                  label="Telefone" 
                  value={motorista.phone} 
                />
                <InfoRow 
                  icon={FiCalendar} 
                  label="Data de Nascimento" 
                  value={formatDate(motorista.birthDate)} 
                />
                <InfoRow 
                  icon={FiMapPin} 
                  label="Cidade" 
                  value={motorista.city} 
                />
              </VStack>
            </CardBody>
          </Card>

          {/* Endereço */}
          {motorista.address && (
            <Card>
              <CardHeader>
                <Heading size="md">Endereço</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <InfoRow 
                    icon={FiMapPin} 
                    label="Rua" 
                    value={motorista.address.street} 
                  />
                  <InfoRow 
                    icon={FiMapPin} 
                    label="Número" 
                    value={motorista.address.number} 
                  />
                  {motorista.address.complement && (
                    <InfoRow 
                      icon={FiMapPin} 
                      label="Complemento" 
                      value={motorista.address.complement} 
                    />
                  )}
                  <InfoRow 
                    icon={FiMapPin} 
                    label="Código Postal" 
                    value={motorista.address.postalCode} 
                  />
                  <InfoRow 
                    icon={FiMapPin} 
                    label="País" 
                    value={motorista.address.country || 'Portugal'} 
                  />
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Documentos */}
          <Card>
            <CardHeader>
              <Heading size="md">Documentos</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <InfoRow 
                  icon={FiCreditCard} 
                  label="NIF" 
                  value={motorista.documents?.nif} 
                />
                <InfoRow 
                  icon={FiCreditCard} 
                  label="Carta de Condução" 
                  value={motorista.documents?.drivingLicense} 
                />
                <InfoRow 
                  icon={FiCalendar} 
                  label="Validade da Carta" 
                  value={formatDate(motorista.documents?.licenseExpiry)} 
                />
              </VStack>
            </CardBody>
          </Card>

          {/* Dados Bancários */}
          <Card>
            <CardHeader>
              <Heading size="md">Dados Bancários</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <InfoRow 
                  icon={FiCreditCard} 
                  label="IBAN" 
                  value={maskIban(motorista.banking?.iban)} 
                />
                <InfoRow 
                  icon={FiUser} 
                  label="Titular da Conta" 
                  value={motorista.banking?.accountHolder || motorista.fullName} 
                />
              </VStack>
            </CardBody>
          </Card>

          {/* Veículo */}
          {motorista.vehicle && (
            <Card>
              <CardHeader>
                <Heading size="md">Veículo Atribuído</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <InfoRow 
                    icon={FiTruck} 
                    label="Matrícula" 
                    value={motorista.vehicle.plate} 
                  />
                  <InfoRow 
                    icon={FiTruck} 
                    label="Modelo" 
                    value={motorista.vehicle.model} 
                  />
                  <InfoRow 
                    icon={FiCalendar} 
                    label="Data de Atribuição" 
                    value={formatDate(motorista.vehicle.assignedDate)} 
                  />
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Aluguel (se for locatário) */}
          {motorista.type === 'renter' && (
            <Card>
              <CardHeader>
                <Heading size="md">Aluguel do Veículo</Heading>
              </CardHeader>
              <CardBody>
                <InfoRow 
                  icon={FiDollarSign} 
                  label="Valor Semanal" 
                  value={`€${motorista.rentalFee?.toFixed(2) || '0.00'}`} 
                  valueColor="blue.600"
                />
              </CardBody>
            </Card>
          )}

          {/* Integrações */}
          {motorista.integrations && (
            <Card>
              <CardHeader>
                <Heading size="md">Integrações de Plataformas</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {motorista.integrations.uber && (
                    <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiLink} color="green.500" />
                        <Text fontWeight="medium">Uber</Text>
                      </HStack>
                      <HStack>
                        <Code fontSize="xs">{motorista.integrations.uber.key || 'N/A'}</Code>
                        <Badge colorScheme={motorista.integrations.uber.active ? 'green' : 'gray'}>
                          {motorista.integrations.uber.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </HStack>
                    </HStack>
                  )}
                  
                  {motorista.integrations.bolt && (
                    <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiLink} color="green.500" />
                        <Text fontWeight="medium">Bolt</Text>
                      </HStack>
                      <HStack>
                        <Code fontSize="xs">{motorista.integrations.bolt.key || 'N/A'}</Code>
                        <Badge colorScheme={motorista.integrations.bolt.active ? 'green' : 'gray'}>
                          {motorista.integrations.bolt.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </HStack>
                    </HStack>
                  )}
                  
                  {motorista.integrations.myprio && (
                    <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiLink} color="green.500" />
                        <Text fontWeight="medium">MyPrio (Combustível)</Text>
                      </HStack>
                      <HStack>
                        <Code fontSize="xs">{motorista.integrations.myprio.key || 'N/A'}</Code>
                        <Badge colorScheme={motorista.integrations.myprio.active ? 'green' : 'gray'}>
                          {motorista.integrations.myprio.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </HStack>
                    </HStack>
                  )}
                  
                  {motorista.integrations.viaverde && (
                    <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                      <HStack>
                        <Icon as={FiLink} color="green.500" />
                        <Text fontWeight="medium">ViaVerde (Portagens)</Text>
                      </HStack>
                      <HStack>
                        <Code fontSize="xs">{motorista.integrations.viaverde.key || 'N/A'}</Code>
                        <Badge colorScheme={motorista.integrations.viaverde.active ? 'green' : 'gray'}>
                          {motorista.integrations.viaverde.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </HStack>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Datas do Sistema */}
          <Card>
            <CardHeader>
              <Heading size="md">Informações do Sistema</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <InfoRow 
                  icon={FiCalendar} 
                  label="Data de Cadastro" 
                  value={formatDate(motorista.createdAt)} 
                />
                <InfoRow 
                  icon={FiCheckCircle} 
                  label="Data de Ativação" 
                  value={formatDate(motorista.activatedAt)} 
                />
                <InfoRow 
                  icon={FiPackage} 
                  label="ID do Sistema" 
                  value={motorista.id} 
                />
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </PainelLayout>
    </>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: true },
  async (context, user, driverId) => {
    return {};
  }
);
