import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Slider,
  Switch,
  FormControlLabel,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  AccessTime,
  LocalParking,
  FilterList,
  Map as MapIcon,
  DirectionsWalk,
  Security,
  ElectricCar,
  Accessible,
  Star,
  Close
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { spotsService } from '../services/spotsService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SearchContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  minHeight: '100vh',
  paddingTop: theme.spacing(3)
}));

const SearchCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  marginBottom: theme.spacing(3)
}));

const SpotCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const FilterDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 320,
    background: alpha(theme.palette.background.paper, 0.95),
    backdropFilter: 'blur(10px)'
  }
}));

const SearchPage = () => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    priceMin: 0,
    priceMax: 50,
    availableNow: false,
    features: [],
    rating: 0,
    distance: 10,
    sortBy: 'distance'
  });

  const spotTypes = ['outdoor', 'covered', 'garage', 'valet'];
  const spotFeatures = ['security', 'ev_charging', 'accessible', '24_7', 'covered'];

  useEffect(() => {
    searchSpots();
  }, []);

  const searchSpots = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        search: searchQuery,
        ...filters,
        features: filters.features.join(',')
      };

      const response = await spotsService.searchSpots(params);
      console.log('Search API response:', response);
      
      // Handle the response structure: response.data.spots
      const spotsArray = response?.data?.spots || [];
      setSpots(spotsArray);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search parking spots');
      console.error('Search error:', err);
      setSpots([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchSpots();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const applyFilters = () => {
    setFilterDrawerOpen(false);
    searchSpots();
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      priceMin: 0,
      priceMax: 50,
      availableNow: false,
      features: [],
      rating: 0,
      distance: 10,
      sortBy: 'distance'
    });
  };

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setDialogOpen(true);
  };

  const formatFeatures = (features) => {
    const featureMap = {
      security: { icon: <Security />, label: 'Security' },
      ev_charging: { icon: <ElectricCar />, label: 'EV Charging' },
      accessible: { icon: <Accessible />, label: 'Accessible' },
      '24_7': { icon: <AccessTime />, label: '24/7 Access' },
      covered: { icon: <LocalParking />, label: 'Covered' }
    };

    return features.map(feature => featureMap[feature]).filter(Boolean);
  };

  return (
    <SearchContainer>
      <Container maxWidth="xl">
        {/* Search Bar */}
        <SearchCard elevation={3}>
          <CardContent>
            <Box component="form" onSubmit={handleSearch}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    placeholder="Search by address, landmark, or area..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                  >
                    Search
                  </Button>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<FilterList />}
                    onClick={() => setFilterDrawerOpen(true)}
                  >
                    Filters
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </SearchCard>

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <Card>
            <CardContent>
              <Typography color="error" align="center">
                {error}
              </Typography>
              <Box textAlign="center" mt={2}>
                <Button onClick={searchSpots} variant="outlined">
                  Try Again
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {(Array.isArray(spots) ? spots : []).map((spot) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={spot._id}>
                <SpotCard onClick={() => handleSpotClick(spot)} style={{ cursor: 'pointer' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {spot.name}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" mb={1}>
                      <LocationOn sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {spot.address}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6" color="primary">
                        ${spot.hourlyRate}/hr
                      </Typography>
                      <Box ml="auto" display="flex" alignItems="center">
                        <Rating value={spot.averageRating || 0} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary" ml={0.5}>
                          ({spot.totalReviews || 0})
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color={spot.isAvailable ? 'success.main' : 'error.main'}
                      gutterBottom
                    >
                      {spot.isAvailable ? 'Available' : 'Occupied'}
                    </Typography>

                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                      {formatFeatures(spot.features || []).slice(0, 3).map((feature, index) => (
                        <Chip
                          key={index}
                          icon={feature.icon}
                          label={feature.label}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {spot.features?.length > 3 && (
                        <Chip
                          label={`+${spot.features.length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {spot.distance && (
                      <Box display="flex" alignItems="center">
                        <DirectionsWalk sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {spot.distance} away
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button size="small" color="primary">
                      View Details
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained" 
                      disabled={!spot.isAvailable}
                      sx={{ ml: 'auto' }}
                    >
                      Book Now
                    </Button>
                  </CardActions>
                </SpotCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Map View FAB */}
        <Fab
          color="primary"
          aria-label="map view"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <MapIcon />
        </Fab>

        {/* Filter Drawer */}
        <FilterDrawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
        >
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setFilterDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Box>

            <List>
              {/* Spot Type */}
              <ListItem>
                <FormControl fullWidth>
                  <InputLabel>Spot Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {spotTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </ListItem>

              {/* Price Range */}
              <ListItem>
                <Box width="100%">
                  <Typography gutterBottom>Price Range ($/hour)</Typography>
                  <Slider
                    value={[filters.priceMin, filters.priceMax]}
                    onChange={(e, value) => {
                      handleFilterChange('priceMin', value[0]);
                      handleFilterChange('priceMax', value[1]);
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    step={1}
                  />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">${filters.priceMin}</Typography>
                    <Typography variant="body2">${filters.priceMax}</Typography>
                  </Box>
                </Box>
              </ListItem>

              {/* Distance */}
              <ListItem>
                <Box width="100%">
                  <Typography gutterBottom>Max Distance (km)</Typography>
                  <Slider
                    value={filters.distance}
                    onChange={(e, value) => handleFilterChange('distance', value)}
                    valueLabelDisplay="auto"
                    min={1}
                    max={50}
                    step={1}
                  />
                </Box>
              </ListItem>

              {/* Rating */}
              <ListItem>
                <Box width="100%">
                  <Typography gutterBottom>Minimum Rating</Typography>
                  <Rating
                    value={filters.rating}
                    onChange={(e, value) => handleFilterChange('rating', value)}
                  />
                </Box>
              </ListItem>

              {/* Available Now */}
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.availableNow}
                      onChange={(e) => handleFilterChange('availableNow', e.target.checked)}
                    />
                  }
                  label="Available Now Only"
                />
              </ListItem>

              {/* Features */}
              <ListItem>
                <Box width="100%">
                  <Typography gutterBottom>Features</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {spotFeatures.map(feature => (
                      <Chip
                        key={feature}
                        label={feature.replace('_', ' ').toUpperCase()}
                        variant={filters.features.includes(feature) ? 'filled' : 'outlined'}
                        onClick={() => handleFeatureToggle(feature)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              </ListItem>

              {/* Sort By */}
              <ListItem>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="distance">Distance</MenuItem>
                    <MenuItem value="price">Price</MenuItem>
                    <MenuItem value="rating">Rating</MenuItem>
                    <MenuItem value="availability">Availability</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>
            </List>

            <Box mt={3} display="flex" gap={2}>
              <Button onClick={clearFilters} variant="outlined" fullWidth>
                Clear
              </Button>
              <Button onClick={applyFilters} variant="contained" fullWidth>
                Apply
              </Button>
            </Box>
          </Box>
        </FilterDrawer>

        {/* Spot Details Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedSpot && (
            <>
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{selectedSpot.name}</Typography>
                  <IconButton onClick={() => setDialogOpen(false)}>
                    <Close />
                  </IconButton>
                </Box>
              </DialogTitle>
              
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Address:</strong> {selectedSpot.address}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Type:</strong> {selectedSpot.type}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Hourly Rate:</strong> ${selectedSpot.hourlyRate}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Status:</strong> 
                      <Chip
                        label={selectedSpot.isAvailable ? 'Available' : 'Occupied'}
                        color={selectedSpot.isAvailable ? 'success' : 'error'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Rating:</strong>
                      <Box display="flex" alignItems="center" ml={1}>
                        <Rating value={selectedSpot.averageRating || 0} readOnly />
                        <Typography variant="body2" ml={1}>
                          ({selectedSpot.totalReviews || 0} reviews)
                        </Typography>
                      </Box>
                    </Typography>
                    
                    {selectedSpot.description && (
                      <Typography variant="body1" gutterBottom>
                        <strong>Description:</strong> {selectedSpot.description}
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Features:</strong>
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formatFeatures(selectedSpot.features || []).map((feature, index) => (
                        <Chip
                          key={index}
                          icon={feature.icon}
                          label={feature.label}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Close</Button>
                <Button
                  variant="contained"
                  disabled={!selectedSpot.isAvailable}
                  // onClick={() => navigate to booking page}
                >
                  Book This Spot
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </SearchContainer>
  );
};

export default SearchPage;
