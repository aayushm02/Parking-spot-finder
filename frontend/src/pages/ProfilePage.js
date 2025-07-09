import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  LocationOn,
  Security,
  Notifications,
  History,
  AccountCircle,
  CameraAlt
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { bookingService } from '../services/bookingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notifications: true,
    emailNotifications: true,
    smsNotifications: false
  });
  const [bookingHistory, setBookingHistory] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        notifications: user.notifications ?? true,
        emailNotifications: user.emailNotifications ?? true,
        smsNotifications: user.smsNotifications ?? false
      });
      fetchBookingHistory();
    }
  }, [user]);

  const fetchBookingHistory = async () => {
    try {
      const response = await bookingService.getUserBookings();
      setBookingHistory(response.data.slice(0, 5)); // Show last 5 bookings
    } catch (error) {
      console.error('Error fetching booking history:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(profileData);
      updateUser(response.data);
      setEditMode(false);
      setNotification({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error updating profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // This would typically open a password change dialog
    setNotification({
      open: true,
      message: 'Password change feature coming soon!',
      severity: 'info'
    });
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle avatar upload
      setNotification({
        open: true,
        message: 'Avatar upload feature coming soon!',
        severity: 'info'
      });
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Personal Information
              </Typography>
              {!editMode ? (
                <IconButton onClick={() => setEditMode(true)}>
                  <Edit />
                </IconButton>
              ) : (
                <Box>
                  <IconButton onClick={handleSaveProfile} disabled={loading}>
                    <Save />
                  </IconButton>
                  <IconButton onClick={() => setEditMode(false)}>
                    <Cancel />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={profileData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={profileData.notifications}
                    onChange={(e) => handleInputChange('notifications', e.target.checked)}
                    disabled={!editMode}
                  />
                }
                label="Enable Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profileData.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    disabled={!editMode}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profileData.smsNotifications}
                    onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                    disabled={!editMode}
                  />
                }
                label="SMS Notifications"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Profile Avatar and Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              mb: 3
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={user.avatar}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  fontSize: '3rem'
                }}
              >
                {user.name?.charAt(0)}
              </Avatar>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: -8,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                <CameraAlt />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarUpload}
                />
              </IconButton>
            </Box>
            <Typography variant="h6" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Security />}
              onClick={handlePasswordChange}
              fullWidth
              sx={{ mb: 1 }}
            >
              Change Password
            </Button>
          </Paper>

          {/* Recent Bookings */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Bookings
            </Typography>
            {bookingHistory.length > 0 ? (
              <List>
                {bookingHistory.map((booking) => (
                  <ListItem key={booking._id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <History />
                    </ListItemIcon>
                    <ListItemText
                      primary={booking.parkingSpot?.name || 'Parking Spot'}
                      secondary={`${new Date(booking.startTime).toLocaleDateString()} - ${booking.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent bookings
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

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

export default ProfilePage;
