import { useState } from 'react';
import {
    Box, Button, VStack, Text, SimpleGrid, useColorModeValue,
    Heading, Alert, AlertIcon, Progress
} from '@chakra-ui/react';
import type { AiQuestion } from '../pages/SimulationPage'; // Importa o novo tipo

interface SimulationPlayerProps {
    questions: AiQuestion[];
    onRestart: () => void;
}

export function SimulationPlayer({ questions, onRestart }: SimulationPlayerProps) {
    const [state, setState] = useState<'playing' | 'finished'>('playing');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(string | null)[]>(new Array(questions.length).fill(null));
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const bg = useColorModeValue('gray.50', 'gray.700');
    const currentQuestion = questions[currentIndex];

    const handleAnswer = (option: string) => {
        if (selectedOption !== null) return;
        setSelectedOption(option);

        const newAnswers = [...answers];
        newAnswers[currentIndex] = option;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
        } else {
            setState('finished');
        }
    };

    const getButtonColorScheme = (option: string) => {
        if (selectedOption === null) return 'gray';
        const isCorrect = currentQuestion.answer === option;
        if (isCorrect) return 'green';
        if (selectedOption === option) return 'red';
        return 'gray';
    };

    const score = answers.reduce((correctCount, answer, index) => {
        return answer === questions[index]?.answer ? correctCount + 1 : correctCount;
    }, 0);

    if (state === 'finished') {
        return (
            <VStack spacing={6} p={8} borderWidth="1px" borderRadius="lg">
                <Heading>Simulado Finalizado!</Heading>
                <Text fontSize="2xl">
                    O seu resultado foi: <strong>{score} de {questions.length}</strong>
                </Text>
                <Progress
                    value={(score / questions.length) * 100}
                    size="lg"
                    colorScheme={score / questions.length > 0.7 ? 'green' : 'orange'}
                    w="100%"
                    borderRadius="md"
                />
                <Button onClick={onRestart} colorScheme="blue">
                    Gerar Novo Simulado
                </Button>
            </VStack>
        );
    }

    return (
        <VStack spacing="6" align="stretch" maxW="container.md" mx="auto">
            <Heading size="md">Questão {currentIndex + 1} de {questions.length}</Heading>
            <Box p="6" bg={bg} borderRadius="lg" minH="150px">
                <Text fontSize="lg" style={{ whiteSpace: 'pre-wrap' }}>{currentQuestion.question}</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
                {currentQuestion.options.map((option, index) => (
                    <Button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        colorScheme={getButtonColorScheme(option)}
                        p="6" h="auto" whiteSpace="normal"
                        textAlign="left" justifyContent="flex-start"
                        isDisabled={selectedOption !== null}
                    >
                        {option}
                    </Button>
                ))}
            </SimpleGrid>

            {selectedOption && (
                <Alert
                    status={selectedOption === currentQuestion.answer ? 'success' : 'error'}
                    variant="subtle"
                    borderRadius="md" p={4}
                >
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="bold">
                            {selectedOption === currentQuestion.answer ? 'Resposta Correta!' : 'Incorreto!'}
                        </Text>
                        {selectedOption !== currentQuestion.answer && (
                            <Text>A resposta certa era: "{currentQuestion.answer}"</Text>
                        )}
                    </Box>
                </Alert>
            )}

            <Button
                onClick={handleNext}
                colorScheme="blue"
                isDisabled={selectedOption === null}
            >
                {currentIndex < questions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultado'}
            </Button>
        </VStack>
    );
}