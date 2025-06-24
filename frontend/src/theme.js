import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({

  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3', // Bright blue for primary actions
      contrastText: '#fff',
    },
    secondary: {
      main: '#03dac6', // Teal-like secondary
    },
    background: {
      default: '#0D1117', // Dark navy blue background
      paper: '#161B22',   // Slightly lighter surface
    },
    text: {
      primary: '#E6EDF3',
      secondary: '#8B949E',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", sans-serif',
    button: {
      textTransform: 'none', // Prevent all caps on buttons
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16, // Rounded corners across components
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Round buttons
          paddingLeft: 16,
          paddingRight: 16,
        },
        containedPrimary: {
          backgroundColor: '#2979ff',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor: '#1F2937',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #30363D',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: '#2c3e50',
          },
          '&:hover': {
            backgroundColor: '#243447',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#1e1e2f',
        },
      },
    },
  },
});

export default darkTheme;
