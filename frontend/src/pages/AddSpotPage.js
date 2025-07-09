import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Add,
  Delete,
  LocationOn,
  Save,
  Cancel,
  CheckCircle,
  Info,
  Warning,
  AccessTime,
  AttachMoney,
  Security,
  DirectionsCar
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { spotsService } from '../services/spotsService';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AddSpotPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  const [spotData, setSpotData] = useState({
    name: '',
    description: '',
    address: '',
    location: {
      latitude: '',
      longitude: ''
    },
    pricePerHour: '',
    spotType: '',
    amenities: [],
    images: [],
    availability: {
      monday: { start: '08:00', end: '18:00', available: true },
      tuesday: { start: '08:00', end: '18:00', available: true },
      wednesday: { start: '08:00', end: '18:00', available: true },
      thursday: { start: '08:00', end: '18:00', available: true },
      friday: { start: '08:00', end: '18:00', available: true },
      saturday: { start: '08:00', end: '18:00', available: true },
      sunday: { start: '08:00', end: '18:00', available: false }
    },
    maxVehicleSize: '',
    accessInstructions: '',
    cancellationPolicy: 'flexible',
    instantBooking: true,
    requiresApproval: false
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  const steps = [
    'Basic Information',
    'Location & Pricing',
    'Amenities & Features',
    'Availability',
    'Photos & Final Details'
  ];

  const spotTypes = [
    'Garage',
    'Driveway',
    'Street Parking',
    'Parking Lot',
    'Covered Parking',
    'Underground Parking',
    'Valet Parking'
  ];

  const availableAmenities = [
    'Covered',
    'Security Camera',
    'Lighting',
    'EV Charging',
    'Disabled Access',
    '24/7 Access',
    'Gated',
    'Surveillance',
    'Attendant',
    'Washing Station'
  ];

  const vehicleSizes = [
    'Compact',
    'Mid-size',
    'Full-size',
    'SUV',
    'Truck',
    'Motorcycle',
    'Any Size'
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSpotData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSpotData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setSpotData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setSpotData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + imageFiles.length > 10) {
      setNotification({
        open: true,
        message: 'Maximum 10 images allowed',
        severity: 'warning'
      });
      return;
    }

    setImageFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSpotData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            }
          }));
          setNotification({
            open: true,
            message: 'Location obtained successfully!',
            severity: 'success'
          });
        },
        (error) => {
          setNotification({
            open: true,
            message: 'Could not get current location',
            severity: 'error'
          });
        }
      );
    } else {
      setNotification({
        open: true,
        message: 'Geolocation is not supported by this browser',
        severity: 'error'
      });
    }
  };

  const validateStep = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return spotData.name && spotData.description && spotData.address;
      case 1:
        return spotData.location.latitude && spotData.location.longitude && spotData.pricePerHour;
      case 2:
        return spotData.spotType && spotData.maxVehicleSize;
      case 3:
        return Object.values(spotData.availability).some(day => day.available);
      case 4:
        return imageFiles.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    } else {
      setNotification({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning'
      });
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Append spot data
      Object.keys(spotData).forEach(key => {
        if (key === 'location' || key === 'availability') {
          formData.append(key, JSON.stringify(spotData[key]));
        } else if (key === 'amenities') {
          formData.append(key, JSON.stringify(spotData[key]));
        } else if (key !== 'images') {
          formData.append(key, spotData[key]);
        }
      });

      // Append image files
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await spotsService.createSpot(formData);
      
      setNotification({
        open: true,
        message: 'Parking spot created successfully!',
        severity: 'success'
      });

      // Navigate to spot details after a short delay
      setTimeout(() => {
        navigate(`/spot/${response.data._id}`);
      }, 2000);
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error creating parking spot',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Add New Parking Spot
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/my-spots')}
        >
          Cancel
        </Button>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Basic Information */}
          <Step>
            <StepLabel>Basic Information</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Spot Name"
                    value={spotData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="e.g., Downtown Garage Spot"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={spotData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    multiline
                    rows={3}
                    required
                    placeholder="Describe your parking spot, accessibility, and any special features"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={spotData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="Full address of the parking spot"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleNext} variant="contained" sx={{ mr: 1 }}>
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Location & Pricing */}
          <Step>
            <StepLabel>Location & Pricing</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={spotData.location.latitude}
                    onChange={(e) => handleInputChange('location.latitude', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={spotData.location.longitude}
                    onChange={(e) => handleInputChange('location.longitude', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<LocationOn />}
                    onClick={handleGetCurrentLocation}
                    fullWidth
                  >
                    Use Current Location
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Price per Hour ($)"
                    value={spotData.pricePerHour}
                    onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleNext} variant="contained" sx={{ mr: 1 }}>
                  Next
                </Button>
                <Button onClick={handleBack}>Back</Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Amenities & Features */}
          <Step>
            <StepLabel>Amenities & Features</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Spot Type</InputLabel>
                    <Select
                      value={spotData.spotType}
                      onChange={(e) => handleInputChange('spotType', e.target.value)}
                    >
                      {spotTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Max Vehicle Size</InputLabel>
                    <Select
                      value={spotData.maxVehicleSize}
                      onChange={(e) => handleInputChange('maxVehicleSize', e.target.value)}
                    >
                      {vehicleSizes.map(size => (
                        <MenuItem key={size} value={size}>{size}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Amenities
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableAmenities.map(amenity => (
                      <Chip
                        key={amenity}
                        label={amenity}
                        clickable
                        color={spotData.amenities.includes(amenity) ? 'primary' : 'default'}
                        onClick={() => handleAmenityToggle(amenity)}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Access Instructions"
                    value={spotData.accessInstructions}
                    onChange={(e) => handleInputChange('accessInstructions', e.target.value)}
                    multiline
                    rows={2}
                    placeholder="How to access the parking spot (gate codes, entrance instructions, etc.)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={spotData.instantBooking}
                        onChange={(e) => handleInputChange('instantBooking', e.target.checked)}
                      />
                    }
                    label="Allow instant booking"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleNext} variant="contained" sx={{ mr: 1 }}>
                  Next
                </Button>
                <Button onClick={handleBack}>Back</Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 4: Availability */}
          <Step>
            <StepLabel>Availability</StepLabel>
            <StepContent>
              <Typography variant="h6" gutterBottom>
                Set your availability schedule
              </Typography>
              {Object.entries(spotData.availability).map(([day, schedule]) => (
                <Box key={day} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={schedule.available}
                            onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                          />
                        }
                        label={day.charAt(0).toUpperCase() + day.slice(1)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="time"
                        value={schedule.start}
                        onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                        disabled={!schedule.available}
                        InputProps={{
                          startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="time"
                        value={schedule.end}
                        onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                        disabled={!schedule.available}
                        InputProps={{
                          startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleNext} variant="contained" sx={{ mr: 1 }}>
                  Next
                </Button>
                <Button onClick={handleBack}>Back</Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 5: Photos & Final Details */}
          <Step>
            <StepLabel>Photos & Final Details</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Upload Photos
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Upload Images ({imageFiles.length}/10)
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleImageUpload}
                  />
                  
                  {previewImages.length > 0 && (
                    <Grid container spacing={2}>
                      {previewImages.map((preview, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Card>
                            <CardMedia
                              component="img"
                              height="140"
                              image={preview}
                              alt={`Preview ${index + 1}`}
                            />
                            <CardContent sx={{ p: 1 }}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveImage(index)}
                                fullWidth
                              >
                                <Delete />
                              </IconButton>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Cancellation Policy</InputLabel>
                    <Select
                      value={spotData.cancellationPolicy}
                      onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                    >
                      <MenuItem value="flexible">Flexible - Free cancellation up to 1 hour before</MenuItem>
                      <MenuItem value="moderate">Moderate - Free cancellation up to 24 hours before</MenuItem>
                      <MenuItem value="strict">Strict - No refunds</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  size="large"
                  disabled={loading || !validateStep(4)}
                  startIcon={loading ? <LoadingSpinner size={20} /> : <Save />}
                  sx={{ mr: 1 }}
                >
                  {loading ? 'Creating...' : 'Create Parking Spot'}
                </Button>
                <Button onClick={handleBack}>Back</Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddSpotPage;
