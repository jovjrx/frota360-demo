import { GetServerSideProps } from 'next';
import { withAdmin } from '@/lib/auth/withAdmin';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Select,
  Switch,
  Badge,
  IconButton,
  SimpleGrid,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaPlus, FaGlobe, FaLanguage } from 'react-icons/fa';

interface ContentItem {
  id: string;
  page: string;
  section: string;
  key: string;
  content: {
    [locale: string]: string;
  };
  active: boolean;
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
}

interface ContentManagementProps {
  contentItems: ContentItem[];
  pages: string[];
  sections: string[];
  locales: string[];
}

export default withAdmin(function ContentManagement({ 
  contentItems: initialContentItems, 
  pages, 
  sections, 
  locales 
}: ContentManagementProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContentItems);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const filteredItems = contentItems.filter(item => {
    const matchesPage = selectedPage === 'all' || item.page === selectedPage;
    const matchesSection = selectedSection === 'all' || item.section === selectedSection;
    const matchesSearch = item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         Object.values(item.content).some(content => 
                           content.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesPage && matchesSection && matchesSearch;
  });

  const handleSaveContent = async (itemData: Partial<ContentItem>) => {
    setLoading(true);
    try {
      const url = editingItem ? `/api/admin/content/${editingItem.id}` : '/api/admin/content';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        toast({
          title: editingItem ? 'Conteúdo atualizado' : 'Conteúdo criado',
          description: editingItem 
            ? 'Conteúdo atualizado com sucesso'
            : 'Conteúdo criado com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save content');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : (editingItem 
          ? 'Falha ao atualizar conteúdo'
          : 'Falha ao criar conteúdo'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (itemId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/admin/content/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });

      if (response.ok) {
        setContentItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, active } : item
          )
        );
        toast({
          title: 'Status atualizado',
          description: `Conteúdo ${active ? 'ativado' : 'desativado'} com sucesso`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteContent = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja deletar este conteúdo?')) return;

    try {
      const response = await fetch(`/api/admin/content/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContentItems(prev => prev.filter(item => item.id !== itemId));
        toast({
          title: 'Conteúdo deletado',
          description: 'Conteúdo deletado com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete content');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao deletar conteúdo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditContent = (item: ContentItem) => {
    setEditingItem(item);
    onOpen();
  };

  const handleCreateContent = () => {
    setEditingItem(null);
    setIsCreateModalOpen(true);
    onOpen();
  };

  return (
    <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 4, md: 8 }}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Gestão de Conteúdo
          </Heading>
          <Text color="gray.600">
            Gerencie o conteúdo das páginas públicas com suporte multilíngue
          </Text>
        </Box>

        {/* Filters and Actions */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} wrap="wrap">
                <FormControl minW="200px">
                  <FormLabel>Página</FormLabel>
                  <Select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)}>
                    <option value="all">Todas as páginas</option>
                    {pages.map(page => (
                      <option key={page} value={page}>{page}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl minW="200px">
                  <FormLabel>Seção</FormLabel>
                  <Select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                    <option value="all">Todas as seções</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl minW="300px">
                  <FormLabel>Buscar</FormLabel>
                  <Input
                    placeholder="Buscar por chave ou conteúdo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </FormControl>
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  {filteredItems.length} itens encontrados
                </Text>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="green"
                  onClick={handleCreateContent}
                >
                  Novo Conteúdo
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Content List */}
        <VStack spacing={4} align="stretch">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <HStack>
                        <Badge colorScheme="blue" variant="subtle">
                          {item.page}
                        </Badge>
                        <Badge colorScheme="purple" variant="subtle">
                          {item.section}
                        </Badge>
                        <Badge colorScheme="gray" variant="outline">
                          {item.key}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        Atualizado em {new Date(item.updatedAt).toLocaleDateString('pt-PT')}
                      </Text>
                    </VStack>

                    <HStack>
                      <Switch
                        isChecked={item.active}
                        onChange={(e) => handleToggleActive(item.id, e.target.checked)}
                        colorScheme="green"
                      />
                      <IconButton
                        aria-label="Editar"
                        icon={<FaEdit />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditContent(item)}
                      />
                      <IconButton
                        aria-label="Deletar"
                        icon={<FaTimes />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteContent(item.id)}
                      />
                    </HStack>
                  </HStack>

                  <Divider />

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {locales.map(locale => (
                      <Box key={locale} p={3} bg="gray.50" borderRadius="md">
                        <HStack mb={2}>
                          <FaLanguage />
                          <Text fontSize="sm" fontWeight="semibold" textTransform="uppercase">
                            {locale}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.700">
                          {item.content[locale] || 'Não definido'}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>

        {filteredItems.length === 0 && (
          <Alert status="info">
            <AlertIcon />
            <AlertTitle>Nenhum conteúdo encontrado!</AlertTitle>
            <AlertDescription>
              Tente ajustar os filtros ou criar novo conteúdo.
            </AlertDescription>
          </Alert>
        )}
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingItem ? 'Editar Conteúdo' : 'Novo Conteúdo'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ContentForm
              item={editingItem}
              pages={pages}
              sections={sections}
              locales={locales}
              onSave={handleSaveContent}
              loading={loading}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
});

interface ContentFormProps {
  item: ContentItem | null;
  pages: string[];
  sections: string[];
  locales: string[];
  onSave: (data: Partial<ContentItem>) => void;
  loading: boolean;
}

function ContentForm({ item, pages, sections, locales, onSave, loading }: ContentFormProps) {
  const [formData, setFormData] = useState({
    page: item?.page || '',
    section: item?.section || '',
    key: item?.key || '',
    content: item?.content || {},
    active: item?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateContent = (locale: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [locale]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel>Página</FormLabel>
            <Select
              value={formData.page}
              onChange={(e) => setFormData(prev => ({ ...prev, page: e.target.value }))}
            >
              <option value="">Selecione uma página</option>
              {pages.map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Seção</FormLabel>
            <Input
              value={formData.section}
              onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              placeholder="Ex: hero, features, cta"
            />
          </FormControl>
        </SimpleGrid>

        <FormControl isRequired>
          <FormLabel>Chave</FormLabel>
          <Input
            value={formData.key}
            onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
            placeholder="Ex: title, subtitle, description"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Conteúdo por Idioma</FormLabel>
          <VStack spacing={4} align="stretch">
            {locales.map(locale => (
              <Box key={locale} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                <HStack mb={2}>
                  <FaLanguage />
                  <Text fontSize="sm" fontWeight="semibold" textTransform="uppercase">
                    {locale}
                  </Text>
                </HStack>
                <Textarea
                  value={formData.content[locale] || ''}
                  onChange={(e) => updateContent(locale, e.target.value)}
                  placeholder={`Conteúdo em ${locale}...`}
                  rows={3}
                />
              </Box>
            ))}
          </VStack>
        </FormControl>

        <FormControl>
          <HStack>
            <Switch
              isChecked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              colorScheme="green"
            />
            <FormLabel mb={0}>Ativo</FormLabel>
          </HStack>
        </FormControl>

        <HStack justify="flex-end" pt={4}>
          <Button type="submit" colorScheme="green" isLoading={loading} leftIcon={<FaSave />}>
            {item ? 'Atualizar' : 'Criar'}
          </Button>
        </HStack>
      </VStack>
    </form>
  );
}

export const getServerSideProps: GetServerSideProps = async (context: any) => {
  try {
    // Fetch content items from Firestore
    const contentSnap = await adminDb.collection('content_management').get();
    const contentItems = contentSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ContentItem[];

    // Extract unique pages and sections
    const pages = [...new Set(contentItems.map(item => item.page))].sort();
    const sections = [...new Set(contentItems.map(item => item.section))].sort();
    const locales = ['pt', 'en']; // Supported locales

    return {
      props: {
        contentItems,
        pages,
        sections,
        locales,
      },
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    return {
      props: {
        contentItems: [],
        pages: ['home', 'about', 'contact', 'services'],
        sections: ['hero', 'features', 'cta', 'faq'],
        locales: ['pt', 'en'],
      },
    };
  }
};
