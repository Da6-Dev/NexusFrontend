import { useParams, Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Heading, Text, Button, Spinner, Center, VStack, List, ListItem,
    Input, Flex, Breadcrumb, BreadcrumbItem, BreadcrumbLink, FormControl, FormErrorMessage, useToast
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FaBoxes, FaDownload } from 'react-icons/fa'; // Importar um ícone
import { EmptyState } from '../components/EmptyState'; // Importar o novo componente
import type { Discipline } from '../types/Discipline';
import type { Module } from '../types/Module';
import { useState } from 'react';

// Funções de busca de dados
const fetchDiscipline = async (id: string) => {
    const { data } = await api.get(`/disciplines/${id}`);
    return data;
};

const fetchModules = async (id: string) => {
    const { data } = await api.get(`/disciplines/${id}/modules`);
    return data;
};

interface FormData {
    newModuleName: string;
}

export function DisciplineDetail() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();
    const toast = useToast();
    const [isExporting, setIsExporting] = useState(false);

    // Query para os detalhes da disciplina
    const { data: discipline, isLoading: isLoadingDiscipline } = useQuery<Discipline>({
        queryKey: ['discipline', id],
        queryFn: () => fetchDiscipline(id!),
        enabled: !!id,
    });

    // Query para os módulos da disciplina
    const { data: modules, isLoading: isLoadingModules } = useQuery<Module[]>({
        queryKey: ['modules', id],
        queryFn: () => fetchModules(id!),
        enabled: !!id,
    });

    // Mutation para adicionar um novo módulo
    const mutation = useMutation({
        mutationFn: (newModule: { name: string, disciplineId: string }) => {
            return api.post('/modules', newModule);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules', id] });
            reset();
        },
    });

    const onModuleSubmit = (data: FormData) => {
        if (!id) return;
        mutation.mutate({ name: data.newModuleName, disciplineId: id });
    };

    const handleExport = async () => {
        if (!id) return;
        setIsExporting(true);
        try {
            const { data } = await api.get(`/data-portability/export/discipline/${id}`);

            // Converte o objeto JSON em uma string formatada
            const jsonString = JSON.stringify(data, null, 2);

            // Cria um "Blob", que é um objeto de arquivo na memória
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Cria uma URL temporária para o Blob
            const url = URL.createObjectURL(blob);

            // Cria um link invisível, clica nele para iniciar o download e o remove
            const link = document.createElement('a');
            link.href = url;
            const fileName = `${data.name.replace(/\s+/g, '_').toLowerCase()}_export.json`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Libera a URL da memória
            URL.revokeObjectURL(url);

            toast({
                title: "Exportação iniciada!",
                description: `O arquivo ${fileName} foi baixado.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

        } catch (error: any) { // Adicionamos ': any' para acessar as propriedades do erro
            console.error("Erro detalhado ao exportar disciplina:", error);

            // Pega a mensagem de erro específica vinda do backend, se existir
            const errorMessage = error.response?.data?.message || "Não foi possível obter detalhes do erro do servidor.";

            toast({
                title: "Erro na Exportação (400 Bad Request)",
                // Exibe a mensagem de erro detalhada na notificação
                description: `Detalhe: ${JSON.stringify(errorMessage)}`,
                status: "error",
                duration: 9000, // Aumenta a duração para dar tempo de ler
                isClosable: true,
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoadingDiscipline || isLoadingModules) {
        return <Center h="100%"><Spinner /></Center>;
    }

    if (!discipline) {
        return <Text>Disciplina não encontrada.</Text>;
    }

    return (
        <VStack spacing="6" align="stretch">
            <Breadcrumb>
                <BreadcrumbItem>
                    <BreadcrumbLink as={RouterLink} to="/">Início</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink href="#">{discipline.name}</BreadcrumbLink>
                </BreadcrumbItem>
            </Breadcrumb>

            <Flex justify="space-between" align="center">
                <Heading>{discipline.name}</Heading>
                <Button
                    leftIcon={<FaDownload />}
                    colorScheme="teal"
                    onClick={handleExport}
                    isLoading={isExporting}
                >
                    Exportar
                </Button>
            </Flex>

            {modules && modules.length > 0 ? (
                <>
                    <Text>Módulos da disciplina:</Text>
                    <List spacing={3}>
                        {modules.map(module => (
                            <ListItem key={module.id} p="3" borderWidth="1px" borderRadius="md" _hover={{ bg: 'gray.50' }}>
                                <RouterLink to={`/modules/${module.id}`}>{module.name}</RouterLink>
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : (
                <EmptyState
                    icon={FaBoxes}
                    title="Nenhum módulo encontrado"
                    description="Comece a organizar seus estudos adicionando o primeiro módulo a esta disciplina."
                />
            )}


            <Box as="form" onSubmit={handleSubmit(onModuleSubmit)} mt="6" p="4" borderWidth="1px" borderRadius="md">
                <Heading as="h3" size="md" mb="4">Adicionar novo módulo</Heading>
                <Flex>
                    <FormControl isInvalid={!!errors.newModuleName}>
                        <Input
                            placeholder="Nome do módulo"
                            {...register('newModuleName', {
                                required: 'O nome do módulo é obrigatório.',
                                minLength: { value: 3, message: 'O nome deve ter no mínimo 3 caracteres.' }
                            })}
                        />
                        <FormErrorMessage>
                            {errors.newModuleName && errors.newModuleName.message}
                        </FormErrorMessage>
                    </FormControl>
                    <Button type="submit" ml="2" colorScheme="blue" isLoading={isSubmitting || mutation.isPending}>
                        Adicionar
                    </Button>
                </Flex>
            </Box>
        </VStack>
    );
}