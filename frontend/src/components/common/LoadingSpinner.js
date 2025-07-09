import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: 'white',
            mb: 2,
          }}
        />
        <Typography
          variant="h6"
          color="white"
          align="center"
          sx={{ 
            fontWeight: 500,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          {message}
        </Typography>
      </motion.div>
    </Box>
  );
};

export default LoadingSpinner;
