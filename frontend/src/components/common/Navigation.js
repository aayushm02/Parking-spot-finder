import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  Notifications,
  AccountCircle,
  Dashboard,
  LocationOn,
  Add,
  Payment,
  History,
  Settings,
  Logout,
  AdminPanelSettings,
  Home,
  DirectionsCar
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
    handleProfileMenuClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const navigationItems = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'Search Spots', path: '/search', icon: <Search /> },
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'My Bookings', path: '/dashboard', icon: <History /> },
    { label: 'My Spots', path: '/my-spots', icon: <LocationOn />, roles: ['spot_owner', 'admin'] },
    { label: 'Add Spot', path: '/add-spot', icon: <Add />, roles: ['spot_owner', 'admin'] },
    { label: 'Payment', path: '/payment', icon: <Payment /> },
    { label: 'Profile', path: '/profile', icon: <AccountCircle /> },
  ];

  const adminItems = [
    { label: 'Admin Dashboard', path: '/admin', icon: <AdminPanelSettings /> },
  ];

  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="primary">
          ParkSpot Finder
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.name}
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {user?.role === 'admin' && (
          <>
            <Divider />
            {adminItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DirectionsCar sx={{ mr: 1 }} />
              ParkSpot Finder
            </Box>
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button 
                color="inherit" 
                onClick={() => handleNavigation('/')}
                startIcon={<Home />}
              >
                Home
              </Button>
              <Button 
                color="inherit" 
                onClick={() => handleNavigation('/search')}
                startIcon={<Search />}
              >
                Search
              </Button>
              <Button 
                color="inherit" 
                onClick={() => handleNavigation('/dashboard')}
                startIcon={<Dashboard />}
              >
                Dashboard
              </Button>
              {(user?.role === 'spot_owner' || user?.role === 'admin') && (
                <>
                  <Button 
                    color="inherit" 
                    onClick={() => handleNavigation('/my-spots')}
                    startIcon={<LocationOn />}
                  >
                    My Spots
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={() => handleNavigation('/add-spot')}
                    startIcon={<Add />}
                  >
                    Add Spot
                  </Button>
                </>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit">
              <Badge badgeContent={notificationCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                src={user?.avatar}
                sx={{ width: 32, height: 32 }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 250,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={() => handleNavigation('/profile')}>
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/payment')}>
          <ListItemIcon>
            <Payment />
          </ListItemIcon>
          <ListItemText>Payment</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/dashboard')}>
          <ListItemIcon>
            <History />
          </ListItemIcon>
          <ListItemText>My Bookings</ListItemText>
        </MenuItem>
        {user?.role === 'admin' && (
          <MenuItem onClick={() => handleNavigation('/admin')}>
            <ListItemIcon>
              <AdminPanelSettings />
            </ListItemIcon>
            <ListItemText>Admin Dashboard</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navigation;
