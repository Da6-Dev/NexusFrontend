import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import theme from './theme'; // <-- 1. IMPORTE O TEMA
import './index.css';

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* 2. Adicione o ColorModeScript para persistir a cor entre recarregamentos */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        {/* 3. Passe o tema para o ChakraProvider */}
        <ChakraProvider theme={theme}>
          <App />
        </ChakraProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);