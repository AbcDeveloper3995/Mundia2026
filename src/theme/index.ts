import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954', // Un verde vibrante y deportivo (ej. "cesped de estadio")
      contrastText: '#fff',
    },
    secondary: {
      main: '#FFB800', // Un tono dorado/amarillo premium (Copa del Mundo)
      contrastText: '#1a1a1a',
    },
    background: {
      default: '#0A0A0A', // Dark mode premium
      paper: '#141414',
    },
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1AA',
    },
    error: {
      main: '#EF4444',
    },
    success: {
      main: '#22C55E',
    },
  },
  typography: {
    fontFamily: '"Geist", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 14px 0 rgba(29, 185, 84, 0.39)', // Hover effects
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
});

export default theme;
