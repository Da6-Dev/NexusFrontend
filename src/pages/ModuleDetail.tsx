import { useParams, Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Heading, Button, Spinner, Center, VStack, List, ListItem,
    Input, Flex, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Text,
    FormControl, FormErrorMessage
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FaLightbulb } from 'react-icons/fa';
import { EmptyState } from '../components/EmptyState';
import type { Topic } from '../types/Topic';
import type { Module } from '../types/Module';

// Funções de busca
const fetchModule = async (id: string) => {
    const { data } = await api.get(`/modules/${id}`);
    return data;
};

const fetchTopics = async (id: string) => {
    const { data } = await api.get(`/modules/${id}/topics`);
    return data;
};

interface FormData {
    newTopicName: string;
}

export function ModuleDetail() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();

    // Query para os detalhes do módulo
    const { data: module, isLoading: isLoadingModule } = useQuery<Module>({
        queryKey: ['module', id],
        queryFn: () => fetchModule(id!),
        enabled: !!id,
    });

    // Query para os tópicos do módulo
    const { data: topics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
        queryKey: ['topics', id],
        queryFn: () => fetchTopics(id!),
        enabled: !!id,
    });

    // Mutation para adicionar um novo tópico
    const mutation = useMutation({
        mutationFn: (newTopic: { name: string, moduleId: string }) => {
            return api.post('/topics', newTopic);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topics', id] });
            reset();
        },
    });

    const onTopicSubmit = (data: FormData) => {
        if (!id) return;
        mutation.mutate({ name: data.newTopicName, moduleId: id });
    };

    if (isLoadingModule || isLoadingTopics) {
        return <Center h="100%"><Spinner /></Center>;
    }

    if (!module) {
        return <Text>Módulo não encontrado.</Text>;
    }

    return (
        <VStack spacing="6" align="stretch">
            <Breadcrumb>
                <BreadcrumbItem>
                    <BreadcrumbLink as={RouterLink} to="/">Início</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                    <BreadcrumbLink as={RouterLink} to={`/disciplines/${module.disciplineId}`}>Disciplina</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink href="#">{module.name}</BreadcrumbLink>
                </BreadcrumbItem>
            </Breadcrumb>

            <Heading>Assuntos de {module.name}</Heading>

            {topics && topics.length > 0 ? (
                <List spacing={3}>
                    {topics.map(topic => (
                        <ListItem key={topic.id} p="3" borderWidth="1px" borderRadius="md" _hover={{ bg: 'gray.50' }}>
                            <RouterLink to={`/topics/${topic.id}`}>{topic.name}</RouterLink>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <EmptyState
                    icon={FaLightbulb}
                    title="Nenhum assunto cadastrado"
                    description="Adicione o primeiro assunto (tópico) para começar a criar anotações e flashcards."
                />
            )}


            <Box as="form" onSubmit={handleSubmit(onTopicSubmit)} mt="6" p="4" borderWidth="1px" borderRadius="md">
                <Heading as="h3" size="md" mb="4">Adicionar novo assunto</Heading>
                <Flex>
                    <FormControl isInvalid={!!errors.newTopicName}>
                        <Input
                            placeholder="Ex: Leis de Newton"
                            {...register('newTopicName', {
                                required: 'O nome do assunto é obrigatório.',
                                minLength: { value: 3, message: 'O nome deve ter no mínimo 3 caracteres.' }
                            })}
                        />
                        <FormErrorMessage>
                            {errors.newTopicName && errors.newTopicName.message}
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