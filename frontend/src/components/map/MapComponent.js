import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Fab, IconButton } from '@mui/material';
import { MyLocation, Add, Remove, Layers } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different spot types
const createCustomIcon = (color = '#3f51b5', isAvailable = true) => {
  return L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${isAvailable ? color : '#f44336'};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

// Component to handle map center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const MapComponent = ({ 
  center, 
  spots = [], 
  onSpotClick,
  zoom = 13,
  height = '400px',
  loading = false,
  showControls = true,
  onLocationChange
}) => {
  const mapRef = useRef(null);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          onLocationChange?.(newCenter);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleZoomIn = () => {
    const map = mapRef.current;
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    const map = mapRef.current;
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.100'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!center) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'grey.100',
          flexDirection: 'column'
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Location not available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please enable location services or search for a location
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'center', 
      height: '110%', 
      width: '100%', 
      overflow: 'hidden',
      '& .leaflet-container': {
        height: '100%',
        width: '100%'
      }
    }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ 
          height: '100%',
          width: '100%', 
          display: 'flex',
          border: 'none',
          outline: 'none'
        }}
        ref={mapRef}
      >
        <MapController center={center} zoom={zoom} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User location marker */}
        <Marker
          position={[center.lat, center.lng]}
          icon={createCustomIcon('#2196f3')}
        >
          <Popup>
            <Typography variant="body2">
              Your Location
            </Typography>
          </Popup>
        </Marker>
        
        {/* Parking spot markers */}
        {spots.map((spot) => (
          <Marker
            key={spot._id}
            position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
            icon={createCustomIcon('#4caf50', spot.isAvailable)}
            eventHandlers={{
              click: () => onSpotClick?.(spot),
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {spot.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {spot.address}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Rate:</strong> ${spot.hourlyRate}/hour
                </Typography>
                <Typography 
                  variant="body2" 
                  color={spot.isAvailable ? 'success.main' : 'error.main'}
                  gutterBottom
                >
                  <strong>Status:</strong> {spot.isAvailable ? 'Available' : 'Occupied'}
                </Typography>
                {spot.features && spot.features.length > 0 && (
                  <Typography variant="body2">
                    <strong>Features:</strong> {spot.features.join(', ')}
                  </Typography>
                )}
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {showControls && (
        <>
          {/* Location button */}
          <Fab
            size="small"
            color="primary"
            onClick={handleGetLocation}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <MyLocation />
          </Fab>
          
          {/* Zoom controls */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={handleZoomIn}
              sx={{
                bgcolor: 'white',
                '&:hover': { bgcolor: 'grey.100' },
                boxShadow: 1,
              }}
            >
              <Add />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleZoomOut}
              sx={{
                bgcolor: 'white',
                '&:hover': { bgcolor: 'grey.100' },
                boxShadow: 1,
              }}
            >
              <Remove />
            </IconButton>
          </Box>
          
          {/* Legend */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000,
              bgcolor: 'white',
              p: 1,
              borderRadius: 1,
              boxShadow: 1,
              minWidth: 120,
            }}
          >
            <Typography variant="caption" display="block" gutterBottom>
              Legend
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: '#2196f3',
                  borderRadius: '50%',
                  mr: 1,
                }}
              />
              <Typography variant="caption">Your Location</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: '#4caf50',
                  borderRadius: '10%',
                  mr: 1,
                }}
              />
              <Typography variant="caption">Available</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: '#f44336',
                  borderRadius: '50%',
                  mr: 1,
                }}
              />
              <Typography variant="caption">Occupied</Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default MapComponent;
