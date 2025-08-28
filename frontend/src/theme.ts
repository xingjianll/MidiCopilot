export const theme = {
  colors: {
    background: '#0a0a0a',
    surface: 'rgba(25, 25, 28, 0.95)',
    surfaceHover: 'rgba(35, 35, 38, 0.98)',
    surfaceActive: 'rgba(45, 45, 48, 1)',
    border: 'none',
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
    },
    accent: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    glass: {
      backdrop: 'rgba(0, 0, 0, 0.5)',
      surface: 'rgba(25, 25, 28, 0.9)',
      border: 'none',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0',
    md: '0',
    lg: '0',
    xl: '0',
  },
  blur: {
    sm: 'blur(8px)',
    md: 'blur(16px)',
    lg: 'blur(24px)',
  },
  animation: {
    fast: '0.15s ease-out',
    normal: '0.25s ease-out',
    slow: '0.35s ease-out',
  }
} as const;

export type Theme = typeof theme;