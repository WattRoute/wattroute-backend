const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WattRoute Backend v2.1 running!' });
});

// ============================================
// DIRECTIONS API - Google Maps
// ============================================
app.post('/api/directions', async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Missing origin or destination' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
    
    if (waypoints && waypoints.length > 0) {
      url += `&waypoints=${waypoints.map(wp => encodeURIComponent(wp)).join('|')}`;
    }

    console.log('Fetching directions...');
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google API error:', data.status, data.error_message);
      return res.status(400).json({ 
        error: `Google API error: ${data.status}`,
        details: data.error_message 
      });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    console.log(`Route: ${leg.distance.text}, ${leg.duration.text}`);
    
    res.json({
      success: true,
      route: {
        distance: leg.distance,
        duration: leg.duration,
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps,
        overview_polyline: route.overview_polyline,
        bounds: route.bounds,
        legs: route.legs
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch directions', details: error.message });
  }
});

// ============================================
// CHARGING STATIONS API - Open Charge Map
// ============================================
app.get('/api/charging-stations', async (req, res) => {
  try {
    const { latitude, longitude, distance = 10, maxresults = 50, countrycode = 'GB', levelid } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }

    let url = `https://api.openchargemap.io/v3/poi/?output=json&compact=true&verbose=false`;
    url += `&latitude=${latitude}&longitude=${longitude}`;
    url += `&distance=${distance}&distanceunit=KM&maxresults=${maxresults}`;
    url += `&countrycode=${countrycode}`;
    if (levelid) url += `&levelid=${levelid}`;

    console.log('Fetching charging stations...');
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WattRoute/2.0' }
    });

    const stations = await response.json();
    console.log(`Found ${stations.length} stations`);
    
    res.json({ success: true, count: stations.length, stations });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch stations', details: error.message });
  }
});

// ============================================
// CHARGING STATIONS ALONG ROUTE
// ============================================
app.post('/api/charging-stations-along-route', async (req, res) => {
  try {
    const { points, distance = 5, countrycode = 'GB', levelid } = req.body;

    if (!points || points.length === 0) {
      return res.status(400).json({ error: 'Missing points array' });
    }

    // Sample every 10th point
    const sampleInterval = Math.max(1, Math.floor(points.length / 10));
    const sampledPoints = points.filter((_, i) => i % sampleInterval === 0);
    
    console.log(`Searching ${sampledPoints.length} points along route...`);
    
    const allStations = new Map();
    
    for (const point of sampledPoints) {
      let url = `https://api.openchargemap.io/v3/poi/?output=json&compact=true&verbose=false`;
      url += `&latitude=${point.lat}&longitude=${point.lng}`;
      url += `&distance=${distance}&distanceunit=KM&maxresults=20`;
      url += `&countrycode=${countrycode}`;
      if (levelid) url += `&levelid=${levelid}`;

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'WattRoute/2.0' }
        });
        
        if (response.ok) {
          const stations = await response.json();
          stations.forEach(s => { if (s.ID) allStations.set(s.ID, s); });
        }
      } catch (e) {
        console.warn('Point fetch failed:', e.message);
      }
      
      await new Promise(r => setTimeout(r, 100)); // Rate limit
    }

    const uniqueStations = Array.from(allStations.values());
    console.log(`Found ${uniqueStations.length} unique stations`);
    
    res.json({ success: true, count: uniqueStations.length, stations: uniqueStations });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch stations', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`WattRoute Backend v2.1 running on port ${PORT}`);
});
