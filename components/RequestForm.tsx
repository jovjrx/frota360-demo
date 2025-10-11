import {
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Box,
  Divider,
} from "@chakra-ui/react";
import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { Card } from "./Card";
import { useFacebookTracking } from "@/hooks/useFacebookTracking";

interface RequestFormProps {
  tPage: (key: string) => any;
  tCommon: (key: string) => any;
}

export const RequestForm = ({ tPage, tCommon }: RequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    email: "",
    phone: "",
    city: "",
    nif: "",
    licenseNumber: "",
    driverType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehiclePlate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const { trackRegistrationComplete } = useFacebookTracking();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.length < 3) {
      newErrors.fullName = "Nome completo deve ter pelo menos 3 caracteres";
    }
    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.phone || formData.phone.length < 9) {
      newErrors.phone = "Telefone inválido";
    }
    if (!formData.city || formData.city.length < 2) {
      newErrors.city = "Cidade é obrigatória";
    }
    if (!formData.nif || formData.nif.length !== 9) {
      newErrors.nif = "NIF deve ter 9 dígitos";
    }
    if (!formData.driverType) {
      newErrors.driverType = "Selecione o tipo de motorista";
    }

    // Se for afiliado, veículo é obrigatório
    if (formData.driverType === "affiliate") {
      if (!formData.vehicleMake) newErrors.vehicleMake = "Marca é obrigatória";
      if (!formData.vehicleModel) newErrors.vehicleModel = "Modelo é obrigatório";
      if (!formData.vehicleYear) newErrors.vehicleYear = "Ano é obrigatório";
      if (!formData.vehiclePlate) newErrors.vehiclePlate = "Matrícula é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: any = {
        fullName: formData.fullName,
        birthDate: formData.birthDate,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        nif: formData.nif,
        licenseNumber: formData.licenseNumber || undefined,
        driverType: formData.driverType,
      };

      // Adicionar veículo se for afiliado
      if (formData.driverType === "affiliate") {
        requestData.vehicle = {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear),
          plate: formData.vehiclePlate,
        };
      }

      const response = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        // Track evento de conclusão de registro
        const [firstName, ...lastNameParts] = formData.fullName.split(' ');
        trackRegistrationComplete('success', 'Driver Application', {
          email: formData.email,
          phone: formData.phone,
          firstName: firstName || formData.fullName,
          lastName: lastNameParts.join(' ') || '',
          city: formData.city,
        });

        toast({
          title: "Candidatura Enviada!",
          description: "Recebemos a sua candidatura. A nossa equipa irá analisar e entrar em contacto em breve.",
          status: "success",
          duration: 8000,
          isClosable: true,
        });

        // Limpar formulário
        setFormData({
          fullName: "",
          birthDate: "",
          email: "",
          phone: "",
          city: "",
          nif: "",
          licenseNumber: "",
          driverType: "",
          vehicleMake: "",
          vehicleModel: "",
          vehicleYear: "",
          vehiclePlate: "",
        });
      } else {
        throw new Error(result.error || "Erro ao enviar candidatura");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title="Candidatura de Motorista" description="Preencha os dados abaixo" borded>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          {/* Nome Completo */}
          <FormControl isInvalid={!!errors.fullName} isRequired>
            <FormLabel>Nome Completo</FormLabel>
            <Input
              placeholder="Nome completo"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
            />
            {errors.fullName && <FormErrorMessage>{errors.fullName}</FormErrorMessage>}
          </FormControl>

          {/* Data de Nascimento e NIF */}
          <HStack spacing={4}>
            <FormControl isInvalid={!!errors.birthDate} isRequired>
              <FormLabel>Data de Nascimento</FormLabel>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
              />
              {errors.birthDate && <FormErrorMessage>{errors.birthDate}</FormErrorMessage>}
            </FormControl>

            <FormControl isInvalid={!!errors.nif} isRequired>
              <FormLabel>NIF</FormLabel>
              <Input
                placeholder="123456789"
                maxLength={9}
                value={formData.nif}
                onChange={(e) => handleInputChange("nif", e.target.value.replace(/\D/g, ''))}
              />
              {errors.nif && <FormErrorMessage>{errors.nif}</FormErrorMessage>}
            </FormControl>
          </HStack>

          {/* Email e Telefone */}
          <HStack spacing={4}>
            <FormControl isInvalid={!!errors.email} isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
              {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
            </FormControl>

            <FormControl isInvalid={!!errors.phone} isRequired>
              <FormLabel>Telefone</FormLabel>
              <Input
                type="tel"
                placeholder="+351 913 XXX XXX"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
              {errors.phone && <FormErrorMessage>{errors.phone}</FormErrorMessage>}
            </FormControl>
          </HStack>

          {/* Cidade, Número da Carta e Tipo */}
          <HStack spacing={4}>
            <FormControl isInvalid={!!errors.city} isRequired>
              <FormLabel>Cidade</FormLabel>
              <Input
                placeholder="Lisboa"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
              {errors.city && <FormErrorMessage>{errors.city}</FormErrorMessage>}
            </FormControl>

            <FormControl isInvalid={!!errors.licenseNumber}>
              <FormLabel>Número da Carta (opcional)</FormLabel>
              <Input
                placeholder="Ex: AB123456"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
              />
              {errors.licenseNumber && <FormErrorMessage>{errors.licenseNumber}</FormErrorMessage>}
            </FormControl>
          </HStack>

          {/* Tipo de Motorista */}
          <FormControl isInvalid={!!errors.driverType} isRequired>
            <FormLabel>Tipo de Motorista</FormLabel>
            <Select
              placeholder="Selecione uma opção"
              value={formData.driverType}
              onChange={(e) => handleInputChange("driverType", e.target.value)}
            >
              <option value="affiliate">Afiliado (veículo próprio)</option>
              <option value="renter">Locatário (alugar veículo)</option>
            </Select>
            {errors.driverType && <FormErrorMessage>{errors.driverType}</FormErrorMessage>}
          </FormControl>

          {/* Informações do Veículo (apenas para Afiliados) */}
          {formData.driverType === "affiliate" && (
            <>
              <Divider />
              <Box>
                <Text fontSize="md" fontWeight="bold" color="green.600" mb={4}>
                  Informações do Veículo
                </Text>
                <VStack spacing={4}>
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.vehicleMake} isRequired>
                      <FormLabel>Marca</FormLabel>
                      <Input
                        placeholder="Ex: Toyota"
                        value={formData.vehicleMake}
                        onChange={(e) => handleInputChange("vehicleMake", e.target.value)}
                      />
                      {errors.vehicleMake && <FormErrorMessage>{errors.vehicleMake}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isInvalid={!!errors.vehicleModel} isRequired>
                      <FormLabel>Modelo</FormLabel>
                      <Input
                        placeholder="Ex: Prius"
                        value={formData.vehicleModel}
                        onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                      />
                      {errors.vehicleModel && <FormErrorMessage>{errors.vehicleModel}</FormErrorMessage>}
                    </FormControl>
                  </HStack>

                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.vehicleYear} isRequired>
                      <FormLabel>Ano</FormLabel>
                      <Input
                        type="number"
                        placeholder="2020"
                        value={formData.vehicleYear}
                        onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                      />
                      {errors.vehicleYear && <FormErrorMessage>{errors.vehicleYear}</FormErrorMessage>}
                    </FormControl>

                    <FormControl isInvalid={!!errors.vehiclePlate} isRequired>
                      <FormLabel>Matrícula</FormLabel>
                      <Input
                        placeholder="XX-XX-XX"
                        value={formData.vehiclePlate}
                        onChange={(e) => handleInputChange("vehiclePlate", e.target.value)}
                      />
                      {errors.vehiclePlate && <FormErrorMessage>{errors.vehiclePlate}</FormErrorMessage>}
                    </FormControl>
                  </HStack>
                </VStack>
              </Box>
            </>
          )}

          <Button
            type="submit"
            colorScheme="green"
            size="lg"
            w="full"
            isLoading={isSubmitting}
            loadingText="Enviando..."
          >
            Enviar Candidatura
          </Button>
        </VStack>
      </form>
    </Card>
  );
};
