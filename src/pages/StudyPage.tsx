import { useState, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import {
    Heading, Text, Button, Spinner, Center, VStack, HStack, Icon, useToast
} from '@chakra-ui/react';
import { FaCopy, FaCheckSquare } from 'react-icons/fa';
import type { Flashcard } from '../types/Flashcard';
import { FlashcardPlayer } from '../components/FlashcardPlayer';
import { McqPlayer } from '../components/McqPlayer';

// Tipos para os modos de estudo
type StudyMode = 'classic' | 'mcq' | null;

// Função de busca de dados
const fetchDueCards = async (): Promise<Flashcard[]> => {
    const { data } = await api.get('/study/due-cards');
    return data;
};

export function StudyPage() {
    const { data: dueCards, isLoading } = useQuery({
        queryKey: ['dueCardsForStudy'],
        queryFn: fetchDueCards,
    });
    const navigate = useNavigate();
    const toast = useToast();

    const [studyMode, setStudyMode] = useState<StudyMode>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentFlashcard = useMemo(() => dueCards?.[currentIndex], [dueCards, currentIndex]);

    const handleCardReviewed = async (performanceRating: number) => {
        if (!currentFlashcard) return;

        try {
            await api.post(`/study/review/${currentFlashcard.id}`, { performanceRating });

            if (currentIndex < (dueCards?.length ?? 0) - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                toast({
                    title: 'Sessão concluída!',
                    description: 'Ótimo trabalho. Você revisou todos os cards.',
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                    position: 'top',
                });
                navigate('/');
            }
        } catch (error) {
            console.error('Erro ao registrar revisão:', error);
            toast({
                title: 'Erro ao salvar revisão.',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
        }
    };

    if (isLoading) {
        return <Center h="100%"><Spinner size="xl" /></Center>;
    }

    if (!dueCards || dueCards.length === 0) {
        return (
            <Center h="100%">
                <VStack spacing="4">
                    <Heading as="h2" size="lg">Sessão de Estudo</Heading>
                    <Text fontSize="lg">Você não tem nenhum card para revisar hoje. Bom trabalho!</Text>
                    <Button as={RouterLink} to="/" colorScheme="blue">
                        Voltar para a página inicial
                    </Button>
                </VStack>
            </Center>
        );
    }

    if (!studyMode) {
        return (
            <Center h="100%">
                <VStack spacing="8">
                    <Heading>Como você quer estudar hoje?</Heading>
                    <HStack spacing="6">
                        <Button
                            leftIcon={<Icon as={FaCopy} />}
                            p="8"
                            h="auto"
                            onClick={() => setStudyMode('classic')}
                        >
                            Modo Clássico
                        </Button>
                        <Button
                            leftIcon={<Icon as={FaCheckSquare} />}
                            p="8"
                            h="auto"
                            onClick={() => setStudyMode('mcq')}
                        >
                            Múltipla Escolha
                        </Button>
                    </HStack>
                </VStack>
            </Center>
        );
    }

    if (currentFlashcard) {
        return (
            <VStack spacing="4" align="stretch" w="100%" maxW="600px" mx="auto">
                <Text textAlign="center" fontSize="lg" fontWeight="bold">
                    Restam {dueCards.length - currentIndex} card(s)
                </Text>
                {studyMode === 'classic' && (
                    <FlashcardPlayer flashcard={currentFlashcard} onReviewed={handleCardReviewed} />
                )}
                {studyMode === 'mcq' && (
                    <McqPlayer flashcard={currentFlashcard} onReviewed={handleCardReviewed} />
                )}
            </VStack>
        );
    }

    return null;
}