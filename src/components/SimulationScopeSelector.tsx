import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
    Box,
    VStack,
    Checkbox,
    Spinner,
    Center,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Flex,
} from '@chakra-ui/react'; // Removido 'Text' e 'useColorModeValue'
import { useState, useEffect } from 'react';

// --- Tipos de Dados ---
interface Node {
    id: string;
    name: string;
    modules?: Node[];
    topics?: Pick<Node, 'id' | 'name'>[];
}

interface Selection {
    disciplines: string[];
    modules: string[];
    topics: string[];
}

interface Props {
    onSelectionChange: (selection: Selection) => void;
}

// --- Funções da API ---
const fetchTree = async (): Promise<Node[]> => {
    const { data } = await api.get('/hierarchy/full-tree');
    return data;
};

export function SimulationScopeSelector({ onSelectionChange }: Props) {
    const { data: tree = [], isLoading } = useQuery({ queryKey: ['fullTreeForSimulation'], queryFn: fetchTree });
    const [selectedItems, setSelectedItems] = useState<Selection>({ disciplines: [], modules: [], topics: [] });

    // As variáveis 'bg' e 'hoverBg' foram removidas pois não estavam a ser usadas.

    useEffect(() => {
        onSelectionChange(selectedItems);
    }, [selectedItems, onSelectionChange]);

    const handleSelect = (type: keyof Selection, id: string) => {
        setSelectedItems(prev => {
            const currentSelection = prev[type];
            const newSelection = currentSelection.includes(id)
                ? currentSelection.filter(itemId => itemId !== id)
                : [...currentSelection, id];

            if (type === 'disciplines' && newSelection.length > 0) {
                return { disciplines: newSelection, modules: [], topics: [] };
            }
            if (type === 'modules' && newSelection.length > 0) {
                return { disciplines: [], modules: newSelection, topics: [] };
            }
            if (type === 'topics' && newSelection.length > 0) {
                return { disciplines: [], modules: [], topics: newSelection };
            }

            return { ...prev, [type]: newSelection };
        });
    };

    if (isLoading) {
        return <Center p={10}><Spinner /></Center>;
    }

    // O resto do componente JSX continua igual...
    return (
        <Box p={4} borderWidth="1px" borderRadius="lg" w="100%">
            <Accordion allowMultiple defaultIndex={[0]}>
                {tree.map(discipline => (
                    <AccordionItem key={discipline.id}>
                        <h2>
                            <AccordionButton>
                                <Flex flex="1" align="center">
                                    <Checkbox
                                        mr={3}
                                        isChecked={selectedItems.disciplines.includes(discipline.id)}
                                        onChange={() => handleSelect('disciplines', discipline.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Box flex="1" textAlign="left">{discipline.name}</Box>
                                </Flex>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={1}>
                                {discipline.modules?.map(module => (
                                    <AccordionItem key={module.id} border="none">
                                        <h3>
                                            <AccordionButton>
                                                <Flex flex="1" align="center">
                                                    <Checkbox
                                                        mr={3}
                                                        isChecked={selectedItems.modules.includes(module.id)}
                                                        onChange={() => handleSelect('modules', module.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <Box flex="1" textAlign="left">{module.name}</Box>
                                                </Flex>
                                                <AccordionIcon />
                                            </AccordionButton>
                                        </h3>
                                        <AccordionPanel pb={4} pl={8}>
                                            <VStack align="stretch">
                                                {module.topics?.map(topic => (
                                                    <Checkbox
                                                        key={topic.id}
                                                        isChecked={selectedItems.topics.includes(topic.id)}
                                                        onChange={() => handleSelect('topics', topic.id)}
                                                    >
                                                        {topic.name}
                                                    </Checkbox>
                                                ))}
                                            </VStack>
                                        </AccordionPanel>
                                    </AccordionItem>
                                ))}
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
        </Box>
    );
}