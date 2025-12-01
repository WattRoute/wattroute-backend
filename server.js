const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (you can restrict this later)
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WattRoute Backend is running!',
    version: '2.0.0',
    endpoints: ['/api/directions', '/api/charging-stations']
  });
});

// ===========================================
// DIRECTIONS API - Google Maps
// ===========================================
app.post('/api/directions', async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origin and destination' 
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured on server' 
      });
    }

    // Build the Google Directions API URL
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
    
    // Add waypoints if provided
    if (waypoints && waypoints.length > 0) {
      const waypointStr = waypoints.map(wp => encodeURIComponent(wp)).join('|');
      url += `&waypoints=${waypointStr}`;
    }

    console.log('Fetching directions from Google...');
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google API error:', data.status, data.error_message);
      return res.status(400).json({ 
        error: `Google API error: ${data.status}`,
        details: data.error_message 
      });
    }

    // Extract the route information
    const route = data.routes[0];
    const leg = route.legs[0];

    const result = {
      success: true,
      route: {
        distance: leg.distance,
        duration: leg.duration,
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps,
        overview_polyline: route.overview_polyline,
        bounds: route.bounds,
        // Include all legs if there are waypoints
        legs: route.legs
      },
      // Include raw response for debugging
      raw: data
    };

    console.log(`Route calculated: ${leg.distance.text}, ${leg.duration.text}`);
    res.json(result);

  } catch (error) {
    console.error('Error fetching directions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch directions', 
      details: error.message 
    });
  }
});

// ===========================================
// CHARGING STATIONS API - Open Charge Map
// ===========================================
app.get('/api/charging-stations', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      distance = 10, // km
      maxresults = 50,
      countrycode = 'GB',
      usagetypeid,
      levelid,
      connectiontypeid
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required parameters: latitude and longitude' 
      });
    }

    // Build Open Charge Map API URL
    let url = `https://api.openchargemap.io/v3/poi/?output=json&compact=true&verbose=false`;
    url += `&latitude=${latitude}`;
    url += `&longitude=${longitude}`;
    url += `&distance=${distance}`;
    url += `&distanceunit=KM`;
    url += `&maxresults=${maxresults}`;
    
    if (countrycode) url += `&countrycode=${countrycode}`;
    if (usagetypeid) url += `&usagetypeid=${usagetypeid}`;
    if (levelid) url += `&levelid=${levelid}`;
    if (connectiontypeid) url += `&connectiontypeid=${connectiontypeid}`;

    // Add API key if you have one (optional for Open Charge Map)
    const ocmKey = process.env.OPEN_CHARGE_MAP_API_KEY;
    if (ocmKey) {
      url += `&key=${ocmKey}`;
    }

    console.log('Fetching charging stations from Open Charge Map...');
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WattRoute/2.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Open Charge Map API error: ${response.status}`);
    }

    const stations = await response.json();
    
    console.log(`Found ${stations.length} charging stations`);
    res.json({
      success: true,
      count: stations.length,
      stations: stations
    });

  } catch (error) {
    console.error('Error fetching charging stations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch charging stations', 
      details: error.message 
    });
  }
});

// ===========================================
// CHARGING STATIONS ALONG ROUTE
// ===========================================
app.post('/api/charging-stations-along-route', async (req, res) => {
  try {
    const { 
      polyline,
      points, // Array of {lat, lng} points along route
      distance = 5, // km from route
      maxresults = 100,
      countrycode = 'GB',
      levelid // Filter by charger level (2=fast, 3=rapid)
    } = req.body;

    if (!points || points.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required parameter: points (array of coordinates along route)' 
      });
    }

    // Sample points along the route (every 50km or so)
    const sampleInterval = Math.max(1, Math.floor(points.length / 10));
    const sampledPoints = points.filter((_, i) => i % sampleInterval === 0);
    
    console.log(`Searching for stations at ${sampledPoints.length} points along route...`);
    
    // Fetch stations near each sampled point
    const allStations = new Map(); // Use Map to deduplicate by ID
    
    for (const point of sampledPoints) {
      let url = `https://api.openchargemap.io/v3/poi/?output=json&compact=true&verbose=false`;
      url += `&latitude=${point.lat}`;
      url += `&longitude=${point.lng}`;
      url += `&distance=${distance}`;
      url += `&distanceunit=KM`;
      url += `&maxresults=20`;
      url += `&countrycode=${countrycode}`;
      
      if (levelid) url += `&levelid=${levelid}`;

      const ocmKey = process.env.OPEN_CHARGE_MAP_API_KEY;
      if (ocmKey) url += `&key=${ocmKey}`;

      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'WattRoute/2.0'
          }
        });
        
        if (response.ok) {
          const stations = await response.json();
          stations.forEach(station => {
            if (station.ID) {
              allStations.set(station.ID, station);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to fetch stations for point:', e.message);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const uniqueStations = Array.from(allStations.values());
    console.log(`Found ${uniqueStations.length} unique charging stations along route`);
    
    res.json({
      success: true,
      count: uniqueStations.length,
      stations: uniqueStations
    });

  } catch (error) {
    console.error('Error fetching charging stations along route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch charging stations along route', 
      details: error.message 
    });
  }
});

// ===========================================
// GEOCODE ENDPOINT (bonus - for address lookup)
// ===========================================
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ 
        error: `Geocoding failed: ${data.status}`,
        details: data.error_message 
      });
    }

    res.json({
      success: true,
      results: data.results
    });

  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'Geocoding failed', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ WattRoute Backend v2.0 is running!                  ║
║                                                           ║
║   Port: ${PORT}                                              ║
║   Health: http://localhost:${PORT}/health                    ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/directions          - Get route from Google║
║   • GET  /api/charging-stations   - Get nearby stations  ║
║   • POST /api/charging-stations-along-route              ║
║   • GET  /api/geocode             - Address lookup       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});