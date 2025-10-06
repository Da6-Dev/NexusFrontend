import { Box, VStack, Text, Heading, Icon } from '@chakra-ui/react';
import { type IconType } from 'react-icons';

interface EmptyStateProps {
    icon: IconType;
    title: string;
    description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
    return (
        <Box p="8" bg="gray.50" borderRadius="md" textAlign="center">
            <VStack spacing="4">
                <Icon as={icon} boxSize="8" color="gray.400" />
                <Heading as="h4" size="md" color="gray.700">
                    {title}
                </Heading>
                <Text color="gray.500">{description}</Text>
            </VStack>
        </Box>
    );
}