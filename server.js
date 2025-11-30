require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend domain
app.use(cors({
  origin: ['https://wattroute.co.uk', 'https://www.wattroute.co.uk', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WattRoute backend is running' });
});

// Google Maps Directions API proxy endpoint
app.post('/api/directions', async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origin and destination are required' 
      });
    }

    // Build the Google Maps API URL
    const params = {
      origin: origin,
      destination: destination,
      key: process.env.GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      units: 'metric'
    };

    // Add waypoints if provided (for charging stops)
    if (waypoints && waypoints.length > 0) {
      params.waypoints = waypoints.join('|');
      params.optimize = 'false'; // We want specific order for charging stops
    }

    console.log('Requesting directions from Google Maps API...');
    console.log('Origin:', origin);
    console.log('Destination:', destination);
    if (waypoints) console.log('Waypoints:', waypoints.length);

    // Call Google Maps Directions API
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: params
    });

    // Check if we got a valid response
    if (response.data.status !== 'OK') {
      console.error('Google Maps API error:', response.data.status);
      return res.status(400).json({ 
        error: 'Google Maps API error',
        status: response.data.status,
        message: response.data.error_message || 'Unable to calculate route'
      });
    }

    console.log('Successfully got route from Google Maps');
    
    // Return the directions data
    res.json(response.data);

  } catch (error) {
    console.error('Error calling Google Maps API:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Geocoding proxy endpoint (for converting addresses to coordinates)
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing required parameter: address' 
      });
    }

    console.log('Geocoding address:', address);

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'uk' // Prioritize UK results
      }
    });

    if (response.data.status !== 'OK') {
      console.error('Geocoding error:', response.data.status);
      return res.status(400).json({ 
        error: 'Geocoding error',
        status: response.data.status
      });
    }

    console.log('Successfully geocoded address');
    res.json(response.data);

  } catch (error) {
    console.error('Error geocoding:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚗⚡ WattRoute backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Google Maps API Key configured: ${process.env.GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}`);
});
