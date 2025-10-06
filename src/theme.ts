import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// 1. Defina a configuração do seu tema
const config: ThemeConfig = {
  initialColorMode: 'light', // Pode ser 'light', 'dark' ou 'system'
  useSystemColorMode: false, // Define se o tema inicial deve seguir o do sistema operacional
};

// 2. Estenda o tema para incluir sua configuração customizada
const theme = extendTheme({ config });

export default theme;