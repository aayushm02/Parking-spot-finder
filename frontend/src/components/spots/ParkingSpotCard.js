import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Rating,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  LocationOn,
  AccessTime,
  LocalParking,
  Security,
  ElectricCar,
  Accessible,
  DirectionsWalk,
  Favorite,
  FavoriteBorder,
  Share,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const ParkingSpotCard = ({ 
  spot, 
  onBook, 
  onViewDetails, 
  onToggleFavorite, 
  isFavorite = false,
  compact = false,
  showOwner = false 
}) => {
  const formatFeatures = (features) => {
    const featureMap = {
      security: { icon: <Security />, label: 'Security' },
      ev_charging: { icon: <ElectricCar />, label: 'EV Charging' },
      accessible: { icon: <Accessible />, label: 'Accessible' },
      '24_7': { icon: <AccessTime />, label: '24/7 Access' },
      covered: { icon: <LocalParking />, label: 'Covered' },
    };

    return features?.map(feature => featureMap[feature]).filter(Boolean) || [];
  };

  const getStatusChip = (status, isAvailable) => {
    if (!isAvailable) {
      return <Chip label="Occupied" color="error" size="small" />;
    }
    
    switch (status) {
      case 'available':
        return <Chip label="Available" color="success" size="small" />;
      case 'reserved':
        return <Chip label="Reserved" color="warning" size="small" />;
      default:
        return <Chip label="Available" color="success" size="small" />;
    }
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card sx={{ display: 'flex', mb: 2, height: 120 }}>
          {spot.images?.[0] && (
            <CardMedia
              component="img"
              sx={{ width: 120, flexShrink: 0 }}
              image={spot.images[0]}
              alt={spot.name}
            />
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <CardContent sx={{ flex: 1, py: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle1" component="h3" fontWeight="bold" noWrap>
                    {spot.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <LocationOn sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {spot.address}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" color="primary">
                      ${spot.hourlyRate}/hr
                    </Typography>
                    {getStatusChip(spot.status, spot.isAvailable)}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={spot.averageRating || 0} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({spot.totalReviews || 0})
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
              <Button size="small" onClick={() => onViewDetails(spot)}>
                Details
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                onClick={() => onBook(spot)}
                disabled={!spot.isAvailable}
              >
                Book
              </Button>
            </CardActions>
          </Box>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ position: 'relative' }}>
          {spot.images?.[0] ? (
            <CardMedia
              component="img"
              height="200"
              image={spot.images[0]}
              alt={spot.name}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.200',
              }}
            >
              <LocalParking sx={{ fontSize: 60, color: 'grey.400' }} />
            </Box>
          )}
          
          {/* Favorite and Share buttons */}
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            {onToggleFavorite && (
              <IconButton
                onClick={() => onToggleFavorite(spot)}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                }}
              >
                {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
              </IconButton>
            )}
          </Box>

          {/* Status badge */}
          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            {getStatusChip(spot.status, spot.isAvailable)}
          </Box>
        </Box>

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="h3" fontWeight="bold">
              {spot.name}
            </Typography>
            <Typography variant="h6" color="primary">
              ${spot.hourlyRate}/hr
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {spot.address}
            </Typography>
          </Box>

          {spot.distance && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DirectionsWalk sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {spot.distance} away
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={spot.averageRating || 0} readOnly size="small" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              ({spot.totalReviews || 0} reviews)
            </Typography>
          </Box>

          {/* Features */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, flex: 1 }}>
            {formatFeatures(spot.features).slice(0, 3).map((feature, index) => (
              <Chip
                key={index}
                icon={feature.icon}
                label={feature.label}
                size="small"
                variant="outlined"
              />
            ))}
            {spot.features?.length > 3 && (
              <Chip
                label={`+${spot.features.length - 3} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Owner info */}
          {showOwner && spot.owner && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                src={spot.owner.avatar} 
                alt={spot.owner.name}
                sx={{ width: 24, height: 24, mr: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Hosted by {spot.owner.name}
              </Typography>
            </Box>
          )}

          {/* Availability hours */}
          {spot.availability?.hours && (
            <Typography variant="caption" color="text.secondary">
              Available: {spot.availability.hours.start} - {spot.availability.hours.end}
            </Typography>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button size="small" onClick={() => onViewDetails(spot)}>
            View Details
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => onBook(spot)}
            disabled={!spot.isAvailable}
          >
            Book Now
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default ParkingSpotCard;
