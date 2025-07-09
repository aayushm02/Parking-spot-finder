import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  AccessTime,
  DriveEta,
  Payment,
  CheckCircle,
  Schedule,
  LocalParking,
  Security,
  ElectricCar,
  Accessible,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addHours, isAfter, isBefore } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { spotsService } from '../services/spotsService';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const steps = ['Booking Details', 'Vehicle Info', 'Payment', 'Confirmation'];

const BookingPage = () => {
  const { spotId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeStep, setActiveStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    startTime: new Date(),
    endTime: addHours(new Date(), 2),
    vehicleInfo: {
      licensePlate: '',
      make: '',
      model: '',
      color: '',
      type: 'car',
    },
    paymentMethod: 'credit_card',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);

  // Fetch parking spot details
  const { data: spot, isLoading: spotLoading, error: spotError } = useQuery(
    ['spot', spotId],
    () => spotsService.getSpotById(spotId),
    {
      enabled: !!spotId,
      retry: 1,
    }
  );

  // Check availability mutation
  const checkAvailabilityMutation = useMutation(
    (data) => bookingService.checkAvailability(data),
    {
      onSuccess: (data) => {
        if (!data.data.isAvailable) {
          setAvailabilityError(data.data.reason);
        } else {
          setAvailabilityError(null);
        }
      },
      onError: (error) => {
        setAvailabilityError(error.response?.data?.message || 'Error checking availability');
      },
    }
  );

  // Create booking mutation
  const createBookingMutation = useMutation(
    (data) => bookingService.createBooking(data),
    {
      onSuccess: (data) => {
        setCompletedBooking(data.data.booking);
        setShowConfirmation(true);
        queryClient.invalidateQueries(['userBookings']);
        toast.success('Booking created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error creating booking');
      },
    }
  );

  // Check availability when times change
  useEffect(() => {
    if (spotId && bookingData.startTime && bookingData.endTime) {
      const timeoutId = setTimeout(() => {
        checkAvailabilityMutation.mutate({
          spotId,
          startTime: bookingData.startTime.toISOString(),
          endTime: bookingData.endTime.toISOString(),
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [bookingData.startTime, bookingData.endTime, spotId]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBookingData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate booking details
      if (!bookingData.startTime || !bookingData.endTime) {
        toast.error('Please select start and end times');
        return;
      }
      if (isAfter(bookingData.startTime, bookingData.endTime)) {
        toast.error('End time must be after start time');
        return;
      }
      if (availabilityError) {
        toast.error('Please select an available time slot');
        return;
      }
    }

    if (activeStep === 1) {
      // Validate vehicle info
      if (!bookingData.vehicleInfo.licensePlate.trim()) {
        toast.error('License plate is required');
        return;
      }
    }

    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (activeStep !== steps.length - 1) return;

    setIsSubmitting(true);
    try {
      await createBookingMutation.mutateAsync({
        parkingSpotId: spotId,
        startTime: bookingData.startTime.toISOString(),
        endTime: bookingData.endTime.toISOString(),
        vehicleInfo: bookingData.vehicleInfo,
        paymentMethod: bookingData.paymentMethod,
      });
    } catch (error) {
      console.error('Booking creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    if (!spot?.data || !bookingData.startTime || !bookingData.endTime) return 0;
    
    const durationMs = bookingData.endTime - bookingData.startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours * spot.data.hourlyRate;
  };

  const formatFeatures = (features) => {
    const featureMap = {
      security: { icon: <Security />, label: 'Security' },
      ev_charging: { icon: <ElectricCar />, label: 'EV Charging' },
      accessible: { icon: <Accessible />, label: 'Accessible' },
      '24_7': { icon: <AccessTime />, label: '24/7 Access' },
      covered: { icon: <LocalParking />, label: 'Covered' },
    };

    return features?.map(feature => featureMap[feature]).filter(Boolean) || [];
  };

  if (spotLoading) return <LoadingSpinner />;
  if (spotError) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          {spotError.response?.data?.message || 'Error loading parking spot'}
        </Alert>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Helmet>
        <title>Book Parking - {spot?.data?.name || 'Parking Spot'}</title>
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Book Parking Spot
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Spot Details */}
          <Grid item xs={12} md={4}>
            <Card>
              {spot?.data?.images?.[0] && (
                <CardMedia
                  component="img"
                  height="200"
                  image={spot.data.images[0]}
                  alt={spot.data.name}
                />
              )}
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {spot?.data?.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {spot?.data?.address}
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  ${spot?.data?.hourlyRate}/hour
                </Typography>
                
                {/* Features */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formatFeatures(spot?.data?.features).map((feature, index) => (
                    <Chip
                      key={index}
                      icon={feature.icon}
                      label={feature.label}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                {/* Booking Summary */}
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Booking Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Duration:</Typography>
                    <Typography variant="body2">
                      {bookingData.startTime && bookingData.endTime
                        ? `${Math.ceil((bookingData.endTime - bookingData.startTime) / (1000 * 60 * 60))} hours`
                        : '0 hours'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Rate:</Typography>
                    <Typography variant="body2">${spot?.data?.hourlyRate}/hour</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">Total:</Typography>
                    <Typography variant="subtitle2" color="primary">
                      ${calculateTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          {/* Booking Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step 0: Booking Details */}
                  {activeStep === 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Select Date & Time
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <DateTimePicker
                            label="Start Time"
                            value={bookingData.startTime}
                            onChange={(newValue) => handleInputChange('startTime', newValue)}
                            renderInput={(params) => (
                              <TextField {...params} fullWidth />
                            )}
                            minDateTime={new Date()}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DateTimePicker
                            label="End Time"
                            value={bookingData.endTime}
                            onChange={(newValue) => handleInputChange('endTime', newValue)}
                            renderInput={(params) => (
                              <TextField {...params} fullWidth />
                            )}
                            minDateTime={bookingData.startTime}
                          />
                        </Grid>
                      </Grid>

                      {availabilityError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {availabilityError}
                        </Alert>
                      )}

                      {checkAvailabilityMutation.isLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Typography variant="body2">Checking availability...</Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Step 1: Vehicle Info */}
                  {activeStep === 1 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Vehicle Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="License Plate"
                            value={bookingData.vehicleInfo.licensePlate}
                            onChange={(e) => handleInputChange('vehicleInfo.licensePlate', e.target.value.toUpperCase())}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Vehicle Type</InputLabel>
                            <Select
                              value={bookingData.vehicleInfo.type}
                              onChange={(e) => handleInputChange('vehicleInfo.type', e.target.value)}
                              label="Vehicle Type"
                            >
                              <MenuItem value="car">Car</MenuItem>
                              <MenuItem value="motorcycle">Motorcycle</MenuItem>
                              <MenuItem value="bicycle">Bicycle</MenuItem>
                              <MenuItem value="truck">Truck</MenuItem>
                              <MenuItem value="van">Van</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Make"
                            value={bookingData.vehicleInfo.make}
                            onChange={(e) => handleInputChange('vehicleInfo.make', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Model"
                            value={bookingData.vehicleInfo.model}
                            onChange={(e) => handleInputChange('vehicleInfo.model', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Color"
                            value={bookingData.vehicleInfo.color}
                            onChange={(e) => handleInputChange('vehicleInfo.color', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Step 2: Payment */}
                  {activeStep === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Payment Method
                      </Typography>
                      
                      <FormControl fullWidth>
                        <InputLabel>Payment Method</InputLabel>
                        <Select
                          value={bookingData.paymentMethod}
                          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                          label="Payment Method"
                        >
                          <MenuItem value="credit_card">Credit Card</MenuItem>
                          <MenuItem value="debit_card">Debit Card</MenuItem>
                          <MenuItem value="paypal">PayPal</MenuItem>
                        </Select>
                      </FormControl>

                      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Payment Summary
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Subtotal:</Typography>
                          <Typography variant="body2">${calculateTotal().toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Tax (10%):</Typography>
                          <Typography variant="body2">${(calculateTotal() * 0.1).toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2">Total Amount:</Typography>
                          <Typography variant="subtitle2" color="primary">
                            ${(calculateTotal() * 1.1).toFixed(2)}
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* Step 3: Confirmation */}
                  {activeStep === 3 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Confirm Your Booking
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Booking Details
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Start:</strong> {format(bookingData.startTime, 'PPP pp')}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>End:</strong> {format(bookingData.endTime, 'PPP pp')}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Duration:</strong> {Math.ceil((bookingData.endTime - bookingData.startTime) / (1000 * 60 * 60))} hours
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Vehicle Details
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>License Plate:</strong> {bookingData.vehicleInfo.licensePlate}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Type:</strong> {bookingData.vehicleInfo.type}
                            </Typography>
                            {bookingData.vehicleInfo.make && (
                              <Typography variant="body2" gutterBottom>
                                <strong>Make:</strong> {bookingData.vehicleInfo.make}
                              </Typography>
                            )}
                            {bookingData.vehicleInfo.model && (
                              <Typography variant="body2" gutterBottom>
                                <strong>Model:</strong> {bookingData.vehicleInfo.model}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      </Grid>

                      <Alert severity="info" sx={{ mt: 2 }}>
                        Please review all details before confirming your booking. Once confirmed, you will receive a confirmation email with your booking details and QR code.
                      </Alert>
                    </Box>
                  )}
                </motion.div>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      variant="contained"
                      disabled={isSubmitting || availabilityError}
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      variant="contained"
                      disabled={availabilityError}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirmation} 
        onClose={() => setShowConfirmation(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
            Booking Confirmed!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your parking spot has been successfully booked. You will receive a confirmation email shortly with your booking details and QR code.
          </Typography>
          {completedBooking && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Booking ID: {completedBooking._id}
              </Typography>
              <Typography variant="body2">
                Start: {format(new Date(completedBooking.startTime), 'PPP pp')}
              </Typography>
              <Typography variant="body2">
                End: {format(new Date(completedBooking.endTime), 'PPP pp')}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/dashboard')} variant="contained">
            Go to Dashboard
          </Button>
          <Button onClick={() => setShowConfirmation(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BookingPage;
