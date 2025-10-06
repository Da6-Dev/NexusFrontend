import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import {
    Container,
    Heading,
    Text,
    useToast,
    VStack,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    Button,
    Spinner,
    Center,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { SimulationScopeSelector } from '../components/SimulationScopeSelector';
import { SimulationPlayer } from '../components/SimulationPlayer'; // Agora será usado

// --- Tipos de Dados ---
export interface AiQuestion {
    question: string;
    options: string[];
    answer: string;
}

type SimulationState = 'config' | 'loading' | 'playing' | 'finished';

interface Selection {
    disciplines: string[];
    modules: string[];
    topics: string[];
}

export function SimulationPage() {
    const [state, setState] = useState<SimulationState>('config');
    const [questions, setQuestions] = useState<AiQuestion[]>([]);
    const [questionCount, setQuestionCount] = useState(5);
    const [selection, setSelection] = useState<Selection>({ disciplines: [], modules: [], topics: [] });
    const toast = useToast();

    const generateSimulation = useMutation({
        mutationFn: (params: {
            questionCount: number,
            disciplineIds?: string[],
            moduleIds?: string[],
            topicIds?: string[]
        }) => api.post('/simulations', params),
        onSuccess: (response) => {
            const generatedQuestions = response.data;
            if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
                setQuestions(generatedQuestions);
                setState('playing');
            } else {
                throw new Error("A IA não retornou um formato de questões válido.");
            }
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao gerar simulado',
                description: error.response?.data?.message || 'A IA não conseguiu gerar as questões. Verifique se há conteúdo suficiente nas anotações.',
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
            setState('config');
        },
    });

    const handleStart = () => {
        const { disciplines, modules, topics } = selection;
        if (disciplines.length === 0 && modules.length === 0 && topics.length === 0) {
            toast({
                title: 'Nenhum conteúdo selecionado',
                description: 'Por favor, selecione pelo menos uma disciplina, módulo ou tópico para o simulado.',
                status: 'warning',
                isClosable: true,
            });
            return;
        }

        setState('loading');
        generateSimulation.mutate({
            questionCount,
            disciplineIds: disciplines,
            moduleIds: modules,
            topicIds: topics,
        });
    };

    const handleRestart = () => {
        setQuestions([]);
        setState('config');
    };

    if (state === 'loading') {
        return (
            <Center h="100%">
                <VStack spacing={4}>
                    <Spinner size="xl" />
                    <Text>A IA está a gerar as suas questões...</Text>
                    <Text fontSize="sm" color="gray.500">Isto pode demorar alguns segundos.</Text>
                </VStack>
            </Center>
        );
    }

    // --- INÍCIO DA CORREÇÃO ---
    // Substituímos o <Text> pelo componente real
    if (state === 'playing' || state === 'finished') {
        return (
            <SimulationPlayer
                questions={questions}
                onRestart={handleRestart}
            />
        );
    }
    // --- FIM DA CORREÇÃO ---

    return (
        <Container maxW="container.lg" py={8}>
            <VStack spacing={6} align="stretch">
                <Heading>Gerar Simulado Personalizado</Heading>
                <Text>Selecione o conteúdo das suas anotações que deseja usar como base para a IA gerar as questões.</Text>

                <FormControl>
                    <FormLabel fontWeight="bold">1. Escolha o conteúdo:</FormLabel>
                    <SimulationScopeSelector onSelectionChange={setSelection} />
                </FormControl>

                <FormControl>
                    <FormLabel fontWeight="bold">2. Escolha o número de questões:</FormLabel>
                    <NumberInput
                        value={questionCount}
                        onChange={(_, value) => setQuestionCount(value)}
                        min={3} max={20} w="150px"
                    >
                        <NumberInputField />
                    </NumberInput>
                </FormControl>

                <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    A qualidade do simulado depende da qualidade e quantidade do conteúdo nas suas anotações.
                </Alert>

                <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleStart}
                    isLoading={generateSimulation.isPending}
                >
                    Gerar Simulado com IA
                </Button>
            </VStack>
        </Container>
    );
}