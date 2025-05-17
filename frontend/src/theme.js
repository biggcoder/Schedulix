import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90CAF9',
    },
    secondary: {
      main: '#F48FB1',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E', // Using 'paper' for surface color in Material-UI
    },
    text: {
      primary: '#FFFFFF', // White text on dark background
      secondary: '#B0B0B0', // Lighter gray for secondary text
    },
  },
  typography: {
    // Customize typography if needed
  },
  components: {
    // Customize component styles if needed
  },
});

export default darkTheme;