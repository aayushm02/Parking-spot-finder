import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Chip,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  AccessTime,
  LocalParking,
  Security,
  ElectricCar,
  Accessible,
  Favorite,
  FavoriteBorder,
  Share,
  Report,
  Star,
  DirectionsWalk,
  Phone,
  Email,
  CalendarMonth,
  Schedule,
  Payment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { spotsService } from '../services/spotsService';
import { bookingService } from '../services/bookingService';
import MapComponent from '../components/map/MapComponent';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SpotDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  // Fetch spot details
  const { data: spot, isLoading, error } = useQuery(
    ['spot', id],
    () => spotsService.getSpotById(id),
    {
      enabled: !!id,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching spot:', error);
        toast.error('Error loading parking spot details');
      }
    }
  );

  // Fetch spot reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery(
    ['spotReviews', id],
    () => spotsService.getSpotReviews(id),
    {
      enabled: !!id,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching reviews:', error);
      }
    }
  );

  // Check availability
  const { data: availability, isLoading: availabilityLoading } = useQuery(
    ['spotAvailability', id],
    () => bookingService.checkAvailability({
      spotId: id,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
    }),
    {
      enabled: !!id,
      retry: 1,
      onError: (error) => {
        console.error('Error checking availability:', error);
      }
    }
  );

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await spotsService.removeFromFavorites(id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await spotsService.addToFavorites(id);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Error updating favorites');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: spot?.data?.name,
          text: `Check out this parking spot: ${spot?.data?.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      } catch (error) {
        toast.error('Error copying link');
      }
    }
  };

  const handleReport = async () => {
    try {
      await spotsService.reportSpot(id, reportReason, reportDescription);
      setShowReportDialog(false);
      setReportReason('');
      setReportDescription('');
      toast.success('Report submitted successfully');
    } catch (error) {
      toast.error('Error submitting report');
    }
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/booking/${id}`);
  };

  const formatFeatures = (features) => {
    const featureMap = {
      security: { icon: <Security />, label: 'Security Camera' },
      ev_charging: { icon: <ElectricCar />, label: 'EV Charging' },
      accessible: { icon: <Accessible />, label: 'Wheelchair Accessible' },
      '24_7': { icon: <AccessTime />, label: '24/7 Access' },
      covered: { icon: <LocalParking />, label: 'Covered Parking' },
    };

    return features?.map(feature => featureMap[feature]).filter(Boolean) || [];
  };

  const getAvailabilityStatus = () => {
    if (availabilityLoading) return { status: 'checking', label: 'Checking...', color: 'default' };
    if (availability?.data?.isAvailable) return { status: 'available', label: 'Available Now', color: 'success' };
    return { status: 'unavailable', label: 'Currently Unavailable', color: 'error' };
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          {error.response?.data?.message || 'Error loading parking spot'}
        </Alert>
      </Container>
    );
  }

  const spotData = spot?.data;
  const availabilityStatus = getAvailabilityStatus();

  return (
    <>
      <Helmet>
        <title>{spotData?.name || 'Parking Spot'} - Parking Spot Finder</title>
        <meta name="description" content={spotData?.description || 'Find and book parking spots easily'} />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flex: 1 }}>
              {spotData?.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={handleToggleFavorite}>
                {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
              </IconButton>
              <IconButton onClick={handleShare}>
                <Share />
              </IconButton>
              <IconButton onClick={() => setShowReportDialog(true)}>
                <Report />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={4}>
            {/* Image Gallery */}
            <Grid item xs={12} md={8}>
              <Card>
                {spotData?.images?.length > 0 ? (
                  <Box>
                    <CardMedia
                      component="img"
                      height="400"
                      image={spotData.images[selectedImage]}
                      alt={spotData.name}
                    />
                    {spotData.images.length > 1 && (
                      <ImageList sx={{ height: 100, mt: 1 }} cols={Math.min(spotData.images.length, 6)} rowHeight={100}>
                        {spotData.images.map((image, index) => (
                          <ImageListItem
                            key={index}
                            sx={{ cursor: 'pointer', opacity: selectedImage === index ? 1 : 0.7 }}
                            onClick={() => setSelectedImage(index)}
                          >
                            <img
                              src={image}
                              alt={`${spotData.name} ${index + 1}`}
                              loading="lazy"
                              style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                            />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200',
                    }}
                  >
                    <LocalParking sx={{ fontSize: 120, color: 'grey.400' }} />
                  </Box>
                )}
              </Card>

              {/* Map */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Location
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <MapComponent
                      center={spotData?.location ? {
                        lat: spotData.location.coordinates[1],
                        lng: spotData.location.coordinates[0]
                      } : null}
                      spots={[spotData]}
                      zoom={15}
                      showControls={false}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Details Sidebar */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" color="primary">
                      ${spotData?.hourlyRate}/hour
                    </Typography>
                    <Chip
                      label={availabilityStatus.label}
                      color={availabilityStatus.color}
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {spotData?.address}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={spotData?.averageRating || 0} readOnly />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({spotData?.totalReviews || 0} reviews)
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleBookNow}
                    disabled={!availability?.data?.isAvailable}
                    sx={{ mb: 3 }}
                  >
                    {availability?.data?.isAvailable ? 'Book Now' : 'Currently Unavailable'}
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  {/* Features */}
                  <Typography variant="h6" gutterBottom>
                    Features
                  </Typography>
                  <List dense>
                    {formatFeatures(spotData?.features).map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {feature.icon}
                        </ListItemIcon>
                        <ListItemText primary={feature.label} />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  {/* Availability Hours */}
                  <Typography variant="h6" gutterBottom>
                    Availability
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {spotData?.availability?.hours?.start} - {spotData?.availability?.hours?.end}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarMonth sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {spotData?.availability?.days?.join(', ') || 'Every day'}
                    </Typography>
                  </Box>

                  {/* Owner Info */}
                  {spotData?.owner && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Hosted by
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={spotData.owner.avatar}
                          alt={spotData.owner.name}
                          sx={{ mr: 2, width: 48, height: 48 }}
                        />
                        <Box>
                          <Typography variant="subtitle1">
                            {spotData.owner.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Member since {format(new Date(spotData.owner.createdAt), 'yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Description */}
          {spotData?.description && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {spotData.description}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reviews ({reviews?.data?.reviews?.length || 0})
              </Typography>
              {reviewsLoading ? (
                <LoadingSpinner />
              ) : reviews?.data?.reviews?.length > 0 ? (
                <Box>
                  {reviews.data.reviews.map((review) => (
                    <Paper key={review._id} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                          src={review.user?.avatar}
                          alt={review.user?.name}
                          sx={{ mr: 2, width: 32, height: 32 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">
                            {review.user?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                        <Rating value={review.rating} readOnly size="small" />
                      </Box>
                      <Typography variant="body2">
                        {review.comment}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet. Be the first to leave a review!
                </Typography>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report this parking spot</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Help us maintain a safe and reliable platform by reporting any issues with this parking spot.
          </Typography>
          <TextField
            fullWidth
            label="Reason"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="Please provide additional details about the issue..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button onClick={handleReport} variant="contained" color="error">
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SpotDetailsPage;
