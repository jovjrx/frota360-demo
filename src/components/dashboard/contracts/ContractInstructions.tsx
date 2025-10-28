import {
  Card,
  CardBody,
  Heading,
  Text,
  OrderedList,
  ListItem,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

export function ContractInstructions() {
  return (
    <Card variant="outline">
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm" display="flex" alignItems="center" gap={2}>
            <Icon as={FiInfo} />
            Como concluir o processo
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Siga os passos abaixo para validar o contrato e manter seu acesso ativo:
          </Text>
          <OrderedList spacing={2} pl={4} fontSize="sm" color="gray.700">
            <ListItem>Baixe o modelo mais recente e verifique se seus dados estão corretos.</ListItem>
            <ListItem>Imprima ou assine digitalmente o documento, garantindo legibilidade.</ListItem>
            <ListItem>Digitalize ou gere um PDF do contrato assinado (máximo 10MB).</ListItem>
            <ListItem>Faça o upload do arquivo nesta página e aguarde a revisão da equipa.</ListItem>
            <ListItem>Em caso de rejeição, corrija o documento e envie novamente.</ListItem>
          </OrderedList>
          <Text fontSize="xs" color="gray.500">
            Dica: Utilize aplicativos de digitalização para melhorar a qualidade do PDF.
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
}

