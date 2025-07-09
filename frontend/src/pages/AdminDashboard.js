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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  AppBar,
  Toolbar,
  Badge,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  LocalParking,
  BookOnline,
  Payment,
  Settings,
  MoreVert,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Cancel,
  Visibility,
  TrendingUp,
  TrendingDown,
  AccountCircle,
  Notifications,
  ExitToApp,
  DirectionsCar,
  Analytics,
  Warning,
  Error,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  // Check if user is admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [user, navigate]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    ['adminDashboard'],
    () => adminService.getDashboard(),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching dashboard data:', error);
        toast.error('Error loading dashboard data');
      }
    }
  );

  // Fetch users
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery(
    ['adminUsers'],
    () => adminService.getAllUsers({ limit: 20 }),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching users:', error);
      }
    }
  );

  // Fetch spots
  const { data: spotsData, isLoading: spotsLoading, refetch: refetchSpots } = useQuery(
    ['adminSpots'],
    () => adminService.getAllSpots({ limit: 20 }),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching spots:', error);
      }
    }
  );

  // Fetch bookings
  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery(
    ['adminBookings'],
    () => adminService.getAllBookings({ limit: 20 }),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching bookings:', error);
      }
    }
  );

  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery(
    ['adminPayments'],
    () => adminService.getAllPayments({ limit: 20 }),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching payments:', error);
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleActionMenuOpen = (event, item, type) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedItem(item);
    setActionType(type);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedItem(null);
    setActionType('');
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

  const handleAction = async (action) => {
    try {
      switch (action) {
        case 'banUser':
          await adminService.banUser(selectedItem._id, { reason: actionReason });
          refetchUsers();
          toast.success('User banned successfully');
          break;
        case 'unbanUser':
          await adminService.unbanUser(selectedItem._id);
          refetchUsers();
          toast.success('User unbanned successfully');
          break;
        case 'approveSpot':
          await adminService.approveSpot(selectedItem._id);
          refetchSpots();
          toast.success('Spot approved successfully');
          break;
        case 'rejectSpot':
          await adminService.rejectSpot(selectedItem._id, { reason: actionReason });
          refetchSpots();
          toast.success('Spot rejected successfully');
          break;
        case 'deleteSpot':
          await adminService.deleteSpot(selectedItem._id);
          refetchSpots();
          toast.success('Spot deleted successfully');
          break;
        case 'updateBookingStatus':
          await adminService.updateBookingStatus(selectedItem._id, { status: 'cancelled', reason: actionReason });
          refetchBookings();
          toast.success('Booking updated successfully');
          break;
        case 'processRefund':
          await adminService.processRefund(selectedItem._id, { reason: actionReason });
          refetchPayments();
          toast.success('Refund processed successfully');
          break;
        default:
          break;
      }
      setShowActionDialog(false);
      setActionReason('');
      handleActionMenuClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const openActionDialog = (action) => {
    setActionType(action);
    setShowActionDialog(true);
    handleActionMenuClose();
  };

  const getStatusChip = (status, type) => {
    const statusColors = {
      user: {
        active: 'success',
        banned: 'error',
        inactive: 'warning',
      },
      spot: {
        active: 'success',
        pending: 'warning',
        rejected: 'error',
        inactive: 'default',
      },
      booking: {
        pending: 'warning',
        confirmed: 'info',
        active: 'success',
        completed: 'success',
        cancelled: 'error',
        no_show: 'error',
      },
      payment: {
        pending: 'warning',
        succeeded: 'success',
        failed: 'error',
        refunded: 'info',
      },
    };

    return (
      <Chip
        label={status}
        color={statusColors[type]?.[status] || 'default'}
        size="small"
      />
    );
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Analytics Overview',
      },
    },
  };

  const generateChartData = () => {
    if (!dashboardData?.data) return null;

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const bookingsData = [65, 59, 80, 81, 56, 55];
    const revenueData = [1200, 1900, 3000, 5000, 2000, 3000];

    return {
      labels,
      datasets: [
        {
          label: 'Bookings',
          data: bookingsData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: 'Revenue ($)',
          data: revenueData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
      ],
    };
  };

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

  if (dashboardLoading) return <LoadingSpinner />;

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Parking Spot Finder</title>
      </Helmet>

      {/* App Bar */}
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <DirectionsCar sx={{ fontSize: 32, mr: 2 }} />
            <Typography variant="h6" component="h1" fontWeight="bold">
              ParkFinder Admin
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
                Admin Dashboard
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Manage users, spots, bookings, and system settings
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
                          {dashboardData?.data?.totalUsers || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Users
                        </Typography>
                      </Box>
                      <People sx={{ fontSize: 48, color: 'primary.main' }} />
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
                          {dashboardData?.data?.totalSpots || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Parking Spots
                        </Typography>
                      </Box>
                      <LocalParking sx={{ fontSize: 48, color: 'success.main' }} />
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
                          {dashboardData?.data?.totalBookings || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Bookings
                        </Typography>
                      </Box>
                      <BookOnline sx={{ fontSize: 48, color: 'warning.main' }} />
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
                          ${dashboardData?.data?.totalRevenue?.[0]?.total || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Revenue
                        </Typography>
                      </Box>
                      <Payment sx={{ fontSize: 48, color: 'info.main' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>

          {/* Charts */}
          <motion.div variants={itemVariants}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Monthly Overview
                    </Typography>
                    {generateChartData() && (
                      <Line data={generateChartData()} options={chartOptions} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dashboardData?.data?.recentBookings?.slice(0, 5).map((booking) => (
                        <Box key={booking._id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2">{booking.user?.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(booking.createdAt), 'MMM dd, HH:mm')}
                            </Typography>
                          </Box>
                          {getStatusChip(booking.status, 'booking')}
                        </Box>
                      ))}
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
                  <Tab label="Users" />
                  <Tab label="Parking Spots" />
                  <Tab label="Bookings" />
                  <Tab label="Payments" />
                  <Tab label="Analytics" />
                </Tabs>
              </Box>

              <CardContent>
                {/* Users Tab */}
                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      User Management
                    </Typography>
                    {usersLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>User</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Role</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Joined</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {usersData?.data?.users?.map((user) => (
                              <TableRow key={user._id}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar src={user.avatar} sx={{ mr: 2 }}>
                                      {user.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography>{user.name}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                  {getStatusChip(user.isActive ? 'active' : 'inactive', 'user')}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    onClick={(e) => handleActionMenuOpen(e, user, 'user')}
                                  >
                                    <MoreVert />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* Parking Spots Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Parking Spot Management
                    </Typography>
                    {spotsLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Spot</TableCell>
                              <TableCell>Owner</TableCell>
                              <TableCell>Address</TableCell>
                              <TableCell>Rate</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {spotsData?.data?.spots?.map((spot) => (
                              <TableRow key={spot._id}>
                                <TableCell>
                                  <Typography fontWeight="bold">{spot.name}</Typography>
                                </TableCell>
                                <TableCell>{spot.owner?.name}</TableCell>
                                <TableCell>{spot.address}</TableCell>
                                <TableCell>${spot.hourlyRate}/hr</TableCell>
                                <TableCell>
                                  {getStatusChip(spot.isActive ? 'active' : 'inactive', 'spot')}
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    onClick={(e) => handleActionMenuOpen(e, spot, 'spot')}
                                  >
                                    <MoreVert />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* Bookings Tab */}
                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Booking Management
                    </Typography>
                    {bookingsLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Booking ID</TableCell>
                              <TableCell>User</TableCell>
                              <TableCell>Spot</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {bookingsData?.data?.bookings?.map((booking) => (
                              <TableRow key={booking._id}>
                                <TableCell>{booking._id.slice(-8)}</TableCell>
                                <TableCell>{booking.user?.name}</TableCell>
                                <TableCell>{booking.parkingSpot?.name}</TableCell>
                                <TableCell>
                                  {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>${booking.totalAmount}</TableCell>
                                <TableCell>
                                  {getStatusChip(booking.status, 'booking')}
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    onClick={(e) => handleActionMenuOpen(e, booking, 'booking')}
                                  >
                                    <MoreVert />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* Payments Tab */}
                {tabValue === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Payment Management
                    </Typography>
                    {paymentsLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Payment ID</TableCell>
                              <TableCell>User</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Method</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paymentsData?.data?.payments?.map((payment) => (
                              <TableRow key={payment._id}>
                                <TableCell>{payment._id.slice(-8)}</TableCell>
                                <TableCell>{payment.user?.name}</TableCell>
                                <TableCell>${payment.amount}</TableCell>
                                <TableCell>{payment.paymentMethod}</TableCell>
                                <TableCell>
                                  {getStatusChip(payment.status, 'payment')}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    onClick={(e) => handleActionMenuOpen(e, payment, 'payment')}
                                  >
                                    <MoreVert />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* Analytics Tab */}
                {tabValue === 4 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Advanced Analytics
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Revenue Trends
                            </Typography>
                            {generateChartData() && (
                              <Bar data={generateChartData()} options={chartOptions} />
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              User Distribution
                            </Typography>
                            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography color="text.secondary">
                                Chart data will be displayed here
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </Container>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        {actionType === 'user' && (
          <>
            <MenuItem onClick={() => openActionDialog('banUser')}>
              <Block sx={{ mr: 1 }} /> Ban User
            </MenuItem>
            <MenuItem onClick={() => openActionDialog('unbanUser')}>
              <CheckCircle sx={{ mr: 1 }} /> Unban User
            </MenuItem>
          </>
        )}
        {actionType === 'spot' && (
          <>
            <MenuItem onClick={() => openActionDialog('approveSpot')}>
              <CheckCircle sx={{ mr: 1 }} /> Approve
            </MenuItem>
            <MenuItem onClick={() => openActionDialog('rejectSpot')}>
              <Cancel sx={{ mr: 1 }} /> Reject
            </MenuItem>
            <MenuItem onClick={() => openActionDialog('deleteSpot')}>
              <Delete sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </>
        )}
        {actionType === 'booking' && (
          <>
            <MenuItem onClick={() => openActionDialog('updateBookingStatus')}>
              <Edit sx={{ mr: 1 }} /> Update Status
            </MenuItem>
          </>
        )}
        {actionType === 'payment' && (
          <>
            <MenuItem onClick={() => openActionDialog('processRefund')}>
              <Payment sx={{ mr: 1 }} /> Process Refund
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onClose={() => setShowActionDialog(false)}>
        <DialogTitle>
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to perform this action?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActionDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => handleAction(actionType)} 
            variant="contained" 
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
