const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'WattRoute Backend v2.2' });
});

// DIRECTIONS API
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
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK') {
      return res.status(400).json({ error: `Google API error: ${data.status}`, details: data.error_message });
    }
    const route = data.routes[0];
    const leg = route.legs[0];
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
    res.status(500).json({ error: 'Failed to fetch directions', details: error.message });
  }
});

// CHARGING STATIONS API
app.get('/api/charging-stations', async (req, res) => {
  try {
    const { latitude, longitude, distance = 10, maxresults = 50, countrycode = 'GB', levelid } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }
    const ocmKey = process.env.OPEN_CHARGE_MAP_API_KEY;
    let url = `https://api.openchargemap.io/v3/poi/?output=json&compact=true&verbose=false`;
    url += `&latitude=${latitude}&longitude=${longitude}`;
    url += `&distance=${distance}&distanceunit=KM&maxresults=${maxresults}`;
    url += `&countrycode=${countrycode}`;
    if (levelid) url += `&levelid=${levelid}`;
    if (ocmKey) url += `&key=${ocmKey}`;
    
    console.log('Fetching stations, API key present:', !!ocmKey);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WattRoute/2.0' }
    });
    const text = await response.text();
    try {
      const stations = JSON.parse(text);
      res.json({ success: true, count: stations.length, stations });
    } catch (e) {
      console.error('OCM response:', text.substring(0, 200));
      res.status(500).json({ error: 'Invalid response from OCM', details: text.substring(0, 100) });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stations', details: error.message });
  }
});

// CHARGING STATIONS ALONG ROUTE
app.post('/api/charging-stations-along-route', async (req, res) => {
  try {
    const { points, distance = 5, countrycode = 'GB', levelid } = req.body;
    if (!points || points.length === 0) {
      return res.status(400).json({ error: 'Missing points array' });
    }
    const sampleInterval = Math.max(1, Math.floor(points.length / 10));
    const sampledPoints = points.filter((_, i) => i % sampleInterval === 0);
    const allStations = new Map();
    const ocmKey = process.env.OPEN_CHARGE_MAP_API_KEY;
    
    for (const point of sampledPoints) {
      let url = `https://api.openchargemap.io/v3/poi/?output=json&compact=true&verbose=false`;
      url += `&latitude=${point.lat}&longitude=${point.lng}`;
      url += `&distance=${distance}&distanceunit=KM&maxresults=20`;
      url += `&countrycode=${countrycode}`;
      if (levelid) url += `&levelid=${levelid}`;
      if (ocmKey) url += `&key=${ocmKey}`;
      
      try {
        const response = await fetch(url, { headers: { 'User-Agent': 'WattRoute/2.0' } });
        const text = await response.text();
        try {
          const stations = JSON.parse(text);
          stations.forEach(s => { if (s.ID) allStations.set(s.ID, s); });
        } catch (e) {
          console.warn('Parse error for point:', e.message);
        }
      } catch (e) {
        console.warn('Fetch error:', e.message);
      }
      await new Promise(r => setTimeout(r, 150));
    }
    const uniqueStations = Array.from(allStations.values());
    res.json({ success: true, count: uniqueStations.length, stations: uniqueStations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stations', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`WattRoute Backend v2.2 running on port ${PORT}`);
});
