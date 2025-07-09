import React, { useState, useEffect } from 'react';
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
  CardActions,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CreditCard,
  Payment,
  Receipt,
  AttachMoney,
  History,
  Visibility,
  Download,
  CheckCircle,
  Error,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PaymentPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [newCardForm, setNewCardForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchPaymentHistory();
    fetchPaymentMethods();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await paymentService.getPaymentHistory();
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentService.getPaymentMethods();
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newCardForm.cardNumber || !newCardForm.expiryDate || !newCardForm.cvv || !newCardForm.cardholderName) {
      setNotification({
        open: true,
        message: 'Please fill in all card details',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await paymentService.addPaymentMethod(newCardForm);
      setNotification({
        open: true,
        message: 'Payment method added successfully!',
        severity: 'success'
      });
      setShowAddCard(false);
      setNewCardForm({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      });
      fetchPaymentMethods();
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error adding payment method',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (methodId) => {
    setLoading(true);
    try {
      await paymentService.removePaymentMethod(methodId);
      setNotification({
        open: true,
        message: 'Payment method removed successfully!',
        severity: 'success'
      });
      fetchPaymentMethods();
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error removing payment method',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await paymentService.downloadReceipt(paymentId);
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error downloading receipt',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'pending':
        return <Payment />;
      case 'failed':
        return <Error />;
      case 'refunded':
        return <Cancel />;
      default:
        return <Payment />;
    }
  };

  const formatCardNumber = (cardNumber) => {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Payment Center
      </Typography>

      <Grid container spacing={3}>
        {/* Payment Methods */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Payment Methods
              </Typography>
              <Button
                variant="contained"
                startIcon={<CreditCard />}
                onClick={() => setShowAddCard(true)}
              >
                Add Card
              </Button>
            </Box>

            {paymentMethods.length > 0 ? (
              <RadioGroup value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
                {paymentMethods.map((method) => (
                  <Card key={method._id} sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <CardContent>
                      <FormControlLabel
                        value={method._id}
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CreditCard sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="body1">
                                {formatCardNumber(method.cardNumber)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {method.cardholderName} • Expires {method.expiryDate}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemovePaymentMethod(method._id)}
                      >
                        Remove
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </RadioGroup>
            ) : (
              <Alert severity="info">
                No payment methods added yet. Add a card to make payments.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              mb: 3
            }}
          >
            <Typography variant="h6" gutterBottom>
              Payment Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1">Total Spent This Month:</Typography>
              <Typography variant="h6" color="primary">
                ${paymentHistory.reduce((sum, payment) => 
                  payment.status === 'completed' && 
                  new Date(payment.createdAt).getMonth() === new Date().getMonth() 
                    ? sum + payment.amount 
                    : sum, 0
                ).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1">Total Transactions:</Typography>
              <Typography variant="h6">
                {paymentHistory.length}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Successful Payments:</Typography>
              <Typography variant="h6" color="success.main">
                {paymentHistory.filter(p => p.status === 'completed').length}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Payment History */}
        <Grid item xs={12}>
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
              Payment History
            </Typography>
            {paymentHistory.length > 0 ? (
              <List>
                {paymentHistory.map((payment) => (
                  <ListItem key={payment._id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(payment.status)}
                          <Typography variant="body1">
                            ${payment.amount.toFixed(2)}
                          </Typography>
                          <Chip
                            label={payment.status}
                            size="small"
                            color={getStatusColor(payment.status)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {payment.description || 'Parking booking payment'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentDetails(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      {payment.status === 'completed' && (
                        <IconButton
                          edge="end"
                          onClick={() => handleDownloadReceipt(payment._id)}
                        >
                          <Download />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No payment history found.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onClose={() => setShowAddCard(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Payment Method</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                value={newCardForm.cardNumber}
                onChange={(e) => setNewCardForm({ ...newCardForm, cardNumber: e.target.value })}
                placeholder="1234 5678 9012 3456"
                InputProps={{
                  startAdornment: <CreditCard sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={newCardForm.cardholderName}
                onChange={(e) => setNewCardForm({ ...newCardForm, cardholderName: e.target.value })}
                placeholder="John Doe"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                value={newCardForm.expiryDate}
                onChange={(e) => setNewCardForm({ ...newCardForm, expiryDate: e.target.value })}
                placeholder="MM/YY"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                value={newCardForm.cvv}
                onChange={(e) => setNewCardForm({ ...newCardForm, cvv: e.target.value })}
                placeholder="123"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCard(false)}>Cancel</Button>
          <Button onClick={handleAddPaymentMethod} variant="contained" disabled={loading}>
            Add Card
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onClose={() => setShowPaymentDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {selectedPayment.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date:</strong> {new Date(selectedPayment.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Transaction ID:</strong> {selectedPayment._id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {selectedPayment.description || 'Parking booking payment'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default PaymentPage;
