import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Box, Button, VStack, Text, Spinner, Center, SimpleGrid, useColorModeValue } from '@chakra-ui/react';
import type { Flashcard } from '../types/Flashcard';

// Função para embaralhar um array
function shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

interface McqPlayerProps {
    flashcard: Flashcard;
    onReviewed: (performanceRating: number) => void; // Função para ser chamada após a revisão
}

export function McqPlayer({ flashcard, onReviewed }: McqPlayerProps) {
    const [options, setOptions] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const bg = useColorModeValue('gray.50', 'gray.700');

    // Mutation para buscar as opções incorretas da IA
    const { mutate: generateOptions, isPending: isLoadingOptions } = useMutation({
        mutationFn: (data: { question: string; correctAnswer: string }) =>
            api.post<string[]>('/ai/generate-mcq', data),
        onSuccess: (response) => {
            const incorrectOptions = response.data;
            const allOptions = [flashcard.back, ...incorrectOptions];
            setOptions(shuffleArray(allOptions));
        },
        onError: () => {
            // Fallback: Se a IA falhar, mostra apenas a resposta correta e uma errada
            setOptions(shuffleArray([flashcard.back, 'Opção inválida']));
        }
    });

    // Gera as opções quando o card muda
    useEffect(() => {
        // Reseta o estado para o novo card
        setIsAnswered(false);
        setSelectedAnswer(null);
        setOptions([]);

        // Chama a IA para gerar as opções
        generateOptions({
            question: flashcard.front,
            correctAnswer: flashcard.back,
        });
    }, [flashcard, generateOptions]);

    const handleAnswerClick = (option: string) => {
        if (isAnswered) return;
        setSelectedAnswer(option);
        setIsAnswered(true);

        const isCorrect = option === flashcard.back;
        // Simples lógica de avaliação: 5 para acerto, 0 para erro
        const performanceRating = isCorrect ? 5 : 0;

        // Atraso para o usuário ver o feedback visual antes de passar para o próximo card
        setTimeout(() => {
            onReviewed(performanceRating);
        }, 1500); // 1.5 segundos de feedback
    };

    const getButtonColorScheme = (option: string) => {
        if (!isAnswered) return 'gray';
        if (option === flashcard.back) return 'green'; // Resposta correta é sempre verde
        if (option === selectedAnswer) return 'red'; // Resposta errada selecionada é vermelha
        return 'gray'; // Outras opções erradas ficam neutras
    };

    if (isLoadingOptions || options.length === 0) {
        return <Center h="200px"><VStack><Spinner /><Text mt="2">Gerando opções com IA...</Text></VStack></Center>;
    }

    return (
        <VStack spacing="6" align="stretch">
            <Box p="6" bg={bg} borderRadius="lg" minH="150px" display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="xl" textAlign="center">{flashcard.front}</Text>
            </Box>
            <SimpleGrid columns={2} spacing="4">
                {options.map((option, index) => (
                    <Button
                        key={index}
                        onClick={() => handleAnswerClick(option)}
                        colorScheme={getButtonColorScheme(option)}
                        p="6"
                        h="auto"
                        whiteSpace="normal"
                        isDisabled={isAnswered && selectedAnswer !== option && option !== flashcard.back}
                    >
                        {option}
                    </Button>
                ))}
            </SimpleGrid>
        </VStack>
    );
}