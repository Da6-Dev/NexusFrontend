import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
    Box,
    Heading,
    SimpleGrid,
    Spinner,
    Stat,
    StatLabel,
    StatNumber,
    Text,
    VStack,
    Icon,
    Center,
} from '@chakra-ui/react';
import {
    FaBook,
    FaBoxes,
    FaLightbulb,
    FaStickyNote,
    FaCopy,
    FaClock,
    FaTasks, // Novo ícone
} from 'react-icons/fa';
import { GoalsTracker } from '../components/GoalsTracker'; // <-- IMPORTE O NOVO COMPONENTE

// Interface atualizada para os dados da API
interface DashboardStats {
    disciplineCount: number;
    moduleCount: number;
    topicCount: number;
    noteCount: number;
    flashcardCount: number;
    dueFlashcardsCount: number;
    flashcardsReviewedToday: number; // <-- NOVO CAMPO
}

// Função que busca os dados da API
const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const { data } = await api.get('/stats/dashboard');
    return data;
};

// ... (O componente StatCard continua igual)
function StatCard({ icon, label, value }: { icon: any; label: string; value: number }) {
    return (
        <Stat
            p="5"
            borderWidth="1px"
            borderRadius="lg"
            display="flex"
            alignItems="center"
        >
            <Icon as={icon} boxSize="8" color="blue.500" mr="4" />
            <Box>
                <StatLabel color="gray.500">{label}</StatLabel>
                <StatNumber>{value}</StatNumber>
            </Box>
        </Stat>
    );
}


export function DashboardPage() {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: fetchDashboardStats,
    });

    if (isLoading) {
        return <Center h="100%"><Spinner size="xl" /></Center>;
    }

    if (isError || !stats) {
        return <Text>Não foi possível carregar as estatísticas.</Text>;
    }

    return (
        <VStack spacing="8" align="stretch">
            <Heading as="h1" size="xl">
                Painel de Progresso
            </Heading>

            {/* Renderiza o novo componente de metas aqui */}
            <GoalsTracker stats={stats} />

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="6">
                <StatCard icon={FaBook} label="Disciplinas" value={stats.disciplineCount} />
                <StatCard icon={FaBoxes} label="Módulos" value={stats.moduleCount} />
                <StatCard icon={FaLightbulb} label="Assuntos" value={stats.topicCount} />
                <StatCard icon={FaStickyNote} label="Anotações" value={stats.noteCount} />
                <StatCard icon={FaCopy} label="Flashcards" value={stats.flashcardCount} />
                <StatCard icon={FaClock} label="Revisões Pendentes" value={stats.dueFlashcardsCount} />
                {/* Novo card para mostrar o progresso de hoje */}
                <StatCard icon={FaTasks} label="Flashcards Revisados Hoje" value={stats.flashcardsReviewedToday} />
            </SimpleGrid>
        </VStack>
    );
}