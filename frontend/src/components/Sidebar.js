import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Box
} from '@mui/material';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRight: '1px solid #2a2a2a',
    paddingTop: theme.spacing(2),
  },
}));

const IconBox = ({ letter }) => (
  <Box
    sx={{
      width: 30,
      height: 30,
      borderRadius: '50%',
      backgroundColor: 'primary.main',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
    }}
  >
    {letter}
  </Box>
);

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'D' },
  { label: 'Containers', path: '/containers', icon: 'C' },
  { label: 'Scheduler', path: '/scheduler', icon: 'S' },
  { label: 'Logs', path: '/logs', icon: 'L' },
  { label: 'Settings', path: '/settings', icon: 'S' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <StyledDrawer variant="permanent" anchor="left">
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" noWrap>
          MiniDocker
        </Typography>
      </Toolbar>
      <List>
        {navItems.map(({ label, path, icon }) => (
          <ListItemButton
            key={path}
            component={Link}
            to={path}
            selected={location.pathname === path}
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: '#fff',
              },
              '&:hover': {
                backgroundColor: 'primary.main',
                color: '#fff',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <IconBox letter={icon} />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </StyledDrawer>
  );
}

export default Sidebar;
