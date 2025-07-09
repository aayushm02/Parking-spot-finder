import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  LocationOn,
  AttachMoney,
  Star,
  MoreVert,
  Analytics,
  EventSeat,
  TrendingUp,
  Schedule,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { spotsService } from '../../services/spotsService';
import { bookingService } from '../../services/bookingService';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const MySpots = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [spots, setSpots] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSpots: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    occupancyRate: 0
  });
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showSpotDetails, setShowSpotDetails] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchMySpots();
    fetchMyBookings();
    fetchAnalytics();
  }, []);

  const fetchMySpots = async () => {
    try {
      const response = await spotsService.getMySpots();
      setSpots(response.data);
    } catch (error) {
      console.error('Error fetching spots:', error);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await bookingService.getOwnerBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await spotsService.getOwnerAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleToggleSpotStatus = async (spotId, currentStatus) => {
    setLoading(true);
    try {
      await spotsService.toggleSpotStatus(spotId, !currentStatus);
      setNotification({
        open: true,
        message: `Spot ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
        severity: 'success'
      });
      fetchMySpots();
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error updating spot status',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpot = async (spotId) => {
    if (window.confirm('Are you sure you want to delete this spot?')) {
      setLoading(true);
      try {
        await spotsService.deleteSpot(spotId);
        setNotification({
          open: true,
          message: 'Spot deleted successfully!',
          severity: 'success'
        });
        fetchMySpots();
      } catch (error) {
        setNotification({
          open: true,
          message: error.response?.data?.message || 'Error deleting spot',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMenuOpen = (event, spot) => {
    setAnchorEl(event.currentTarget);
    setSelectedSpot(spot);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSpot(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getBookingStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle />;
      case 'pending':
        return <Schedule />;
      case 'cancelled':
        return <Cancel />;
      case 'completed':
        return <CheckCircle />;
      default:
        return <Schedule />;
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Parking Spots
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/add-spot')}
          sx={{ borderRadius: 3 }}
        >
          Add New Spot
        </Button>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {analytics.totalSpots}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spots
                  </Typography>
                </Box>
                <LocationOn sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="secondary">
                    {analytics.totalBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Bookings
                  </Typography>
                </Box>
                <EventSeat sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    ${analytics.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {analytics.averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
                <Star sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper
        elevation={3}
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="My Spots" />
          <Tab 
            label={
              <Badge badgeContent={bookings.filter(b => b.status === 'pending').length} color="warning">
                Bookings
              </Badge>
            }
          />
          <Tab label="Analytics" />
        </Tabs>

        {/* My Spots Tab */}
        <TabPanel value={activeTab} index={0}>
          {spots.length > 0 ? (
            <Grid container spacing={3}>
              {spots.map((spot) => (
                <Grid item xs={12} sm={6} md={4} key={spot._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={spot.images?.[0] || '/placeholder-parking.jpg'}
                      alt={spot.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h2">
                          {spot.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, spot)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {spot.address}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={spot.isActive ? 'Active' : 'Inactive'}
                          color={getStatusColor(spot.isActive ? 'active' : 'inactive')}
                          size="small"
                        />
                        <Chip
                          label={`$${spot.pricePerHour}/hr`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star sx={{ color: 'warning.main', fontSize: 16 }} />
                        <Typography variant="body2">
                          {spot.rating?.toFixed(1) || 'No rating'} ({spot.totalReviews || 0} reviews)
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/edit-spot/${spot._id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={spot.isActive ? <VisibilityOff /> : <Visibility />}
                        onClick={() => handleToggleSpotStatus(spot._id, spot.isActive)}
                      >
                        {spot.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ textAlign: 'center' }}>
              You haven't added any parking spots yet. Click "Add New Spot" to get started!
            </Alert>
          )}
        </TabPanel>

        {/* Bookings Tab */}
        <TabPanel value={activeTab} index={1}>
          {bookings.length > 0 ? (
            <Grid container spacing={2}>
              {bookings.map((booking) => (
                <Grid item xs={12} key={booking._id}>
                  <Card sx={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {booking.parkingSpot?.name || 'Parking Spot'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Customer: {booking.user?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {new Date(booking.startTime).toLocaleDateString()} - {new Date(booking.endTime).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Duration: {Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60))} hours
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            icon={getBookingStatusIcon(booking.status)}
                            label={booking.status}
                            color={getBookingStatusColor(booking.status)}
                            size="small"
                          />
                          <Typography variant="h6" color="success.main">
                            ${booking.totalAmount?.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ textAlign: 'center' }}>
              No bookings found for your spots yet.
            </Alert>
          )}
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Occupancy Rate
                </Typography>
                <Typography variant="h4" color="primary">
                  {analytics.occupancyRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average occupancy across all spots
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Revenue
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${analytics.monthlyRevenue?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenue for current month
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Detailed analytics charts and reports coming soon!
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/spot/${selectedSpot?._id}`);
          handleMenuClose();
        }}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/edit-spot/${selectedSpot?._id}`);
          handleMenuClose();
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Spot</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleToggleSpotStatus(selectedSpot?._id, selectedSpot?.isActive);
          handleMenuClose();
        }}>
          <ListItemIcon>
            {selectedSpot?.isActive ? <VisibilityOff /> : <Visibility />}
          </ListItemIcon>
          <ListItemText>
            {selectedSpot?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            handleDeleteSpot(selectedSpot?._id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delete Spot</ListItemText>
        </MenuItem>
      </Menu>

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

export default MySpots;
