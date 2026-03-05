import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { theme } from './theme';
import { GlobalStyles } from './GlobalStyles';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <EmotionThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </EmotionThemeProvider>
  );
};
