import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  IconButton,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Clear,
  Search,
  FilterList,
  ExpandMore,
  LocationOn,
  AttachMoney,
  DirectionsCar,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SearchFilters = ({ 
  filters = {}, 
  onFiltersChange, 
  onSearch, 
  onClear,
  isLoading = false 
}) => {
  const [localFilters, setLocalFilters] = useState({
    location: '',
    radius: 5,
    priceRange: [0, 100],
    spotType: '',
    availability: 'all',
    rating: 0,
    amenities: [],
    sortBy: 'distance',
    ...filters
  });

  const [expanded, setExpanded] = useState({
    location: true,
    price: false,
    amenities: false,
    other: false,
  });

  const spotTypes = [
    { value: 'street', label: 'Street Parking' },
    { value: 'garage', label: 'Garage' },
    { value: 'lot', label: 'Parking Lot' },
    { value: 'driveway', label: 'Driveway' },
    { value: 'covered', label: 'Covered' },
  ];

  const availabilityOptions = [
    { value: 'all', label: 'All Spots' },
    { value: 'available', label: 'Available Now' },
    { value: 'soon', label: 'Available Soon' },
  ];

  const sortOptions = [
    { value: 'distance', label: 'Distance' },
    { value: 'price', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' },
    { value: 'newest', label: 'Newest' },
  ];

  const amenitiesList = [
    { value: 'ev_charging', label: 'EV Charging' },
    { value: 'covered', label: 'Covered' },
    { value: 'security', label: 'Security' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'cctv', label: 'CCTV' },
    { value: 'handicap', label: 'Handicap Accessible' },
    { value: 'valet', label: 'Valet Service' },
  ];

  useEffect(() => {
    setLocalFilters(prev => ({ ...prev, ...filters }));
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleAmenityToggle = (amenity) => {
    const newAmenities = localFilters.amenities.includes(amenity)
      ? localFilters.amenities.filter(a => a !== amenity)
      : [...localFilters.amenities, amenity];
    handleFilterChange('amenities', newAmenities);
  };

  const handleClear = () => {
    const clearedFilters = {
      location: '',
      radius: 5,
      priceRange: [0, 100],
      spotType: '',
      availability: 'all',
      rating: 0,
      amenities: [],
      sortBy: 'distance',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
    onClear?.();
  };

  const handleSearch = () => {
    onSearch?.(localFilters);
  };

  const handleExpand = (panel) => {
    setExpanded(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} />
            Search Filters
          </Typography>
          <IconButton onClick={handleClear} size="small">
            <Clear />
          </IconButton>
        </Box>

        {/* Location Filter */}
        <Accordion expanded={expanded.location} onChange={() => handleExpand('location')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <LocationOn sx={{ mr: 1, fontSize: '1.2rem' }} />
              Location & Distance
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Location"
                  value={localFilters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Enter address or city"
                  InputProps={{
                    startAdornment: (
                      <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>
                  Radius: {localFilters.radius} km
                </Typography>
                <Slider
                  value={localFilters.radius}
                  onChange={(e, value) => handleFilterChange('radius', value)}
                  min={1}
                  max={50}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: 'primary.main' }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Price Filter */}
        <Accordion expanded={expanded.price} onChange={() => handleExpand('price')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <AttachMoney sx={{ mr: 1, fontSize: '1.2rem' }} />
              Price Range
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 2 }}>
              <Typography gutterBottom>
                Price: ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]} per hour
              </Typography>
              <Slider
                value={localFilters.priceRange}
                onChange={(e, value) => handleFilterChange('priceRange', value)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                sx={{ color: 'primary.main' }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Amenities Filter */}
        <Accordion expanded={expanded.amenities} onChange={() => handleExpand('amenities')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <Star sx={{ mr: 1, fontSize: '1.2rem' }} />
              Amenities
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" flexWrap="wrap" spacing={1}>
              {amenitiesList.map((amenity) => (
                <Chip
                  key={amenity.value}
                  label={amenity.label}
                  onClick={() => handleAmenityToggle(amenity.value)}
                  variant={localFilters.amenities.includes(amenity.value) ? 'filled' : 'outlined'}
                  color={localFilters.amenities.includes(amenity.value) ? 'primary' : 'default'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Other Filters */}
        <Accordion expanded={expanded.other} onChange={() => handleExpand('other')}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <DirectionsCar sx={{ mr: 1, fontSize: '1.2rem' }} />
              Other Filters
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Spot Type</InputLabel>
                  <Select
                    value={localFilters.spotType}
                    label="Spot Type"
                    onChange={(e) => handleFilterChange('spotType', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {spotTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Availability</InputLabel>
                  <Select
                    value={localFilters.availability}
                    label="Availability"
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                  >
                    {availabilityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  Minimum Rating: {localFilters.rating} stars
                </Typography>
                <Slider
                  value={localFilters.rating}
                  onChange={(e, value) => handleFilterChange('rating', value)}
                  min={0}
                  max={5}
                  step={0.5}
                  valueLabelDisplay="auto"
                  sx={{ color: 'primary.main' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={localFilters.sortBy}
                    label="Sort By"
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<Clear />}
            sx={{ borderRadius: 2 }}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<Search />}
            disabled={isLoading}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8 30%, #6c63ff 90%)',
              },
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default SearchFilters;
