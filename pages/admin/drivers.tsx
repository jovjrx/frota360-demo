import { useState } from "react";
import { GetServerSideProps } from "next";
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Icon,
  useToast,
  Card,
  CardBody,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { FiPlus, FiEdit, FiEye } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Driver } from "@/schemas/driver";
import { adminDb } from "@/lib/firebaseAdmin";

interface Props {
  initialDrivers: Driver[];
  user: any;
}

export default function DriversPage({ initialDrivers }: Props) {
  const [drivers] = useState<Driver[]>(initialDrivers);
  const toast = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      case "pending":
        return "yellow";
      default:
        return "gray";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "renter":
        return "Locatário";
      case "affiliate":
        return "Afiliado";
      default:
        return type;
    }
  };

  return (
    <AdminLayout title="Gestão de Motoristas">
      <Box>
        <HStack justify="space-between" mb={6}>
          <Heading size="lg">Motoristas</Heading>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="blue"
            onClick={() => (window.location.href = "/admin/drivers/add")}
          >
            Adicionar Motorista
          </Button>
        </HStack>

        <Card>
          <CardBody>
            {drivers.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.600" mb={4}>
                  Nenhum motorista cadastrado
                </Text>
                <Button
                  leftIcon={<Icon as={FiPlus} />}
                  colorScheme="blue"
                  onClick={() => (window.location.href = "/admin/drivers/add")}
                >
                  Adicionar Primeiro Motorista
                </Button>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nome</Th>
                    <Th>Email</Th>
                    <Th>Telefone</Th>
                    <Th>Tipo</Th>
                    <Th>Veículo</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {drivers.map((driver) => (
                    <Tr key={driver.id}>
                      <Td>
                        <Text fontWeight="medium">
                          {driver.name || driver.fullName}
                        </Text>
                      </Td>
                      <Td>{driver.email}</Td>
                      <Td>{driver.phone}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            driver.type === "renter" ? "purple" : "green"
                          }
                        >
                          {getTypeLabel(driver.type)}
                        </Badge>
                      </Td>
                      <Td>{driver.vehicle?.plate || "N/A"}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(driver.status)}>
                          {driver.status}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<Icon as={FiEye} />}
                            onClick={() =>
                              (window.location.href = `/admin/drivers/${driver.id}`)
                            }
                          >
                            Ver
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Box>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import("@/lib/auth/adminCheck");
  const authResult = await checkAdminAuth(context);

  if ("redirect" in authResult) {
    return authResult;
  }

  try {
    // Buscar todos os motoristas
    const driversSnapshot = await adminDb.collection("drivers").get();

    const drivers = driversSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Driver[];

    return {
      props: {
        ...authResult.props,
        initialDrivers: drivers,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar motoristas:", error);
    return {
      props: {
        ...authResult.props,
        initialDrivers: [],
      },
    };
  }
};
