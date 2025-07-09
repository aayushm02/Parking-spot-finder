import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  LinearProgress,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  LocationOn,
  AccessTime,
  DriveEta,
  QrCode,
  MoreVert,
  Cancel,
  Edit,
  Rate,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Payment,
  Receipt,
  Extension,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';

const BookingCard = ({ 
  booking, 
  onUpdate, 
  onCancel, 
  onCheckIn, 
  onCheckOut, 
  onExtend, 
  onRate,
  compact = false,
  showActions = true 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [extendHours, setExtendHours] = useState(1);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { color: 'warning', icon: <Schedule />, label: 'Pending' },
      confirmed: { color: 'info', icon: <CheckCircle />, label: 'Confirmed' },
      active: { color: 'success', icon: <CheckCircle />, label: 'Active' },
      completed: { color: 'success', icon: <CheckCircle />, label: 'Completed' },
      cancelled: { color: 'error', icon: <Cancel />, label: 'Cancelled' },
      no_show: { color: 'error', icon: <Warning />, label: 'No Show' },
    };

    return statusMap[status] || { color: 'default', icon: <Schedule />, label: 'Unknown' };
  };

  const getPaymentStatusInfo = (paymentStatus) => {
    const statusMap = {
      pending: { color: 'warning', label: 'Payment Pending' },
      paid: { color: 'success', label: 'Paid' },
      failed: { color: 'error', label: 'Payment Failed' },
      refunded: { color: 'info', label: 'Refunded' },
    };

    return statusMap[paymentStatus] || { color: 'default', label: 'Unknown' };
  };

  const canCheckIn = () => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDiff = differenceInMinutes(now, startTime);
    
    return booking.status === 'confirmed' && 
           booking.paymentStatus === 'paid' && 
           timeDiff >= -30 && timeDiff <= 30;
  };

  const canCheckOut = () => {
    return booking.status === 'active';
  };

  const canCancel = () => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const hoursUntilStart = differenceInMinutes(startTime, now) / 60;
    
    return ['pending', 'confirmed'].includes(booking.status) && hoursUntilStart > 1;
  };

  const canExtend = () => {
    return booking.status === 'active';
  };

  const canRate = () => {
    return booking.status === 'completed' && !booking.rating?.score;
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await bookingService.cancelBooking(booking._id, cancelReason);
      onCancel?.(booking._id);
      toast.success('Booking cancelled successfully');
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cancelling booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtend = async () => {
    setIsProcessing(true);
    try {
      await bookingService.extendBooking(booking._id, extendHours);
      onExtend?.(booking._id, extendHours);
      toast.success('Booking extended successfully');
      setShowExtendDialog(false);
      setExtendHours(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error extending booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckIn = async () => {
    setIsProcessing(true);
    try {
      await bookingService.checkIn(booking._id);
      onCheckIn?.(booking._id);
      toast.success('Checked in successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error checking in');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    setIsProcessing(true);
    try {
      await bookingService.checkOut(booking._id);
      onCheckOut?.(booking._id);
      toast.success('Checked out successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error checking out');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRate = async () => {
    setIsProcessing(true);
    try {
      await bookingService.rateBooking(booking._id, rating, ratingComment);
      onRate?.(booking._id, rating, ratingComment);
      toast.success('Rating submitted successfully');
      setShowRatingDialog(false);
      setRating(5);
      setRatingComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting rating');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusInfo = getStatusInfo(booking.status);
  const paymentInfo = getPaymentStatusInfo(booking.paymentStatus);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {booking.parkingSpot?.name || 'Parking Spot'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {format(new Date(booking.startTime), 'PPP')} • {format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip size="small" {...statusInfo} label={statusInfo.label} />
                  <Chip size="small" {...paymentInfo} label={paymentInfo.label} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" color="primary">
                  ${booking.totalAmount}
                </Typography>
                {showActions && (
                  <IconButton onClick={handleMenuClick}>
                    <MoreVert />
                  </IconButton>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="h3" fontWeight="bold">
                {booking.parkingSpot?.name || 'Parking Spot'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {booking.parkingSpot?.address || 'Address not available'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                icon={statusInfo.icon} 
                label={statusInfo.label} 
                color={statusInfo.color}
                size="small"
              />
              {showActions && (
                <IconButton onClick={handleMenuClick}>
                  <MoreVert />
                </IconButton>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Start Time
              </Typography>
              <Typography variant="body1">
                {format(new Date(booking.startTime), 'PPP pp')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                End Time
              </Typography>
              <Typography variant="body1">
                {format(new Date(booking.endTime), 'PPP pp')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Vehicle
              </Typography>
              <Typography variant="body1">
                {booking.vehicleInfo?.licensePlate} ({booking.vehicleInfo?.type})
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Payment Status
              </Typography>
              <Chip 
                label={paymentInfo.label} 
                color={paymentInfo.color}
                size="small"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary">
              Total: ${booking.totalAmount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {booking._id?.slice(-8)}
            </Typography>
          </Box>

          {booking.status === 'active' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Session Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, (Date.now() - new Date(booking.startTime)) / (new Date(booking.endTime) - new Date(booking.startTime)) * 100)} 
              />
            </Box>
          )}

          {booking.rating?.score && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Your Rating: {booking.rating.score}/5
              </Typography>
              {booking.rating.comment && (
                <Typography variant="body2">
                  "{booking.rating.comment}"
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        {showActions && (
          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Button
              size="small"
              startIcon={<QrCode />}
              onClick={() => setShowQRCode(true)}
            >
              QR Code
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canCheckIn() && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCheckIn}
                  disabled={isProcessing}
                >
                  Check In
                </Button>
              )}
              
              {canCheckOut() && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCheckOut}
                  disabled={isProcessing}
                >
                  Check Out
                </Button>
              )}
              
              {canRate() && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowRatingDialog(true)}
                >
                  Rate
                </Button>
              )}
            </Box>
          </CardActions>
        )}
      </Card>

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => setShowQRCode(true)}>
          <QrCode sx={{ mr: 1 }} /> Show QR Code
        </MenuItem>
        {canExtend() && (
          <MenuItem onClick={() => setShowExtendDialog(true)}>
            <Extension sx={{ mr: 1 }} /> Extend Booking
          </MenuItem>
        )}
        {canCancel() && (
          <MenuItem onClick={() => setShowCancelDialog(true)}>
            <Cancel sx={{ mr: 1 }} /> Cancel Booking
          </MenuItem>
        )}
      </Menu>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onClose={() => setShowQRCode(false)}>
        <DialogTitle>Booking QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <QRCodeSVG 
            value={booking.qrCode || JSON.stringify({ bookingId: booking._id })}
            size={200}
          />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Show this QR code to access the parking spot
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRCode(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to cancel this booking?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCancel} 
            color="error" 
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={showExtendDialog} onClose={() => setShowExtendDialog(false)}>
        <DialogTitle>Extend Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            How many additional hours would you like to add?
          </Typography>
          <TextField
            type="number"
            fullWidth
            label="Additional Hours"
            value={extendHours}
            onChange={(e) => setExtendHours(Number(e.target.value))}
            inputProps={{ min: 1, max: 24 }}
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Additional cost: ${(extendHours * (booking.parkingSpot?.hourlyRate || 0)).toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExtendDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleExtend} 
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? 'Extending...' : 'Confirm Extension'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onClose={() => setShowRatingDialog(false)}>
        <DialogTitle>Rate Your Experience</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            How was your parking experience?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Rating:</Typography>
            <TextField
              type="number"
              size="small"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              inputProps={{ min: 1, max: 5 }}
              sx={{ width: 80 }}
            />
            <Typography variant="body2" sx={{ ml: 1 }}>/ 5</Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (optional)"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRatingDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRate} 
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default BookingCard;
