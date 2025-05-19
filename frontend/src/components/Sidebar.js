import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
// Let's use Box with text instead of icons for now
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  },
}));

// Create simple icon placeholders using Box with text
const IconBox = ({ letter }) => (
  <Box 
    sx={{ 
      width: 24, 
      height: 24, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'primary.main',
      borderRadius: '4px'
    }}
  >
    <Typography variant="body2">{letter}</Typography>
  </Box>
);

function Sidebar() {
  return (
    <StyledDrawer
      variant="permanent"
      anchor="left"
    >
      <List>
        <ListItem button component={Link} to="/">
          <ListItemIcon>
            <IconBox letter="D" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/containers">
          <ListItemIcon>
            <IconBox letter="C" />
          </ListItemIcon>
          <ListItemText primary="Containers" />
        </ListItem>
        <ListItem button component={Link} to="/scheduler">
          <ListItemIcon>
            <IconBox letter="S" />
          </ListItemIcon>
          <ListItemText primary="Scheduler" />
        </ListItem>
        <ListItem button component={Link} to="/logs">
          <ListItemIcon>
            <IconBox letter="L" />
          </ListItemIcon>
          <ListItemText primary="Logs" />
        </ListItem>
        <ListItem button component={Link} to="/settings">
          <ListItemIcon>
            <IconBox letter="S" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </StyledDrawer>
  );
}

export default Sidebar;