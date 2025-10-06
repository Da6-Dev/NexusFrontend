import { Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Box, Heading, Text, Button, Spinner, Center, VStack } from '@chakra-ui/react';

// A função de busca de dados agora é separada
const fetchDueCards = async () => {
    const response = await api.get('/study/due-cards');
    return response.data;
};

export function HomePage() {
    // Usando useQuery para buscar os dados
    const { data: dueCards, isLoading } = useQuery({
        queryKey: ['dueCards'], // Chave única para esta query
        queryFn: fetchDueCards, // Função que busca os dados
    });

    return (
        <Box>
            <Heading as="h2" size="lg" mb="6">
                Painel de Estudos
            </Heading>
            <Box p="6" borderWidth="1px" borderRadius="lg">
                <Heading as="h3" size="md" mb="4">
                    Revisões Pendentes
                </Heading>
                {isLoading ? (
                    <Center>
                        <Spinner />
                    </Center>
                ) : dueCards && dueCards.length > 0 ? (
                    <VStack spacing="4" align="start">
                        <Text>
                            Você tem <strong>{dueCards.length}</strong> flashcard(s) para revisar hoje.
                        </Text>
                        <Button as={RouterLink} to="/study" colorScheme="blue">
                            Iniciar Sessão de Estudo
                        </Button>
                    </VStack>
                ) : (
                    <Text>Nenhum card para revisar hoje. Continue assim!</Text>
                )}
            </Box>
        </Box>
    );
}