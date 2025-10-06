import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
    Box,
    Text,
    Heading,
    VStack,
    Progress,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    FormControl,
    FormLabel,
    useToast,
    Flex,
    Icon
} from '@chakra-ui/react';
import { FaBullseye } from 'react-icons/fa';

// --- Tipos de Dados ---
interface Goal {
    type: string;
    target: number;
}

interface DashboardStats {
    flashcardsReviewedToday: number;
    // Adicione outras estatísticas aqui conforme necessário
}

// --- Funções da API ---
const fetchGoals = async (): Promise<Goal[]> => {
    const { data } = await api.get('/goals');
    return data;
};

export function GoalsTracker({ stats }: { stats: DashboardStats }) {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [target, setTarget] = useState(20); // Valor inicial para o input

    const { data: goals = [] } = useQuery({
        queryKey: ['goals'],
        queryFn: fetchGoals,
    });

    const mutation = useMutation({
        mutationFn: (newGoal: { type: string; target: number }) => {
            return api.post('/goals', newGoal);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            toast({
                title: 'Meta salva!',
                description: 'A sua meta de estudos foi atualizada.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onClose();
        },
        onError: () => {
            toast({
                title: 'Ocorreu um erro.',
                description: 'Não foi possível salvar a sua meta.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    });

    const handleSaveGoal = () => {
        // Por agora, estamos a lidar apenas com a meta de flashcards diários
        mutation.mutate({ type: 'daily_flashcards', target });
    };

    // Encontra a meta específica de flashcards diários
    const flashcardGoal = goals.find(g => g.type === 'daily_flashcards');
    const currentProgress = stats.flashcardsReviewedToday || 0;
    const goalTarget = flashcardGoal?.target || 0;
    const progressPercent = goalTarget > 0 ? (currentProgress / goalTarget) * 100 : 0;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Definir Meta Diária</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl>
                            <FormLabel htmlFor='daily-flashcards-target'>
                                Quantos flashcards quer revisar por dia?
                            </FormLabel>
                            <NumberInput
                                id='daily-flashcards-target'
                                value={target}
                                onChange={(_, valueAsNumber) => setTarget(valueAsNumber)}
                                min={1}
                                max={200}
                                step={5}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button colorScheme="blue" onClick={handleSaveGoal} isLoading={mutation.isPending}>
                            Salvar Meta
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Box p="6" borderWidth="1px" borderRadius="lg">
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading as="h3" size="md">
                        Meta de Hoje
                    </Heading>
                    <Button size="sm" onClick={onOpen}>
                        Definir Meta
                    </Button>
                </Flex>
                {flashcardGoal ? (
                    <VStack spacing={3} align="stretch">
                        <Text fontWeight="bold">Revisar Flashcards Diariamente</Text>
                        <Progress
                            value={progressPercent}
                            size="lg"
                            colorScheme={progressPercent >= 100 ? 'green' : 'blue'}
                            hasStripe={progressPercent < 100}
                            isAnimated={progressPercent < 100}
                            borderRadius="md"
                        />
                        <Text textAlign="right" color="gray.500" fontSize="sm">
                            {currentProgress} / {goalTarget}
                        </Text>
                    </VStack>
                ) : (
                    <VStack align="center" p={4} bg="gray.50" borderRadius="md">
                        <Icon as={FaBullseye} boxSize={8} color="gray.400" />
                        <Text color="gray.600">Nenhuma meta definida ainda.</Text>
                        <Button size="sm" variant="link" colorScheme="blue" onClick={onOpen}>
                            Clique aqui para definir a sua primeira meta!
                        </Button>
                    </VStack>
                )}
            </Box>
        </>
    );
}