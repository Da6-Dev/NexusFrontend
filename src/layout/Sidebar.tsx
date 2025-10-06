import { useRef, useState } from 'react'; // <-- Removido useEffect
import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FaPlus, FaEllipsisH, FaAngleRight, FaAngleDown, FaChartBar, FaBookOpen, FaPencilAlt } from 'react-icons/fa';
import { SearchBar } from './SearchBar';
import {
    Box, Flex, Text, IconButton, VStack, Collapse, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, Input, useToast, Menu, MenuButton, MenuList, MenuItem, Divider, Icon
} from '@chakra-ui/react';

// --- Tipagem ---
interface Node {
    id: string;
    name: string;
    modules?: Node[];
    topics?: Pick<Node, 'id' | 'name'>[];
}
type ActionType = 'create-discipline' | 'create-module' | 'create-topic' | 'rename' | 'delete';
interface ModalState {
    action: ActionType | null;
    type: 'discipline' | 'module' | 'topic' | null;
    node?: Node;
}
interface FormData {
    name: string;
}

// --- Funções de API ---
const fetchTree = async (): Promise<Node[]> => {
    const { data } = await api.get('/hierarchy/full-tree');
    return data;
};

// --- Componente TreeNode ---
function TreeNode({ node, type, onAction }: { node: Node; type: 'discipline' | 'module' | 'topic'; onAction: (state: ModalState) => void; }) {
    const { isOpen, onToggle } = useDisclosure();
    const children = node.modules || node.topics;
    const hasChildren = children && children.length > 0;
    const path = `/${type}s/${node.id}`;

    return (
        <Box w="100%">
            <Flex
                align="center"
                p="1"
                borderRadius="md"
                _hover={{ bg: 'gray.200' }}
                role="group"
            >
                <Flex align="center" flex="1" minW="0">
                    <IconButton
                        icon={isOpen ? <FaAngleDown /> : <FaAngleRight />}
                        variant="ghost"
                        size="xs"
                        aria-label="Toggle children"
                        onClick={onToggle}
                        visibility={hasChildren ? 'visible' : 'hidden'}
                    />
                    <NavLink to={path} style={{ flex: 1 }}>
                        <Text isTruncated>{node.name}</Text>
                    </NavLink>
                </Flex>

                {/* INÍCIO DA CORREÇÃO */}
                <Menu isLazy placement="bottom-end">
                    {({ isOpen: isMenuOpen }) => (
                        <>
                            <Flex
                                // A condição "isMenuOpen" mantém os botões visíveis quando o menu está aberto
                                display={isMenuOpen ? 'flex' : 'none'}
                                _groupHover={{ display: 'flex' }}
                                alignItems="center"
                            >
                                {type !== 'topic' && (
                                    <IconButton
                                        size="xs"
                                        aria-label="Add child"
                                        icon={<FaPlus />}
                                        onClick={() => onAction({ action: type === 'discipline' ? 'create-module' : 'create-topic', type: type === 'discipline' ? 'module' : 'topic', node })}
                                    />
                                )}
                                <MenuButton
                                    as={IconButton}
                                    size="xs"
                                    variant="ghost"
                                    icon={<FaEllipsisH />}
                                />
                            </Flex>

                            <MenuList zIndex="10">
                                <MenuItem onClick={() => onAction({ action: 'rename', type, node })}>
                                    Renomear
                                </MenuItem>
                                <MenuItem color="red.500" onClick={() => onAction({ action: 'delete', type, node })}>
                                    Excluir
                                </MenuItem>
                            </MenuList>
                        </>
                    )}
                </Menu>
                {/* FIM DA CORREÇÃO */}

            </Flex>
            {hasChildren && (
                <Collapse in={isOpen}>
                    <VStack pl="4" align="stretch" spacing="0">
                        {children.map((childNode: any) => (
                            <TreeNode
                                key={childNode.id}
                                node={childNode}
                                type={type === 'discipline' ? 'module' : 'topic'}
                                onAction={onAction}
                            />
                        ))}
                    </VStack>
                </Collapse>
            )}
        </Box>
    );
}

// --- Componente Principal da Sidebar ---
export function Sidebar() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [modalState, setModalState] = useState<ModalState>({ action: null, type: null });
    const { register, handleSubmit, setValue, reset } = useForm<FormData>();
    const initialRef = useRef(null);

    const { data: tree = [] } = useQuery({ queryKey: ['tree'], queryFn: fetchTree });

    const mutation = useMutation({
        mutationFn: async ({ action, type, node, name }: ModalState & { name?: string }) => {
            switch (action) {
                case 'create-discipline':
                    return api.post('/disciplines', { name });
                case 'create-module':
                    return api.post('/modules', { name, disciplineId: node!.id });
                case 'create-topic':
                    return api.post('/topics', { name, moduleId: node!.id });
                case 'rename':
                    return api.patch(`/${type}s/${node!.id}`, { name });
                case 'delete':
                    return api.delete(`/${type}s/${node!.id}`);
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tree'] });
            toast({
                title: `Sucesso!`,
                description: `O item foi ${variables.action === 'delete' ? 'excluído' : 'salvo'}.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            if (variables.action === 'delete') {
                navigate('/');
            }
            handleClose();
        },
        onError: (error: any) => {
            toast({
                title: 'Ocorreu um erro.',
                description: `Não foi possível completar a ação. ${error.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    });

    const handleAction = (state: ModalState) => {
        setModalState(state);
        if (state.action === 'rename' && state.node) {
            setValue('name', state.node.name);
        }
        onOpen();
    };

    const handleClose = () => {
        reset({ name: '' });
        setModalState({ action: null, type: null });
        onClose();
    };

    const onSubmit = (data: FormData) => {
        mutation.mutate({ ...modalState, name: data.name });
    };

    const onDeleteConfirm = () => {
        mutation.mutate(modalState);
    };

    // CORREÇÃO 1: Garante que o modalTitle só seja calculado com uma ação válida.
    const getModalTitle = () => {
        if (!modalState.action) return '';
        const titles = {
            'create-discipline': 'Criar Nova Disciplina',
            'create-module': `Adicionar Módulo em "${modalState.node?.name}"`,
            'create-topic': `Adicionar Assunto em "${modalState.node?.name}"`,
            'rename': `Renomear "${modalState.node?.name}"`,
            'delete': `Excluir "${modalState.node?.name}"`,
        };
        return titles[modalState.action];
    };

    const isDelete = modalState.action === 'delete';

    // CORREÇÃO 2: Separa a ref do react-hook-form para combinar com a do Chakra
    const { ref: formRef, ...nameRegister } = register('name', { required: true });

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} initialFocusRef={initialRef} isCentered>
                <ModalOverlay />
                <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader>{getModalTitle()}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {isDelete ? (
                            <Text>Tem certeza? Todo o conteúdo dentro de "<strong>{modalState.node?.name}</strong>" será perdido permanentemente.</Text>
                        ) : (
                            <FormControl isRequired>
                                <FormLabel>Nome</FormLabel>
                                <Input
                                    {...nameRegister}
                                    ref={(e) => {
                                        formRef(e);
                                        (initialRef as any).current = e;
                                    }}
                                    placeholder="Digite o nome..."
                                />
                            </FormControl>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={handleClose}>Cancelar</Button>
                        {isDelete ? (
                            <Button colorScheme="red" onClick={onDeleteConfirm} isLoading={mutation.isPending}>Excluir</Button>
                        ) : (
                            <Button colorScheme="blue" type="submit" isLoading={mutation.isPending}>Salvar</Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <VStack align="stretch" spacing="4">
                <SearchBar />

                <VStack align="stretch" spacing="1">
                    <NavLink to="/dashboard">
                        <Flex align="center" p="2" borderRadius="md" _hover={{ bg: 'gray.200' }}>
                            <Icon as={FaChartBar} mr="3" />
                            <Text fontWeight="bold">Painel de Progresso</Text>
                        </Flex>
                    </NavLink>
                    <NavLink to="/simulations">
                        <Flex align="center" p="2" borderRadius="md" _hover={{ bg: 'gray.200' }}>
                            <Icon as={FaPencilAlt} mr="3" />
                            <Text fontWeight="bold">Simulados</Text>
                        </Flex>
                    </NavLink>
                </VStack>
                <Divider />
                <Flex justify="space-between" align="center">
                    <NavLink to="/disciplines"> {/* <-- 3. Adicione este NavLink */}
                        <Flex align="center" p="2" borderRadius="md" _hover={{ bg: 'gray.200' }}>
                            <Icon as={FaBookOpen} mr="3" />
                            <Text fontWeight="bold">Minhas Disciplinas</Text>
                        </Flex>
                    </NavLink>
                    <IconButton
                        icon={<FaPlus />}
                        size="sm"
                        aria-label="Adicionar Nova Disciplina"
                        onClick={() => handleAction({ action: 'create-discipline', type: 'discipline' })}
                    />
                </Flex>
                <VStack align="stretch" spacing="1">
                    {tree.map(discipline => (
                        <TreeNode
                            key={discipline.id}
                            node={discipline}
                            type="discipline"
                            onAction={handleAction}
                        />
                    ))}
                </VStack>
            </VStack>
        </>
    );
}