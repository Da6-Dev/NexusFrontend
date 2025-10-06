import { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, VStack, Checkbox, Textarea, Text, Flex, Heading
} from '@chakra-ui/react';
import type { Flashcard } from '../types/Flashcard';

// Tipagem para os flashcards gerados pela IA (sem ID ainda)
type GeneratedFlashcard = Omit<Flashcard, 'id' | 'topicId'>;

interface AiFlashcardReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    generatedFlashcards: GeneratedFlashcard[];
    onSave: (flashcardsToSave: GeneratedFlashcard[]) => void;
    isSaving: boolean;
}

export function AiFlashcardReviewModal({
    isOpen,
    onClose,
    generatedFlashcards,
    onSave,
    isSaving,
}: AiFlashcardReviewModalProps) {
    const [editableFlashcards, setEditableFlashcards] = useState<GeneratedFlashcard[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // Atualiza o estado interno quando a lista de flashcards gerados muda
    useEffect(() => {
        if (isOpen) {
            setEditableFlashcards(generatedFlashcards);
            // Por padrão, todos os flashcards vêm selecionados
            setSelectedIndices(generatedFlashcards.map((_, index) => index));
        }
    }, [generatedFlashcards, isOpen]);

    const handleCheckboxChange = (index: number) => {
        setSelectedIndices(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleTextChange = (index: number, field: 'front' | 'back', value: string) => {
        setEditableFlashcards(prev =>
            prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
        );
    };

    const handleSaveClick = () => {
        const flashcardsToSave = editableFlashcards.filter((_, index) =>
            selectedIndices.includes(index)
        );
        onSave(flashcardsToSave);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Flashcards Gerados por IA</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text>Revise, edite e selecione os flashcards que deseja salvar.</Text>
                        {editableFlashcards.map((card, index) => (
                            <Flex key={index} p="4" borderWidth="1px" borderRadius="md" align="start">
                                <Checkbox
                                    isChecked={selectedIndices.includes(index)}
                                    onChange={() => handleCheckboxChange(index)}
                                    mt="1"
                                    mr="4"
                                />
                                <VStack spacing={2} align="stretch" flex="1">
                                    <Heading size="sm">Frente</Heading>
                                    <Textarea
                                        value={card.front}
                                        onChange={(e) => handleTextChange(index, 'front', e.target.value)}
                                    />
                                    <Heading size="sm" mt="2">Verso</Heading>
                                    <Textarea
                                        value={card.back}
                                        onChange={(e) => handleTextChange(index, 'back', e.target.value)}
                                    />
                                </VStack>
                            </Flex>
                        ))}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSaveClick}
                        isLoading={isSaving}
                        disabled={selectedIndices.length === 0}
                    >
                        Salvar ({selectedIndices.length}) Selecionados
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}