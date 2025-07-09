import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Close,
  MyLocation,
  LocationOn
} from '@mui/icons-material';

const LocationModal = ({ open, onClose, onLocationSelect }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect({ latitude, longitude });
        setLoading(false);
        onClose();
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied by user.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Select Location</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box py={2}>
          <Typography variant="body1" gutterBottom>
            To find parking spots near you, please allow location access or select a location manually.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box mt={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <MyLocation />}
              onClick={handleGetCurrentLocation}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Getting Location...' : 'Use Current Location'}
            </Button>
            
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LocationOn />}
              onClick={() => {
                // For now, just close the modal - in a real app, you'd open a map picker
                onClose();
              }}
            >
              Select on Map
            </Button>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationModal;
