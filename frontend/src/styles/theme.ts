export const theme = {
  colors: {
    // Primary - Blue palette
    primary: {
      main: '#0073EA',
      light: '#4A9FF5',
      lighter: '#E3F2FF',
      dark: '#0060C2',
      darker: '#004C9C',
    },
    
    // Neutral - White & Gray palette
    neutral: {
      white: '#FFFFFF',
      gray50: '#F8F9FA',
      gray100: '#F1F3F5',
      gray200: '#E9ECEF',
      gray300: '#DEE2E6',
      gray400: '#CED4DA',
      gray500: '#ADB5BD',
      gray600: '#6C757D',
      gray700: '#495057',
      gray800: '#343A40',
      gray900: '#212529',
      black: '#000000',
    },
    
    // Status colors
    status: {
      success: '#00C875',
      warning: '#FDAB3D',
      error: '#E44258',
      info: '#0073EA',
    },
    
    // Priority colors
    priority: {
      low: '#579BFC',
      medium: '#FDAB3D',
      high: '#FF6B6B',
      critical: '#E44258',
    },
    
    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F1F3F5',
      hover: '#E3F2FF',
    },
    
    // Border colors
    border: {
      light: '#E9ECEF',
      main: '#DEE2E6',
      dark: '#CED4DA',
    },
    
    // Text colors
    text: {
      primary: '#212529',
      secondary: '#6C757D',
      tertiary: '#ADB5BD',
      inverse: '#FFFFFF',
      link: '#0073EA',
    },
  },
  
  // Typography with Figtree font
  typography: {
    fontFamily: "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: {
      xs: '0.6875rem',    // 11px - Extra small
      sm: '0.8125rem',    // 13px - Small (base size)
      base: '0.875rem',   // 14px - Base
      md: '0.9375rem',    // 15px - Medium
      lg: '1rem',         // 16px - Large
      xl: '1.125rem',     // 18px - Extra large
      '2xl': '1.25rem',   // 20px
      '3xl': '1.5rem',    // 24px
      '4xl': '1.875rem',  // 30px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing scale
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  
  // Breakpoints
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },
};

export type Theme = typeof theme;
