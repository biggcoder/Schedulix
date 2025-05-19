import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import darkTheme from './theme';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Containers from './pages/Containers';
import Scheduler from './pages/Scheduler';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Box from '@mui/material/Box';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <BrowserRouter>
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              marginLeft: '240px', // Same as drawer width
              bgcolor: 'background.default',
              minHeight: '100vh'
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