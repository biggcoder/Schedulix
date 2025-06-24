import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import darkTheme from './theme';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Containers from './pages/Containers';
import Scheduler from './pages/Scheduler';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      {/* Ensures background/text colors from theme are applied globally */}
      <CssBaseline />

      <BrowserRouter>
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              marginLeft: '240px',
              bgcolor: 'background.default',
              color: 'text.primary',
              minHeight: '100vh',
              p: 3, // adds spacing inside
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/containers" element={<Containers />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
