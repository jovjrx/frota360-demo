import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  IconButton,
  Heading,
  SimpleGrid,
  Text,
  Divider,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiArrowUp, FiArrowDown, FiEdit } from 'react-icons/fi';
import { ImageUpload } from './ImageUpload';

interface BlockEditorProps {
  blocks: any[];
  onChange: (blocks: any[]) => void;
}

const BLOCK_TYPES = [
  { value: 'hero', label: 'Hero' },
  { value: 'payments', label: 'Pagamentos' },
  { value: 'benefits', label: 'Benefícios' },
  { value: 'referral', label: 'Indicação' },
  { value: 'how_it_works', label: 'Como Funciona' },
  { value: 'services', label: 'Serviços' },
  { value: 'testimonials', label: 'Depoimentos' },
  { value: 'faq', label: 'FAQ' },
  { value: 'cta', label: 'CTA' },
  { value: 'card_with_highlight', label: 'Card com Destaque' },
  { value: 'team', label: 'Time' },
  { value: 'value_cards', label: 'Cards de Valores' },
  { value: 'financing', label: 'Financiamento' },
  { value: 'requirements', label: 'Requisitos' },
  { value: 'support', label: 'Suporte' },
  { value: 'title_only', label: 'Apenas Título' },
];

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newBlockType, setNewBlockType] = useState<string>('');
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const toast = useToast();

  const addBlock = (type: string) => {
    const newBlock: any = { type };

    // Campos padrão para blocos com textos multilíngua
    if (type === 'hero') {
      newBlock.title = { pt: '', en: '' };
      newBlock.subtitle = { pt: '', en: '' };
      newBlock.badge = { pt: '', en: '' };
      newBlock.primaryButtonText = { pt: '', en: '' };
      newBlock.secondaryButtonText = { pt: '', en: '' };
      newBlock.highlightTitle = { pt: '', en: '' };
      newBlock.highlightDescription = { pt: '', en: '' };
      newBlock.backgroundImage = '';
      newBlock.highlightImage = '';
      newBlock.primaryButtonLink = '';
      newBlock.secondaryButtonLink = '';
    } else if (type === 'cta') {
      newBlock.title = { pt: '', en: '' };
      newBlock.subtitle = { pt: '', en: '' };
      newBlock.feature = { pt: '', en: '' };
      newBlock.buttonText = { pt: '', en: '' };
      newBlock.buttonLink = '';
      newBlock.centered = false;
    } else if (type === 'title_only') {
      newBlock.title = { pt: '', en: '' };
      newBlock.subtitle = { pt: '', en: '' };
      newBlock.feature = { pt: '', en: '' };
    }

    onChange([...blocks, newBlock]);
    setNewBlockType('');
    toast({ status: 'success', title: 'Bloco adicionado', duration: 2000 });
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
    setEditingIndex(null);
    toast({ status: 'info', title: 'Bloco removido', duration: 2000 });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  const updateBlock = (index: number, field: string, value: any) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      [field]: value,
    };
    onChange(newBlocks);
  };

  const updateMultilangField = (index: number, field: string, lang: 'pt' | 'en', value: string) => {
    const newBlocks = [...blocks];
    const currentBlock = newBlocks[index];
    
    if (!currentBlock[field]) {
      currentBlock[field] = { pt: '', en: '' };
    }
    
    currentBlock[field][lang] = value;
    onChange(newBlocks);
  };

  const renderBlockField = (block: any, index: number, field: string, label: string, isMultilang = false) => {
    if (isMultilang) {
      return (
        <Box key={field} borderWidth="1px" borderRadius="md" p={4}>
          <FormLabel fontWeight="bold">{label}</FormLabel>
          <VStack spacing={2} mt={2}>
            <FormControl>
              <FormLabel fontSize="sm">🇵🇹 Português</FormLabel>
              <Input
                value={block[field]?.pt || ''}
                onChange={(e) => updateMultilangField(index, field, 'pt', e.target.value)}
                size="sm"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">🇬🇧 English</FormLabel>
              <Input
                value={block[field]?.en || ''}
                onChange={(e) => updateMultilangField(index, field, 'en', e.target.value)}
                size="sm"
              />
            </FormControl>
          </VStack>
        </Box>
      );
    }

    return (
      <FormControl key={field}>
        <FormLabel>{label}</FormLabel>
        <Input
          value={block[field] || ''}
          onChange={(e) => updateBlock(index, field, e.target.value)}
        />
      </FormControl>
    );
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingBlock({ ...blocks[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingBlock) {
      updateBlock(editingIndex, '*', editingBlock);
      setEditingIndex(null);
      setEditingBlock(null);
    }
  };

  const renderBlockEdit = (block: any, index: number) => {
    const isEditing = editingIndex === index;
    const currentBlock = isEditing ? editingBlock : block;

    if (!currentBlock) return null;

    return (
      <AccordionItem key={index}>
        <AccordionButton>
          <Box flex="1" textAlign="left">
            <HStack>
              <Badge colorScheme="blue">{block.type}</Badge>
              <Text fontSize="sm">#{index + 1}</Text>
              {isEditing && <Badge colorScheme="green">Editando</Badge>}
            </HStack>
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel pb={4}>
          <VStack spacing={4}>
            {!isEditing && (
              <Button
                leftIcon={<FiEdit />}
                onClick={() => startEdit(index)}
                colorScheme="blue"
                w="full"
              >
                Editar
              </Button>
            )}

            {isEditing && block.type === 'hero' && (
              <>
                <FormControl>
                  <FormLabel>Título PT</FormLabel>
                  <Input
                    value={currentBlock.title?.pt || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.title) newBlock.title = {};
                      newBlock.title.pt = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Título EN</FormLabel>
                  <Input
                    value={currentBlock.title?.en || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.title) newBlock.title = {};
                      newBlock.title.en = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Subtítulo PT</FormLabel>
                  <Textarea
                    value={currentBlock.subtitle?.pt || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.subtitle) newBlock.subtitle = {};
                      newBlock.subtitle.pt = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                    rows={2}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Subtítulo EN</FormLabel>
                  <Textarea
                    value={currentBlock.subtitle?.en || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.subtitle) newBlock.subtitle = {};
                      newBlock.subtitle.en = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                    rows={2}
                  />
                </FormControl>
              </>
            )}

            {isEditing && block.type === 'cta' && (
              <>
                <FormControl>
                  <FormLabel>Título PT</FormLabel>
                  <Input
                    value={currentBlock.title?.pt || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.title) newBlock.title = {};
                      newBlock.title.pt = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Título EN</FormLabel>
                  <Input
                    value={currentBlock.title?.en || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.title) newBlock.title = {};
                      newBlock.title.en = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                  />
                </FormControl>
              </>
            )}

            {isEditing && block.type === 'title_only' && (
              <>
                <FormControl>
                  <FormLabel>Título PT</FormLabel>
                  <Input
                    value={currentBlock.title?.pt || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.title) newBlock.title = {};
                      newBlock.title.pt = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Título EN</FormLabel>
                  <Input
                    value={currentBlock.title?.en || ''}
                    onChange={(e) => {
                      const newBlock = { ...currentBlock };
                      if (!newBlock.title) newBlock.title = {};
                      newBlock.title.en = e.target.value;
                      setEditingBlock(newBlock);
                    }}
                    size="sm"
                  />
                </FormControl>
              </>
            )}

            {/* Botões de ação */}
            <HStack w="full" mt={4}>
              {isEditing ? (
                <>
                  <Button
                    colorScheme="green"
                    onClick={saveEdit}
                    flex={1}
                  >
                    Salvar
                  </Button>
                  <Button
                    onClick={() => { setEditingIndex(null); setEditingBlock(null); }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  {index > 0 && (
                    <IconButton
                      aria-label="Mover para cima"
                      icon={<FiArrowUp />}
                      onClick={() => moveBlock(index, 'up')}
                    />
                  )}
                  {index < blocks.length - 1 && (
                    <IconButton
                      aria-label="Mover para baixo"
                      icon={<FiArrowDown />}
                      onClick={() => moveBlock(index, 'down')}
                    />
                  )}
                  <Button
                    colorScheme="red"
                    leftIcon={<FiTrash2 />}
                    onClick={() => removeBlock(index)}
                    flex={1}
                  >
                    Remover
                  </Button>
                </>
              )}
            </HStack>
          </VStack>
        </AccordionPanel>
      </AccordionItem>
    );
  };

  return (
    <Box>
      <Heading size="md" mb={4}>Blocos ({blocks.length})</Heading>

      {/* Botão adicionar bloco */}
      <HStack mb={4}>
        <Select
          placeholder="Adicionar bloco..."
          value={newBlockType}
          onChange={(e) => setNewBlockType(e.target.value)}
          flex={1}
        >
          {BLOCK_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {bt.label}
            </option>
          ))}
        </Select>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => addBlock(newBlockType)}
          isDisabled={!newBlockType}
        >
          Adicionar
        </Button>
      </HStack>

      <Divider mb={4} />

      {/* Lista de blocos */}
      {blocks.length === 0 ? (
        <Box p={8} textAlign="center" borderWidth="1px" borderRadius="md">
          <Text color="gray.500">Nenhum bloco adicionado</Text>
        </Box>
      ) : (
        <Accordion allowToggle>
          {blocks.map((block, index) => renderBlockEdit(block, index))}
        </Accordion>
      )}
    </Box>
  );
}

