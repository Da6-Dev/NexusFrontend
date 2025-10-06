import { useState, useEffect } from 'react';
import { Box, Button, Text, VStack, Grid, Center, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { Flashcard } from '../types/Flashcard';

interface FlashcardPlayerProps {
  flashcard: Flashcard; // 1. Recebe um único flashcard
  onReviewed: (performanceRating: number) => void; // 2. Recebe a função de callback
}

const FlashcardFace = ({ content, ...props }: any) => (
    <Center
        position="absolute"
        w="100%"
        h="100%"
        sx={{ backfaceVisibility: 'hidden' }}
        p="6"
        bg={useColorModeValue('white', 'gray.700')}
        borderWidth="1px"
        borderRadius="lg"
        textAlign="center"
        fontSize="xl"
        {...props}
    >
        {content}
    </Center>
);

export function FlashcardPlayer({ flashcard, onReviewed }: FlashcardPlayerProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // 3. Reseta o estado 'flipped' sempre que um novo card for recebido
    useEffect(() => {
        setIsFlipped(false);
    }, [flashcard]);

    // 4. A função de revisão agora apenas chama o callback
    const handleReview = (performanceRating: number) => {
        // Atraso para o usuário ver a animação de virar antes de avançar
        setTimeout(() => {
            onReviewed(performanceRating);
        }, 300);
    };

    if (!flashcard) {
        return <Text>Carregando card...</Text>;
    }

    return (
        <VStack spacing="4" align="stretch" w="100%" maxW="500px" mx="auto">
            <Box
                h="250px"
                w="100%"
                onClick={() => setIsFlipped(!isFlipped)}
                cursor="pointer"
                sx={{ perspective: '1000px' }}
            >
                <motion.div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d'
                    }}
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <FlashcardFace content={flashcard.front} />
                    <FlashcardFace content={flashcard.back} transform="rotateY(180deg)" />
                </motion.div>
            </Box>

            <Grid
                templateColumns="repeat(3, 1fr)"
                gap={4}
                visibility={isFlipped ? 'visible' : 'hidden'}
                transition="visibility 0.2s"
            >
                <Button colorScheme="red" onClick={() => handleReview(0)}>Errei</Button>
                <Button colorScheme="green" onClick={() => handleReview(4)}>Bom</Button>
                <Button colorScheme="blue" onClick={() => handleReview(5)}>Fácil</Button>
            </Grid>
        </VStack>
    );
}