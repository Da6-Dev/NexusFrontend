import { useState } from 'react';
import { Box, Text, Flex, IconButton, useColorModeValue } from '@chakra-ui/react';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Flashcard {
    id: string;
    front: string;
    back: string;
}

interface FlashcardItemProps {
    flashcard: Flashcard;
    onDelete: (id: string) => void;
    onEdit: (flashcard: Flashcard) => void;
}

export function FlashcardItem({ flashcard, onDelete, onEdit }: FlashcardItemProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const bg = useColorModeValue('white', 'gray.700');

    const CardFace = ({ content, ...props }: any) => (
        <Flex
            position="absolute"
            w="100%"
            h="100%"
            sx={{ backfaceVisibility: 'hidden' }}
            p={4}
            bg={bg}
            borderWidth="1px"
            borderRadius="md"
            textAlign="center"
            fontSize="sm"
            align="center"
            justify="center"
            {...props}
        >
            <Text>{content}</Text>
        </Flex>
    );

    return (
        <Box
            w="100%"
            h="120px"
            sx={{ perspective: '1000px' }}
            position="relative"
        >
            <motion.div
                style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <CardFace content={flashcard.front} />
                <CardFace content={flashcard.back} transform="rotateY(180deg)" />
            </motion.div>

            <Flex position="absolute" top={1} right={1} zIndex={10}>
                <IconButton
                    aria-label="Editar flashcard"
                    icon={<FaPencilAlt />}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onEdit(flashcard); }}
                />
                <IconButton
                    aria-label="Excluir flashcard"
                    icon={<FaTrash />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => { e.stopPropagation(); onDelete(flashcard.id); }}
                />
            </Flex>
        </Box>
    );
}