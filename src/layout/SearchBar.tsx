import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Box, Input, List, ListItem, Text, VStack } from '@chakra-ui/react';

// Hook customizado para "atrasar" a busca (debounce)
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface SearchResult {
    type: string;
    label: string;
    path: string;
}

export function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const debouncedQuery = useDebounce(query, 500); // Atraso de 500ms

    useEffect(() => {
        if (debouncedQuery.length > 1) {
            api.get(`/search/results?q=${debouncedQuery}`).then(response => {
                setResults(response.data);
            });
        } else {
            setResults([]);
        }
    }, [debouncedQuery]);

    const closeResults = () => {
        // Um pequeno atraso para permitir o clique no link antes de fechar
        setTimeout(() => setIsFocused(false), 150);
    };

    return (
        <Box position="relative">
            <Input
                placeholder="Buscar em tudo..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={closeResults}
            />
            {isFocused && results.length > 0 && (
                <Box
                    position="absolute"
                    top="100%"
                    left="0"
                    right="0"
                    zIndex="100"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    mt="1"
                    boxShadow="lg"
                    maxH="400px"
                    overflowY="auto"
                >
                    <List spacing={1} p="2">
                        {results.map((result, index) => (
                            <ListItem key={index} _hover={{ bg: 'gray.100' }} borderRadius="md">
                                <Link to={result.path}>
                                    <VStack align="start" p="2" spacing="0">
                                        <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                                            {result.type}
                                        </Text>
                                        <Text fontSize="sm">{result.label}</Text>
                                    </VStack>
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Box>
    );
}