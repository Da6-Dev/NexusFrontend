import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    VStack,
    Box,
    useColorModeValue,
    Spinner,
    Center
} from '@chakra-ui/react';
import MDEditor from '@uiw/react-md-editor';

interface AiSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: string | null;
    isLoading: boolean;
}

export function AiSummaryModal({ isOpen, onClose, summary, isLoading }: AiSummaryModalProps) {
    const bg = useColorModeValue('gray.50', 'gray.700');

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Resumo Gerado por IA</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {isLoading ? (
                        <Center h="200px">
                            <VStack>
                                <Spinner />
                                <Text mt={3}>A IA está a processar o seu resumo...</Text>
                            </VStack>
                        </Center>
                    ) : (
                        summary && (
                            <Box p={4} bg={bg} borderRadius="md">
                                {/* Usamos o MDEditor.Markdown para renderizar o resumo formatado */}
                                <MDEditor.Markdown source={summary} style={{ whiteSpace: 'pre-wrap' }} />
                            </Box>
                        )
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" onClick={onClose}>
                        Fechar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}