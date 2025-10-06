// src/pages/TopicDetail.tsx

import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
    Box, Heading, Button, Spinner, Center, VStack, Text, Input, Textarea, Flex,
    Breadcrumb, BreadcrumbItem, Accordion, AccordionItem, AccordionButton,
    AccordionPanel, AccordionIcon, Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, useDisclosure, useToast, ModalFooter, FormControl,
    FormErrorMessage, Grid, GridItem, Tabs, TabList, Tab, TabPanels, TabPanel, SimpleGrid,
} from '@chakra-ui/react';
import type { Note } from '../types/Note';
import type { Flashcard } from '../types/Flashcard';
import { FaStickyNote, FaMagic, FaBrain, FaPlus } from 'react-icons/fa';
import { EmptyState } from '../components/EmptyState';
import { AiFlashcardReviewModal } from '../components/AiFlashcardReviewModal';
import { AiSummaryModal } from '../components/AiSummaryModal';
import { FlashcardItem } from '../components/FlashcardItem';
import { RichTextEditor } from '../components/RichTextEditor';
import { useEditor, EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style'; // Importe TextStyle separadamente
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';

// --- VERSÃO CORRIGIDA E ROBUSTA DO TIPTAPRENDERER ---
const TiptapRenderer = ({ contentUrl }: { contentUrl: string }) => {
    const [editor, setEditor] = useState<Editor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        // Destrói a instância anterior do editor para evitar memory leaks
        editor?.destroy();
        setEditor(null);

        if (!contentUrl || !contentUrl.startsWith('http')) {
            setError("URL do conteúdo da anotação é inválida.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        fetch(contentUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
                return response.json();
            })
            .then(data => {
                if (!isMounted) return;

                // **AQUI ESTÁ A MELHORIA PRINCIPAL**
                // O renderizador agora tem as mesmas extensões do editor principal.
                const newEditor = new Editor({
                    editable: false,
                    content: data,
                    extensions: [
                        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
                        Underline,
                        Link,
                        Youtube.configure({ controls: true, nocookie: true }),
                        Image.configure({ inline: false }),
                        Highlight.configure({ multicolor: true }),
                        TextStyle, // Note: TextStyle engloba a funcionalidade de cor
                        Color,
                        TextAlign.configure({ types: ['heading', 'paragraph'] }),
                        Table.configure({ resizable: false }), // 'resizable' é uma boa opção para modo de leitura
                        TableRow,
                        TableHeader,
                        TableCell,
                        HorizontalRule,
                    ],
                });

                // A verificação de conteúdo vazio ainda é útil para detetar ficheiros genuinamente corrompidos.
                if (newEditor.isEmpty) {
                    throw new Error("O conteúdo desta anotação está vazio ou corrompido e não pode ser exibido.");
                }

                setEditor(newEditor);
            })
            .catch(err => {
                console.error("Falha ao carregar ou processar o conteúdo da anotação:", err);
                if (isMounted) {
                    // Agora, o erro provavelmente indica um problema real no ficheiro, não um elemento em falta.
                    setError(err.message);
                }
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [contentUrl]);

    // Efeito de limpeza final para garantir que o editor seja destruído
    useEffect(() => {
        return () => editor?.destroy();
    }, [editor]);


    // Estilos visuais para a renderização (pode manter os seus)
    const rendererStyles = {
        '> .tiptap': {
            'h1, h2, h3': { lineHeight: 1.2, fontWeight: 'bold', margin: '0.8em 0 0.4em' },
            'h1': { fontSize: '1.8em' },
            'h2': { fontSize: '1.5em' },
            'h3': { fontSize: '1.25em' },
            'p': { margin: '0.5em 0' },
            'a': { color: 'blue.500', textDecoration: 'underline', cursor: 'pointer' },
            'blockquote': { paddingLeft: '1rem', borderLeft: '3px solid', borderColor: 'gray.300', fontStyle: 'italic', marginY: '1rem' },
            'pre': { bg: 'gray.900', color: 'white', fontFamily: 'monospace', padding: '0.75rem 1rem', borderRadius: '0.5rem' },
            'img': { maxWidth: '100%', height: 'auto', display: 'block', margin: '1rem auto', borderRadius: 'md' },
            'iframe': { width: '100%', aspectRatio: '16 / 9', height: 'auto', borderRadius: 'md', marginY: '1rem' },
            'mark': { backgroundColor: '#FAF594', padding: '1px 3px', borderRadius: '2px' },
            'ul, ol': { paddingLeft: '2rem', listStylePosition: 'inside', margin: '1em 0' }, // <-- CORREÇÃO APLICADA AQUI
            'hr': { marginY: '2rem' },
            'table': { width: '100%', borderCollapse: 'collapse', margin: '1rem 0', 'th, td': { border: '1px solid', borderColor: 'gray.300', padding: '8px', verticalAlign: 'top' }, 'th': { bg: 'gray.100', fontWeight: 'bold' } },
        }
    };

    if (isLoading) return <Center p={5}><Spinner /></Center>;
    if (error) return <Center p={5}><Text color="red.500" fontWeight="bold">{error}</Text></Center>;
    if (!editor) return <Center p={5}><Text color="gray.500">A preparar anotação...</Text></Center>;

    return <Box sx={rendererStyles}><EditorContent editor={editor} /></Box>;
};


type GeneratedFlashcard = Omit<Flashcard, 'id' | 'topicId'>;

// --- Funções de API ---
const fetchData = async (id: string) => {
    const [topicRes, notesRes, flashcardsRes] = await Promise.all([
        api.get(`/topics/${id}`),
        api.get(`/topics/${id}/notes`),
        api.get(`/topics/${id}/flashcards`),
    ]);
    return { topic: topicRes.data, notes: notesRes.data, flashcards: flashcardsRes.data };
};

// --- Tipagem dos Forms ---
interface NoteFormData { title: string; }
interface FlashcardFormData { front: string; back: string; }

export function TopicDetail() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const toast = useToast();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
    const { isOpen: isAiModalOpen, onOpen: onAiModalOpen, onClose: onAiModalClose } = useDisclosure();
    const { isOpen: isSummaryModalOpen, onOpen: onSummaryModalOpen, onClose: onSummaryModalClose } = useDisclosure();
    const { isOpen: isNoteModalOpen, onOpen: onNoteModalOpen, onClose: onNoteModalClose } = useDisclosure();
    const { isOpen: isFlashcardEditModalOpen, onOpen: onFlashcardEditModalOpen, onClose: onFlashcardEditModalClose } = useDisclosure();
    const [summaryContent, setSummaryContent] = useState<string | null>(null);
    const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcard[]>([]);

    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // --- Forms com Validação ---
    const { register: registerNote, handleSubmit: handleNoteSubmit, reset: resetNoteForm, setValue, formState: { errors: noteErrors } } = useForm<NoteFormData>();
    const [noteContent, setNoteContent] = useState<object | null>(null);
    const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
    const [flashcardToDeleteId, setFlashcardToDeleteId] = useState<string | null>(null);
    const { register: registerFlashcard, handleSubmit: handleFlashcardSubmit, reset: resetFlashcardForm, setValue: setFlashcardValue, formState: { errors: flashcardErrors, isSubmitting: isFlashcardSubmitting } } = useForm<FlashcardFormData>();

    // --- Query Principal ---
    const { data, isLoading } = useQuery({
        queryKey: ['topicData', id],
        queryFn: () => fetchData(id!),
        enabled: !!id,
    });

    // --- Mutações (sem alterações) ---
    const updateFlashcardMutation = useMutation({
        mutationFn: (updatedFlashcard: Partial<Flashcard> & { id: string }) => api.patch(`/flashcards/${updatedFlashcard.id}`, updatedFlashcard),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicData', id] });
            onFlashcardEditModalClose();
            toast({ title: "Flashcard atualizado!", status: 'success', duration: 3000, isClosable: true });
        }
    });
    const deleteFlashcardMutation = useMutation({
        mutationFn: (flashcardId: string) => api.delete(`/flashcards/${flashcardId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicData', id] });
            onDeleteModalClose();
            toast({ title: "Flashcard excluído.", status: 'info', duration: 3000, isClosable: true });
        },
    });
    const createNoteMutation = useMutation({
        mutationFn: (newNote: Omit<Note, 'id'>) => api.post('/notes', newNote),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicData', id] });
            resetNoteForm();
            setNoteContent(null);
            toast({ title: "Anotação criada com sucesso!", status: 'success', duration: 3000, isClosable: true });
        },
    });
    const updateNoteMutation = useMutation({
        mutationFn: (updatedNote: Partial<Note> & { id: string }) => api.patch(`/notes/${updatedNote.id}`, updatedNote),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicData', id] });
            setEditingNote(null);
            toast({ title: "Anotação atualizada!", status: 'success', duration: 3000, isClosable: true });
        }
    });
    const deleteNoteMutation = useMutation({
        mutationFn: (noteId: string) => api.delete(`/notes/${noteId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicData', id] });
            toast({ title: "Anotação excluída.", status: 'info', duration: 3000, isClosable: true });
            onDeleteModalClose();
        },
    });
    const createFlashcardMutation = useMutation({
        mutationFn: (newFlashcard: Omit<Flashcard, 'id'>) => api.post('/flashcards', newFlashcard),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicData', id] });
            resetFlashcardForm();
            toast({ title: "Flashcard criado!", status: 'success', duration: 3000, isClosable: true });
        },
    });
    const generateFlashcardsMutation = useMutation({
        mutationFn: (noteContent: string) => api.post('/ai/generate-flashcards', { noteContent }),
        onSuccess: (response) => {
            setGeneratedFlashcards(response.data);
            onAiModalOpen();
            toast({ title: 'Flashcards gerados!', description: 'Revise e salve os flashcards sugeridos.', status: 'success', duration: 4000 });
        },
        onError: (error: any) => {
            toast({ title: 'Erro ao gerar flashcards', description: error.response?.data?.message || 'Tente novamente.', status: 'error', duration: 5000 });
        }
    });
    const saveGeneratedFlashcardsMutation = useMutation({
        mutationFn: (flashcardsToSave: GeneratedFlashcard[]) => {
            const promises = flashcardsToSave.map(card =>
                api.post('/flashcards', { ...card, topicId: id })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicData', id] });
            onAiModalClose();
            toast({ title: 'Flashcards salvos com sucesso!', status: 'success', duration: 3000 });
        },
        onError: () => {
            toast({ title: 'Erro ao salvar os flashcards', status: 'error', duration: 5000 });
        }
    });
    const summarizeNoteMutation = useMutation({
        mutationFn: (noteContent: string) => api.post('/ai/summarize-note', { noteContent }),
        onSuccess: (response) => {
            setSummaryContent(response.data);
            onSummaryModalOpen();
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao gerar resumo',
                description: error.response?.data?.message || 'A IA não conseguiu processar o resumo.',
                status: 'error',
                duration: 5000,
            });
        },
    });

    // --- Handlers (com as correções da etapa anterior) ---

    // Função auxiliar para extrair texto do JSON do Tiptap
    const extractTextFromTiptap = (node: any): string => {
        if (node.text) return node.text;
        if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractTextFromTiptap).join(' ');
        }
        return '';
    };

    const handleGenerateFlashcards = async (note: Note) => {
        if (typeof note.content !== 'string' || !note.content.startsWith('http')) {
            toast({ title: 'Conteúdo da anotação inválido.', status: 'error', duration: 3000 });
            return;
        }
        try {
            const response = await fetch(note.content);
            const contentJson = await response.json();
            const textContent = extractTextFromTiptap(contentJson);
            if (textContent.length < 50) {
                toast({ title: 'Anotação muito curta', status: 'warning', duration: 4000 });
                return;
            }
            generateFlashcardsMutation.mutate(textContent);
        } catch (e) {
            toast({ title: 'Erro ao buscar conteúdo da anotação.', status: 'error', duration: 3000 });
        }
    };

    const handleSummarizeNote = async (note: Note) => {
        if (typeof note.content !== 'string' || !note.content.startsWith('http')) {
            toast({ title: 'Conteúdo da anotação inválido.', status: 'error', duration: 3000 });
            return;
        }
        try {
            const response = await fetch(note.content);
            const contentJson = await response.json();
            const textContent = extractTextFromTiptap(contentJson);
            if (textContent.length < 100) {
                toast({ title: 'Anotação muito curta', status: 'warning', duration: 4000 });
                return;
            }
            summarizeNoteMutation.mutate(textContent);
        } catch (e) {
            toast({ title: 'Erro ao buscar conteúdo da anotação.', status: 'error', duration: 3000 });
        }
    };

    const onFlashcardFormSubmit = (data: FlashcardFormData) => {
        if (editingFlashcard) {
            updateFlashcardMutation.mutate({ id: editingFlashcard.id, ...data });
        } else {
            createFlashcardMutation.mutate({ ...data, topicId: id! });
        }
    };

    const openFlashcardEditModal = (flashcard: Flashcard) => {
        setEditingFlashcard(flashcard);
        setFlashcardValue('front', flashcard.front);
        setFlashcardValue('back', flashcard.back);
        onFlashcardEditModalOpen();
    };

    const openDeleteConfirm = (item: Note | Flashcard, type: 'note' | 'flashcard') => {
        if (type === 'note') {
            setNoteToDelete(item as Note);
            setFlashcardToDeleteId(null);
        }
        if (type === 'flashcard') {
            setFlashcardToDeleteId(item.id);
            setNoteToDelete(null);
        }
        onDeleteModalOpen();
    };

    const confirmDelete = () => {
        if (noteToDelete) deleteNoteMutation.mutate(noteToDelete.id);
        if (flashcardToDeleteId) deleteFlashcardMutation.mutate(flashcardToDeleteId);
    };

    const onNoteFormSubmit = (data: NoteFormData) => {
        if (!id || !noteContent) return;
        createNoteMutation.mutate({ title: data.title, content: noteContent, topicId: id });
    };

    const handleSaveGeneratedFlashcards = (flashcardsToSave: GeneratedFlashcard[]) => {
        saveGeneratedFlashcardsMutation.mutate(flashcardsToSave);
    };

    if (isLoading) return <Center h="100%"><Spinner /></Center>;
    if (!data) return <Text>Tópico não encontrado.</Text>;
    const { topic, notes, flashcards } = data;

    // --- JSX (sem alterações, apenas garantindo que as chamadas estão corretas) ---
    return (
        <VStack spacing={6} align="stretch">
            {/* --- MODAIS --- */}
            <Modal isOpen={isNoteModalOpen} onClose={onNoteModalClose} size="3xl" isCentered>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleNoteSubmit(onNoteFormSubmit)}>
                    <ModalHeader>{editingNote ? "Editar Anotação" : "Criar Nova Anotação"}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isInvalid={!!noteErrors.title}>
                                <Input
                                    placeholder="Título da anotação"
                                    {...registerNote('title', { required: 'O título é obrigatório.' })}
                                />
                                <FormErrorMessage>{noteErrors.title?.message}</FormErrorMessage>
                            </FormControl>
                            <RichTextEditor
                                content={noteContent}
                                onChange={setNoteContent}
                            />
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onNoteModalClose}>Cancelar</Button>
                        <Button colorScheme="blue" type="submit" isLoading={createNoteMutation.isPending || updateNoteMutation.isPending}>
                            Salvar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isFlashcardEditModalOpen} onClose={onFlashcardEditModalClose} size="xl" isCentered>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleFlashcardSubmit(onFlashcardFormSubmit)}>
                    <ModalHeader>Editar Flashcard</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={3}>
                            <FormControl isInvalid={!!flashcardErrors.front}>
                                <Textarea placeholder="Frente" {...registerFlashcard('front', { required: true })} />
                            </FormControl>
                            <FormControl isInvalid={!!flashcardErrors.back}>
                                <Textarea placeholder="Verso" {...registerFlashcard('back', { required: true })} />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFlashcardEditModalClose}>Cancelar</Button>
                        <Button colorScheme="blue" type="submit" isLoading={updateFlashcardMutation.isPending}>
                            Salvar Alterações
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirmar Exclusão</ModalHeader>
                    <ModalBody>
                        <Text>Tem a certeza que deseja excluir este item? Esta ação não pode ser desfeita.</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={onDeleteModalClose}>Cancelar</Button>
                        <Button colorScheme="red" onClick={confirmDelete} isLoading={deleteNoteMutation.isPending || deleteFlashcardMutation.isPending}>
                            Excluir
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <AiSummaryModal isOpen={isSummaryModalOpen} onClose={onSummaryModalClose} summary={summaryContent} isLoading={summarizeNoteMutation.isPending} />
            <AiFlashcardReviewModal isOpen={isAiModalOpen} onClose={onAiModalClose} generatedFlashcards={generatedFlashcards} onSave={handleSaveGeneratedFlashcards} isSaving={saveGeneratedFlashcardsMutation.isPending} />

            {/* --- CABEÇALHO DA PÁGINA --- */}
            <Box>
                <Breadcrumb>
                    <BreadcrumbItem><RouterLink to="/">Início</RouterLink></BreadcrumbItem>
                    <BreadcrumbItem><RouterLink to={`/modules/${topic.moduleId}`}>Módulo</RouterLink></BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage><Text>{topic.name}</Text></BreadcrumbItem>
                </Breadcrumb>
                <Heading mt={2}>{topic.name}</Heading>
            </Box>

            {/* --- GRELHA PRINCIPAL --- */}
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1.2fr" }} gap={8}>
                {/* --- COLUNA ESQUERDA (ANOTAÇÕES) --- */}
                <GridItem>
                    <VStack align="stretch" spacing={4}>
                        <Flex justify="space-between" align="center">
                            <Heading size="md">Anotações ({notes.length})</Heading>
                            <Button leftIcon={<FaPlus />} size="sm" colorScheme="blue" onClick={() => {
                                setEditingNote(null);
                                resetNoteForm();
                                setNoteContent(null);
                                onNoteModalOpen();
                            }}>
                                Criar Anotação
                            </Button>
                        </Flex>

                        {notes.length > 0 ? (
                            <Accordion allowToggle defaultIndex={[0]}>
                                {notes.map((note: Note) => (
                                    <AccordionItem key={note.id}>
                                        <h2><AccordionButton><Box flex="1" textAlign="left">{note.title}</Box><AccordionIcon /></AccordionButton></h2>
                                        <AccordionPanel pb={4}>
                                            {/* CHAMADA CORRETA */}
                                            <TiptapRenderer contentUrl={note.content} />

                                            <Flex justify="flex-end" mt="4">
                                                {/* CHAMADAS CORRETAS */}
                                                <Button size="sm" leftIcon={<FaBrain />} colorScheme="teal" mr="2" onClick={() => handleSummarizeNote(note)}>Resumir</Button>
                                                <Button size="sm" leftIcon={<FaMagic />} colorScheme="purple" mr="2" onClick={() => handleGenerateFlashcards(note)}>Gerar Flashcards</Button>
                                                <Button size="sm" onClick={() => {
                                                    setEditingNote(note);
                                                    // Aqui teríamos que buscar o conteúdo para editar,
                                                    // uma funcionalidade a ser adicionada no futuro.
                                                    // Por agora, abrir o modal de edição não vai funcionar como esperado.
                                                    toast({ title: "Edição em desenvolvimento", status: "info" });
                                                    // setValue('title', note.title);
                                                    // onNoteModalOpen();
                                                }}>Editar</Button>
                                                <Button size="sm" colorScheme="red" ml="2" onClick={() => openDeleteConfirm(note, 'note')}>Excluir</Button>
                                            </Flex>
                                        </AccordionPanel>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <EmptyState
                                icon={FaStickyNote}
                                title="Nenhuma anotação salva"
                                description="Crie a sua primeira anotação para este assunto."
                            />
                        )}
                    </VStack>
                </GridItem>

                {/* --- COLUNA DIREITA (FLASHCARDS) --- */}
                <GridItem>
                    <Box p={4} borderWidth="1px" borderRadius="lg" position="sticky" top="80px">
                        <Heading size="md" mb={4}>Flashcards ({flashcards.length})</Heading>
                        <Tabs isFitted variant="enclosed">
                            <TabList>
                                <Tab>Visualizar</Tab>
                                <Tab>Adicionar</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel px={1} py={4}>
                                    {flashcards.length > 0 ? (
                                        <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} spacing={4}>
                                            {flashcards.map((flashcard: Flashcard) => (
                                                <FlashcardItem
                                                    key={flashcard.id}
                                                    flashcard={flashcard}
                                                    onDelete={() => openDeleteConfirm(flashcard, 'flashcard')}
                                                    onEdit={() => openFlashcardEditModal(flashcard)}
                                                />
                                            ))}
                                        </SimpleGrid>
                                    ) : (
                                        <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
                                            Nenhum flashcard criado ainda.
                                        </Text>
                                    )}
                                </TabPanel>
                                <TabPanel>
                                    <form onSubmit={handleFlashcardSubmit(onFlashcardFormSubmit)}>
                                        <VStack spacing={3} align="stretch">
                                            <FormControl isInvalid={!!flashcardErrors.front}>
                                                <Textarea placeholder="Frente (Pergunta)" {...registerFlashcard('front', { required: true })} />
                                            </FormControl>
                                            <FormControl isInvalid={!!flashcardErrors.back}>
                                                <Textarea placeholder="Verso (Resposta)" {...registerFlashcard('back', { required: true })} />
                                            </FormControl>
                                            <Button type="submit" colorScheme="blue" isLoading={isFlashcardSubmitting || createFlashcardMutation.isPending}>
                                                Salvar Flashcard
                                            </Button>
                                        </VStack>
                                    </form>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </Box>
                </GridItem>
            </Grid>
        </VStack>
    );
}