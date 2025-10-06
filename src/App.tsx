import { Routes, Route, Outlet } from 'react-router-dom';
import { Box, Flex, useColorMode, IconButton } from '@chakra-ui/react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { Sidebar } from './layout/Sidebar';
import { HomePage } from './pages/HomePage';
import { DisciplineDetail } from './pages/DisciplineDetail';
import { ModuleDetail } from './pages/ModuleDetail';
import { TopicDetail } from './pages/TopicDetail';
import { StudyPage } from './pages/StudyPage';
import { DashboardPage } from './pages/DashboardPage';
import { DisciplineList } from './pages/DisciplineList';
import { SimulationPage } from './pages/SimulationPage';

// Componente para o botão de troca de tema
function ThemeToggleButton() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Toggle theme"
      icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
      onClick={toggleColorMode}
      variant="ghost"
    />
  );
}

// Layout principal com o botão de tema
function AppLayout() {
  return (
    <Flex h="100vh">
      <Box
        as="aside"
        w="280px"
        p="4"
        borderRight="1px"
        borderColor="gray.200"
        overflowY="auto"
        // Adapta o fundo da sidebar para o tema escuro
        bg={useColorMode().colorMode === 'light' ? 'gray.50' : 'gray.800'}
      >
        <Sidebar />
      </Box>
      <Flex as="main" flex="1" direction="column" overflowY="auto">
        {/* Header do conteúdo principal */}
        <Flex
          justify="flex-end"
          p="2"
          borderBottom="1px"
          borderColor="gray.200"
        >
          <ThemeToggleButton />
        </Flex>
        {/* Conteúdo da página */}
        <Box p="6" flex="1">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="disciplines" element={<DisciplineList />} />
        <Route path="disciplines/:id" element={<DisciplineDetail />} />
        <Route path="modules/:id" element={<ModuleDetail />} />
        <Route path="topics/:id" element={<TopicDetail />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="Simulations" element={<SimulationPage />} />
      </Route>
    </Routes>
  );
}

export default App;