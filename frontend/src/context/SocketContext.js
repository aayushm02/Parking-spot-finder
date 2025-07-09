import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      newSocket.on('spot-availability-changed', (data) => {
        toast.success(`Parking spot availability updated: ${data.title}`);
      });

      newSocket.on('booking-update', (data) => {
        toast.info(`Booking update: ${data.message}`);
      });

      newSocket.on('payment-update', (data) => {
        if (data.status === 'succeeded') {
          toast.success('Payment successful!');
        } else if (data.status === 'failed') {
          toast.error('Payment failed. Please try again.');
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error occurred');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  // Function to join a location room for real-time updates
  const joinLocationRoom = (lat, lng) => {
    if (socket && isConnected) {
      socket.emit('join-location', { lat, lng });
    }
  };

  // Function to leave a location room
  const leaveLocationRoom = (lat, lng) => {
    if (socket && isConnected) {
      socket.emit('leave-location', { lat, lng });
    }
  };

  // Function to emit parking spot updates
  const emitSpotUpdate = (spotData) => {
    if (socket && isConnected) {
      socket.emit('parking-spot-update', spotData);
    }
  };

  // Function to emit booking updates
  const emitBookingUpdate = (bookingData) => {
    if (socket && isConnected) {
      socket.emit('booking-update', bookingData);
    }
  };

  const value = {
    socket,
    isConnected,
    joinLocationRoom,
    leaveLocationRoom,
    emitSpotUpdate,
    emitBookingUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
