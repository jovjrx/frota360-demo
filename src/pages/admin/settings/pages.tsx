import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  useToast,
  VStack,
  HStack,
  Badge,
  IconButton,
  Spinner,
  useDisclosure,
  Input,
  Divider,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiFileText } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { BlockEditor } from '@/components/admin/pages/BlockEditor';
import { GlobalTabs, TabConfig } from '@/components/GlobalTabs';

interface PageBlock {
  type: string;
  [key: string]: any;
}

interface DynamicPage {
  slug: string;
  title?: string;
  description?: string;
  blocks: PageBlock[];
  createdAt?: any;
  updatedAt?: any;
}

export default function PagesManagementPage({ translations }: AdminPageProps) {
  const toast = useToast();
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dynamic-pages');
      const data = await res.json();
      if (data?.success) {
        setPages(data.pages || []);
      }
    } catch (error) {
      toast({ status: 'error', title: 'Erro ao carregar páginas' });
    } finally {
      setLoading(false);
    }
  };

  const createPage = async () => {
    if (!newPageSlug) {
      toast({ status: 'error', title: 'Slug é obrigatório' });
      return;
    }

    const exists = pages.find(p => p.slug === newPageSlug);
    if (exists) {
      toast({ status: 'error', title: 'Slug já existe' });
      return;
    }

    try {
      const res = await fetch('/api/admin/dynamic-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: newPageSlug, title: newPageTitle, blocks: [] }),
      });

      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Página criada!' });
        onClose();
        setNewPageSlug('');
        setNewPageTitle('');
        loadPages();
      } else {
        toast({ status: 'error', title: data?.error || 'Erro ao criar' });
      }
    } catch (error) {
      toast({ status: 'error', title: 'Erro ao criar página' });
    }
  };

  const savePage = async (slug: string) => {
    const page = pages.find(p => p.slug === slug);
    if (!page) return;

    try {
      const res = await fetch(`/api/admin/dynamic-pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      });

      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Página salva!' });
      } else {
        toast({ status: 'error', title: data?.error || 'Erro ao salvar' });
      }
    } catch (error) {
      toast({ status: 'error', title: 'Erro ao salvar página' });
    }
  };

  const deletePage = async (slug: string) => {
    if (slug === 'home') {
      toast({ status: 'error', title: 'Não é possível deletar a página home' });
      return;
    }

    if (!confirm('Tem certeza que deseja deletar esta página?')) return;

    try {
      const res = await fetch(`/api/admin/dynamic-pages/${slug}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Página deletada!' });
        loadPages();
      } else {
        toast({ status: 'error', title: data?.error || 'Erro ao deletar' });
      }
    } catch (error) {
      toast({ status: 'error', title: 'Erro ao deletar página' });
    }
  };

  const tabs: TabConfig[] = pages.map((page, index) => ({
    key: page.slug,
    label: page.title || page.slug,
    content: (
      <VStack spacing={6} align="stretch">
        {/* URL Preview */}
        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={2}>URL</Text>
          <Box bg="gray.50" p={3} borderRadius="md">
            <HStack>
              <Text>https://seudominio.com/</Text>
              <Text fontWeight="bold">/{page.slug}</Text>
              {page.slug === 'home' && (
                <Badge colorScheme="green" ml={2}>Fixa</Badge>
              )}
            </HStack>
          </Box>
        </Box>

        <Divider />

        {/* Title Input */}
        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            Título da Página
          </Text>
          <Input
            value={page.title || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const newPages = [...pages];
              newPages[index].title = e.target.value;
              setPages(newPages);
            }}
            placeholder="Título da página"
          />
        </Box>

        <Divider />

        {/* Block Editor */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="md" fontWeight="bold">
              Blocos da Página ({page.blocks?.length || 0})
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => savePage(page.slug)}
              >
                Salvar Página
              </Button>
              {page.slug !== 'home' && (
                <IconButton
                  aria-label="Deletar página"
                  icon={<FiTrash2 />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => deletePage(page.slug)}
                />
              )}
            </HStack>
          </HStack>
          <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
            <BlockEditor
              blocks={page.blocks || []}
              onChange={(blocks) => {
                const newPages = [...pages];
                newPages[index].blocks = blocks;
                setPages(newPages);
              }}
            />
          </Box>
        </Box>
      </VStack>
    )
  }));

  if (loading) {
    return (
      <AdminLayout title="Gerenciar Páginas" translations={translations}>
        <Box textAlign="center" py={10}>
          <Spinner size="lg" />
          <Text mt={4}>Carregando páginas...</Text>
        </Box>
      </AdminLayout>
    );
  }

  if (pages.length === 0) {
    return (
      <AdminLayout
        title="Gerenciar Páginas"
        subtitle="Crie e gerencie páginas dinâmicas da plataforma"
        translations={translations}
        side={
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            size="sm"
            onClick={onOpen}
          >
            Nova Página
          </Button>
        }
      >
        <Box textAlign="center" py={10}>
          <VStack spacing={4}>
            <FiFileText size={48} color="#CBD5E0" />
            <Text color="gray.500">Nenhuma página criada ainda</Text>
            <Button onClick={onOpen}>
              Criar primeira página
            </Button>
          </VStack>
        </Box>

        {/* MODAL: CRIAR */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Criar Nova Página</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Box w="full">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Slug (URL)
                  </Text>
                  <Box bg="gray.50" p={2} borderRadius="md">
                    <HStack>
                      <Text color="gray.500">https://seudominio.com/</Text>
                      <Input
                        value={newPageSlug}
                        onChange={(e) => setNewPageSlug(e.target.value)}
                        placeholder="servicos"
                        variant="unstyled"
                        fontWeight="bold"
                      />
                    </HStack>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Use apenas letras minúsculas, números e hífens
                  </Text>
                </Box>

                <Box w="full">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Título (opcional)
                  </Text>
                  <Input
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Ex: Nossos Serviços"
                  />
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} mr={2}>
                Cancelar
              </Button>
              <Button colorScheme="blue" onClick={createPage}>
                Criar Página
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Gerenciar Páginas"
      subtitle="Crie e gerencie páginas dinâmicas da plataforma"
      translations={translations}
      side={
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          size="sm"
          onClick={onOpen}
        >
          Nova Página
        </Button>
      }
    >
      <Box>
        <GlobalTabs
          tabs={tabs}
          defaultIndex={activeTab}
        />
      </Box>

      {/* MODAL: CRIAR */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Criar Nova Página</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box w="full">
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Slug (URL)
                </Text>
                <Box bg="gray.50" p={2} borderRadius="md">
                  <HStack>
                    <Text color="gray.500">https://seudominio.com/</Text>
                    <Input
                      value={newPageSlug}
                      onChange={(e) => setNewPageSlug(e.target.value)}
                      placeholder="servicos"
                      variant="unstyled"
                      fontWeight="bold"
                    />
                  </HStack>
                </Box>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Use apenas letras minúsculas, números e hífens
                </Text>
              </Box>

              <Box w="full">
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Título (opcional)
                </Text>
                <Input
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Ex: Nossos Serviços"
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={2}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={createPage}>
              Criar Página
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => ({}));
