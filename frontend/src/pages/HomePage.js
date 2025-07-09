import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Fab,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Search,
  LocationOn,
  MyLocation,
  FilterList,
  Notifications,
  AccountCircle,
  DirectionsCar,
  Add,
  Dashboard,
  ExitToApp,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MapComponent from '../components/map/MapComponent';
import SearchFilters from '../components/search/SearchFilters';
import ParkingSpotCard from '../components/spots/ParkingSpotCard';
import LocationModal from '../components/common/LocationModal';
import { spotsService } from '../services/spotsService';
import { useQuery } from 'react-query';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: '',
    vehicleType: '',
    features: [],
    radius: 5,
  });
  const [anchorEl, setAnchorEl] = useState(null);
  
  const { user, logout } = useAuth();
  const { joinLocationRoom, leaveLocationRoom } = useSocket();
  const navigate = useNavigate();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(userLocation);
          joinLocationRoom(userLocation.lat, userLocation.lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          setShowLocationModal(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setShowLocationModal(true);
    }

    return () => {
      if (location) {
        leaveLocationRoom(location.lat, location.lng);
      }
    };
  }, []);

  // Fetch nearby parking spots
  const { data: nearbySpots, isLoading: spotsLoading } = useQuery(
    ['nearbySpots', location, filters],
    async () => {
      if (!location) return { data: { spots: [] } };
      
      console.log('Fetching nearby spots with params:', {
        lat: location.lat,
        lng: location.lng,
        radius: filters.radius,
        maxPrice: filters.maxPrice,
        vehicleType: filters.vehicleType,
        features: filters.features,
      });
      
      const response = await spotsService.getNearbySpots({
        lat: location.lat,
        lng: location.lng,
        radius: filters.radius,
        maxPrice: filters.maxPrice,
        vehicleType: filters.vehicleType,
        features: filters.features,
      });
      
      console.log('API response:', response);
      return response;
    },
    {
      enabled: !!location,
      refetchInterval: 30000, // Refetch every 30 seconds
      initialData: { data: { spots: [] } }, // Provide initial data to prevent undefined errors
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setShowLocationModal(false);
    joinLocationRoom(selectedLocation.lat, selectedLocation.lng);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleProfileMenuClose();
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(userLocation);
          joinLocationRoom(userLocation.lat, userLocation.lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          setShowLocationModal(true);
        }
      );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <>
      <Helmet>
        <title>Home - Parking Spot Finder</title>
        <meta name="description" content="Find and book parking spots near you" />
      </Helmet>

      {/* App Bar */}
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <DirectionsCar sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h6" component="h1" fontWeight="bold">
              ParkFinder
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <Avatar 
                src={user?.avatar} 
                alt={user?.name}
                sx={{ width: 32, height: 32 }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
                <AccountCircle sx={{ mr: 2 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={() => { navigate('/dashboard'); handleProfileMenuClose(); }}>
                <Dashboard sx={{ mr: 2 }} />
                Dashboard
              </MenuItem>
              {user?.role === 'spot_owner' && (
                <MenuItem onClick={() => { navigate('/my-spots'); handleProfileMenuClose(); }}>
                  <DirectionsCar sx={{ mr: 2 }} />
                  My Spots
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 2 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ pt: 10, pb: 4 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
                Welcome back, {user?.name}!
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Find parking spots near you or search for a specific location
              </Typography>
            </Box>
          </motion.div>

          {/* Search Bar */}
          <motion.div variants={itemVariants}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <form onSubmit={handleSearch}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      placeholder="Search for parking spots, addresses, or landmarks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '12px',
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<Search />}
                      type="submit"
                      sx={{ py: 1.5, px: 3 }}
                    >
                      Search
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FilterList />}
                      onClick={() => setShowFilters(true)}
                      sx={{ py: 1.5, px: 3 }}
                    >
                      Filters
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Location and Filter Chips */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                icon={<LocationOn />}
                label={location ? 'Current Location' : 'Select Location'}
                onClick={() => setShowLocationModal(true)}
                color="primary"
                variant="outlined"
                sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
              />
              {filters.maxPrice && (
                <Chip
                  label={`Max $${filters.maxPrice}/hr`}
                  onDelete={() => setFilters({ ...filters, maxPrice: '' })}
                  color="secondary"
                  variant="outlined"
                  sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                />
              )}
              {filters.vehicleType && (
                <Chip
                  label={filters.vehicleType}
                  onDelete={() => setFilters({ ...filters, vehicleType: '' })}
                  color="secondary"
                  variant="outlined"
                  sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                />
              )}
              {filters.features.map((feature) => (
                <Chip
                  key={feature}
                  label={feature}
                  onDelete={() => setFilters({
                    ...filters,
                    features: filters.features.filter(f => f !== feature)
                  })}
                  color="secondary"
                  variant="outlined"
                  sx={{ background: 'rgba(255, 255, 255, 0.9)' }}
                />
              ))}
            </Box>
          </motion.div>

          {/* Map and Spots Grid */}
          <Grid container spacing={3}>
            {/* Map */}
            <Grid item xs={12} md={8}>
              <motion.div variants={itemVariants}>
                <Card sx={{ height: '600px' }}>
                  <CardContent sx={{ height: '100%', p: 0 }}>
                    <MapComponent
                      center={location}
                      spots={nearbySpots?.data?.spots || []}
                      onSpotClick={(spot) => navigate(`/spot/${spot._id}`)}
                      loading={spotsLoading}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Spots List */}
            <Grid item xs={12} md={4}>
              <motion.div variants={itemVariants}>
                <Card sx={{ height: '600px', overflow: 'auto' }}>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      Nearby Parking Spots
                    </Typography>
                    
                    {spotsLoading ? (
                      <Typography color="text.secondary">Loading spots...</Typography>
                    ) : !nearbySpots?.data?.spots || nearbySpots?.data?.spots?.length === 0 ? (
                      <Typography color="text.secondary">
                        No parking spots found in your area. Try adjusting your filters.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {nearbySpots?.data?.spots?.map((spot) => (
                          <ParkingSpotCard
                            key={spot._id}
                            spot={spot}
                            onBook={() => navigate(`/booking/${spot._id}`)}
                            onViewDetails={() => navigate(`/spot/${spot._id}`)}
                            compact
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>

      {/* Floating Action Buttons */}
      <Fab
        color="primary"
        aria-label="my location"
        onClick={getMyLocation}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'rgba(33, 150, 243, 0.9)',
          backdropFilter: 'blur(20px)',
          '&:hover': {
            background: 'rgba(25, 118, 210, 0.9)',
          },
        }}
      >
        <MyLocation />
      </Fab>

      {user?.role === 'spot_owner' && (
        <Fab
          color="secondary"
          aria-label="add spot"
          onClick={() => navigate('/add-spot')}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 88,
            background: 'rgba(245, 0, 87, 0.9)',
            backdropFilter: 'blur(20px)',
            '&:hover': {
              background: 'rgba(197, 17, 98, 0.9)',
            },
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Modals */}
      <SearchFilters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleFilterApply}
      />

      <LocationModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};

export default HomePage;
