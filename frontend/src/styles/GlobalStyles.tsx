import { Global, css } from '@emotion/react';
import { theme } from './theme';

export const GlobalStyles = () => (
  <Global
    styles={css`
      /* Import Figtree font from Google Fonts */
      @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap');

      /* CSS Reset */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html {
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: ${theme.typography.fontFamily};
        font-size: ${theme.typography.fontSize.sm};
        font-weight: ${theme.typography.fontWeight.regular};
        line-height: ${theme.typography.lineHeight.normal};
        color: ${theme.colors.text.primary};
        background-color: ${theme.colors.background.secondary};
        overflow-x: hidden;
      }

      /* Scrollbar styling */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: ${theme.colors.neutral.gray100};
      }

      ::-webkit-scrollbar-thumb {
        background: ${theme.colors.neutral.gray400};
        border-radius: ${theme.borderRadius.full};
      }

      ::-webkit-scrollbar-thumb:hover {
        background: ${theme.colors.neutral.gray500};
      }

      /* Focus styles */
      *:focus-visible {
        outline: 2px solid ${theme.colors.primary.main};
        outline-offset: 2px;
      }

      /* Button reset */
      button {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        cursor: pointer;
        border: none;
        background: none;
      }

      /* Input reset */
      input, textarea, select {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
      }

      /* Link reset */
      a {
        color: inherit;
        text-decoration: none;
      }

      /* List reset */
      ul, ol {
        list-style: none;
      }

      /* Image reset */
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      /* Selection color */
      ::selection {
        background-color: ${theme.colors.primary.lighter};
        color: ${theme.colors.text.primary};
      }
    `}
  />
);
