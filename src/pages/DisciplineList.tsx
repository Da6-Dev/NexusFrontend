import { Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
    Box, Heading, Button, Spinner, Center, VStack, List, ListItem,
    Input, Flex, Text, useToast
} from '@chakra-ui/react';
import type { Discipline } from '../types/Discipline';
import { useRef, useState } from 'react';

// Função de busca
const fetchDisciplines = async (): Promise<Discipline[]> => {
    const { data } = await api.get('/disciplines');
    return data;
};

interface FormData {
    newDisciplineName: string;
}

export function DisciplineList() {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm<FormData>();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Query para buscar as disciplinas
    const { data: disciplines, isLoading } = useQuery({
        queryKey: ['disciplines'],
        queryFn: fetchDisciplines,
    });

    // Mutation para adicionar nova disciplina
    const mutation = useMutation({
        mutationFn: (newDiscipline: { name: string }) => {
            return api.post('/disciplines', newDiscipline);
        },
        onSuccess: () => {
            // Invalida a query para buscar a lista atualizada
            queryClient.invalidateQueries({ queryKey: ['disciplines'] });
            reset();
        },
    });

    const onDisciplineSubmit = (data: FormData) => {
        if (!data.newDisciplineName.trim()) return;
        mutation.mutate({ name: data.newDisciplineName });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/data-portability/import/discipline', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast({
                title: 'Importação Concluída',
                description: 'A disciplina foi importada com sucesso.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            queryClient.invalidateQueries({ queryKey: ['disciplines'] });
        } catch (error: any) {
            toast({
                title: 'Erro na importação',
                description: error.response?.data?.message || 'Ocorreu um erro inesperado.',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (isLoading) {
        return <Center h="100%"><Spinner /></Center>;
    }

    return (
        <VStack spacing="6" align="stretch">
            <Flex justifyContent="space-between" alignItems="center">
                <Heading as="h2" size="lg">Minhas Disciplinas</Heading>
                <Box>
                    <Button onClick={handleImportClick} isLoading={isImporting} loadingText="Importando...">
                        Importar
                    </Button>
                    <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".json,application/json"
                    />
                </Box>
            </Flex>


            <Box as="form" onSubmit={handleSubmit(onDisciplineSubmit)} p="4" borderWidth="1px" borderRadius="md">
                <Flex>
                    <Input
                        placeholder="Nome da nova disciplina"
                        {...register('newDisciplineName', { required: true })}
                    />
                    <Button type="submit" ml="2" colorScheme="blue" isLoading={mutation.isPending}>
                        Adicionar
                    </Button>
                </Flex>
            </Box>

            <List spacing={3}>
                {disciplines?.map((discipline) => (
                    <ListItem key={discipline.id} p="3" borderWidth="1px" borderRadius="md" _hover={{ bg: 'gray.50' }}>
                        <RouterLink to={`/disciplines/${discipline.id}`}>
                            <Text fontSize="lg">{discipline.name}</Text>
                        </RouterLink>
                    </ListItem>
                ))}
            </List>
        </VStack>
    );
}