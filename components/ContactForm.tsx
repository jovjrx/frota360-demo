import {
    Text,
    VStack,
    HStack,
    Input,
    Textarea,
    Button,
    Select,
    FormControl,
    FormLabel,
    FormErrorMessage,
} from "@chakra-ui/react";
import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { Card } from "./Card";

interface ContactFormProps {
    // Translation accessor; may return string or structured data
    tPage: (key: string) => any;
    // Optional callback for side-effects (analytics, tracking, etc.) after successful submit
    onSubmit?: (data: {
        name: string;
        email: string;
        phone: string;
        interest: string;
        message: string;
    }) => void | Promise<void>;
}

export const ContactForm = ({ tPage, onSubmit }: ContactFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        interest: "",
        message: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const toast = useToast();

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = tPage("form.validation.name.required");
        }

        if (!formData.email.trim()) {
            newErrors.email = tPage("form.validation.email.required");
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = tPage("form.validation.email.invalid");
        }

        if (!formData.interest) {
            newErrors.interest = tPage("form.validation.interest.required");
        }

        if (!formData.message.trim()) {
            newErrors.message = tPage("form.validation.message.required");
        } else if (formData.message.trim().length < 10) {
            newErrors.message = tPage("form.validation.message.minLength");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Enviar para a API
            const response = await fetch('/api/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'Failed to send email');
            }

            // Sucesso - feedback ao usuário
            toast({
                title: tPage("form.success.title"),
                description: tPage("form.success.description"),
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            // Callback opcional para efeitos colaterais (analytics, etc.)
            if (onSubmit) {
                await onSubmit(formData);
            }

            // Reset form
            setFormData({
                name: "",
                email: "",
                phone: "",
                interest: "",
                message: "",
            });

        } catch (error: any) {
            console.error('Form submission error:', error);
            toast({
                title: tPage("form.error.title"),
                description: tPage("form.error.description"),
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card title={tPage("form.title")} description={tPage("form.description")} borded>
            <VStack as="form"
                onSubmit={handleSubmit}
                spacing={6} align="stretch">

                <HStack spacing={4}>
                    <FormControl isInvalid={!!errors.name} isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                            {tPage("form.fields.name")}
                        </FormLabel>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder={tPage("form.fields.namePlaceholder")}
                            size="lg"
                            borderRadius="lg"
                        />
                        <FormErrorMessage>{errors.name}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.email} isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                            {tPage("form.fields.email")}
                        </FormLabel>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder={tPage("form.fields.emailPlaceholder")}
                            size="lg"
                            borderRadius="lg"
                        />
                        <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>
                </HStack>

                <HStack spacing={4}>
                    <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                            {tPage("form.fields.phone")}
                        </FormLabel>
                        <Input
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder={tPage("form.fields.phonePlaceholder")}
                            size="lg"
                            borderRadius="lg"
                        />
                    </FormControl>

                    <FormControl isInvalid={!!errors.interest} isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                            {tPage("form.fields.interest")}
                        </FormLabel>
                        <Select
                            value={formData.interest}
                            onChange={(e) => handleInputChange("interest", e.target.value)}
                            placeholder={tPage("form.fields.interestPlaceholder")}
                            size="lg"
                            borderRadius="lg"
                        >
                            {(() => {
                                const interests = tPage("form.interests");
                                if (!interests || typeof interests !== "object") return null;
                                return Object.entries(interests).map(([key, label]) => (
                                    <option key={key} value={label as string}>
                                        {label as string}
                                    </option>
                                ));
                            })()}
                        </Select>

                        <FormErrorMessage>{errors.interest}</FormErrorMessage>
                    </FormControl>
                </HStack>



                <FormControl isInvalid={!!errors.message} isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                        {tPage("form.fields.message")}
                    </FormLabel>
                    <Textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder={tPage("form.fields.messagePlaceholder")}
                        size="lg"
                        borderRadius="lg"
                        rows={5}
                        resize="vertical"
                    />
                    <FormErrorMessage>{errors.message}</FormErrorMessage>
                </FormControl>

                <Button
                    type="submit"
                    size="lg"
                    colorScheme="brand"
                    isLoading={isSubmitting}
                    loadingText={tPage("form.submit.loading")}
                    w="full"
                    py={6}
                    fontSize="lg"
                    fontWeight="semibold"
                    _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                    transition="all 0.3s ease"
                >
                    {tPage("form.submit.button")}
                </Button>

                <Text fontSize="xs" color="gray.500" textAlign="center">
                    {tPage("form.privacy")}
                </Text>
            </VStack>
        </Card>
    );
};
