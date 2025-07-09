import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  IconButton,
  Alert,
  Chip,
  Avatar,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Badge,
  Fab,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BookOnline,
  History,
  AccountCircle,
  Notifications,
  Add,
  DirectionsCar,
  ExitToApp,
  Settings,
  LocalParking,
  Star,
  TrendingUp,
  Schedule,
  Payment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { spotsService } from '../services/spotsService';
import BookingCard from '../components/bookings/BookingCard';
import ParkingSpotCard from '../components/spots/ParkingSpotCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  // Fetch user bookings
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery(
    ['userBookings', bookingFilter],
    () => bookingService.getUserBookings({ 
      status: bookingFilter !== 'all' ? bookingFilter : undefined,
      limit: 20
    }),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching bookings:', error);
      }
    }
  );

  // Fetch user payments
  const { data: payments, isLoading: paymentsLoading } = useQuery(
    ['userPayments'],
    () => paymentService.getUserPayments({ limit: 10 }),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching payments:', error);
      }
    }
  );

  // Fetch user's spots if they are a spot owner
  const { data: userSpots, isLoading: spotsLoading } = useQuery(
    ['userSpots'],
    () => spotsService.getUserSpots(),
    {
      enabled: user?.role === 'spot_owner',
      retry: 1,
      onError: (error) => {
        console.error('Error fetching user spots:', error);
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getBookingStats = () => {
    if (!bookings?.data?.bookings) return { total: 0, active: 0, completed: 0, cancelled: 0 };

    const bookingList = bookings.data.bookings;
    return {
      total: bookingList.length,
      active: bookingList.filter(b => b.status === 'active').length,
      completed: bookingList.filter(b => b.status === 'completed').length,
      cancelled: bookingList.filter(b => b.status === 'cancelled').length,
    };
  };

  const getRecentActivity = () => {
    if (!bookings?.data?.bookings) return [];

    return bookings.data.bookings
      .filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return isThisWeek(bookingDate);
      })
      .slice(0, 5);
  };

  const getTotalSpent = () => {
    if (!payments?.data?.payments) return 0;

    return payments.data.payments
      .filter(payment => payment.status === 'succeeded')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const stats = getBookingStats();
  const recentActivity = getRecentActivity();
  const totalSpent = getTotalSpent();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
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
        <title>Dashboard - Parking Spot Finder</title>
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
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem onClick={() => navigate('/profile')}>
                <AccountCircle sx={{ mr: 2 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>
                <Settings sx={{ mr: 2 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 2 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

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
                Manage your bookings and parking activities
              </Typography>
            </Box>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" fontWeight="bold">
                          {stats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Bookings
                        </Typography>
                      </Box>
                      <BookOnline sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" fontWeight="bold">
                          {stats.active}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Bookings
                        </Typography>
                      </Box>
                      <Schedule sx={{ fontSize: 48, color: 'success.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" fontWeight="bold">
                          ${totalSpent.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Spent
                        </Typography>
                      </Box>
                      <Payment sx={{ fontSize: 48, color: 'warning.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" component="div" fontWeight="bold">
                          {user?.role === 'spot_owner' ? userSpots?.data?.spots?.length || 0 : stats.completed}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user?.role === 'spot_owner' ? 'My Spots' : 'Completed'}
                        </Typography>
                      </Box>
                      <LocalParking sx={{ fontSize: 48, color: 'info.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={itemVariants}>
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Recent Activity" />
                  <Tab label="My Bookings" />
                  <Tab label="Payment History" />
                  {user?.role === 'spot_owner' && <Tab label="My Spots" />}
                </Tabs>
              </Box>

              <CardContent>
                {/* Recent Activity Tab */}
                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    {recentActivity.length === 0 ? (
                      <Alert severity="info">
                        No recent activity. <Button onClick={() => navigate('/search')}>Find a parking spot</Button>
                      </Alert>
                    ) : (
                      <Box>
                        {recentActivity.map((booking) => (
                          <BookingCard
                            key={booking._id}
                            booking={booking}
                            compact
                            onUpdate={refetchBookings}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* My Bookings Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        My Bookings
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant={bookingFilter === 'all' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setBookingFilter('all')}
                        >
                          All
                        </Button>
                        <Button
                          variant={bookingFilter === 'active' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setBookingFilter('active')}
                        >
                          Active
                        </Button>
                        <Button
                          variant={bookingFilter === 'completed' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setBookingFilter('completed')}
                        >
                          Completed
                        </Button>
                        <Button
                          variant={bookingFilter === 'cancelled' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setBookingFilter('cancelled')}
                        >
                          Cancelled
                        </Button>
                      </Box>
                    </Box>

                    {bookingsLoading ? (
                      <LoadingSpinner />
                    ) : bookings?.data?.bookings?.length === 0 ? (
                      <Alert severity="info">
                        No bookings found. <Button onClick={() => navigate('/search')}>Book your first spot</Button>
                      </Alert>
                    ) : (
                      <Grid container spacing={3}>
                        {bookings?.data?.bookings?.map((booking) => (
                          <Grid item xs={12} md={6} key={booking._id}>
                            <BookingCard
                              booking={booking}
                              onUpdate={refetchBookings}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Payment History Tab */}
                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Payment History
                    </Typography>
                    {paymentsLoading ? (
                      <LoadingSpinner />
                    ) : payments?.data?.payments?.length === 0 ? (
                      <Alert severity="info">
                        No payment history available.
                      </Alert>
                    ) : (
                      <Box>
                        {payments?.data?.payments?.map((payment) => (
                          <Card key={payment._id} sx={{ mb: 2 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="subtitle1">
                                    Payment #{payment._id.slice(-8)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {format(new Date(payment.createdAt), 'PPP')}
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="h6" color="primary">
                                    ${payment.amount}
                                  </Typography>
                                  <Chip
                                    label={payment.status}
                                    color={payment.status === 'succeeded' ? 'success' : 'default'}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* My Spots Tab (for spot owners) */}
                {tabValue === 3 && user?.role === 'spot_owner' && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        My Parking Spots
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/add-spot')}
                      >
                        Add New Spot
                      </Button>
                    </Box>

                    {spotsLoading ? (
                      <LoadingSpinner />
                    ) : userSpots?.data?.spots?.length === 0 ? (
                      <Alert severity="info">
                        No parking spots listed yet. <Button onClick={() => navigate('/add-spot')}>Add your first spot</Button>
                      </Alert>
                    ) : (
                      <Grid container spacing={3}>
                        {userSpots?.data?.spots?.map((spot) => (
                          <Grid item xs={12} md={6} lg={4} key={spot._id}>
                            <ParkingSpotCard
                              spot={spot}
                              onViewDetails={(spot) => navigate(`/spot/${spot._id}`)}
                              onBook={(spot) => navigate(`/booking/${spot._id}`)}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/search')}
      >
        <Add />
      </Fab>
    </>
  );
};

export default DashboardPage;
