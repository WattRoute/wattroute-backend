// routeUtils.js - Updated to use backend proxy for real Google Maps data

// Backend API URL - UPDATE THIS after deploying your backend
const BACKEND_API_URL = 'http://localhost:3001'; // Change to your deployed backend URL
// Examples:
// const BACKEND_API_URL = 'https://api.wattroute.co.uk'; // If using subdomain
// const BACKEND_API_URL = 'https://your-app.onrender.com'; // If using Render
// const BACKEND_API_URL = 'https://your-app.railway.app'; // If using Railway

/**
 * Calculate route using real Google Maps Directions API via backend proxy
 */
export async function calculateRouteWithGoogle(origin, destination, waypoints = []) {
  try {
    console.log('Calculating route via backend API...');
    
    const response = await fetch(`${BACKEND_API_URL}/api/directions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        waypoints: waypoints.map(wp => `${wp.lat},${wp.lng}`)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate route');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Extract polyline points for finding nearby charging stations
    const polyline = route.overview_polyline.points;
    const routeCoordinates = decodePolyline(polyline);

    return {
      distance: leg.distance.value, // meters
      duration: leg.duration.value, // seconds
      distanceText: leg.distance.text,
      durationText: leg.duration.text,
      polyline: polyline,
      coordinates: routeCoordinates,
      legs: route.legs,
      bounds: route.bounds
    };

  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

/**
 * Decode Google Maps polyline string to array of coordinates
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find minimum distance from a point to the route line
 */
function getMinDistanceToRoute(point, routeCoordinates) {
  let minDistance = Infinity;

  // Check distance to each segment of the route
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const segmentStart = routeCoordinates[i];
    const segmentEnd = routeCoordinates[i + 1];

    // Distance to segment
    const distance = pointToSegmentDistance(
      point.lat,
      point.lng,
      segmentStart.lat,
      segmentStart.lng,
      segmentEnd.lat,
      segmentEnd.lng
    );

    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return calculateDistance(px, py, xx, yy);
}

/**
 * Find charging stations along the route
 */
export async function findChargingStationsAlongRoute(
  routeData,
  allStations,
  maxDistanceFromRoute = 10 // km
) {
  const routeCoordinates = routeData.coordinates;
  const stationsAlongRoute = [];

  for (const station of allStations) {
    const distanceToRoute = getMinDistanceToRoute(
      { lat: station.AddressInfo.Latitude, lng: station.AddressInfo.Longitude },
      routeCoordinates
    );

    if (distanceToRoute <= maxDistanceFromRoute) {
      stationsAlongRoute.push({
        ...station,
        distanceFromRoute: distanceToRoute
      });
    }
  }

  return stationsAlongRoute;
}

/**
 * Score and rank charging stations
 */
export function scoreAndRankStations(stations) {
  return stations
    .map((station) => {
      let score = 100;

      // Distance penalty (0-10km)
      const distancePenalty = (station.distanceFromRoute / 10) * 30;
      score -= distancePenalty;

      // Power level bonus
      const maxPower = getMaxPowerKW(station);
      if (maxPower >= 150) score += 30; // Ultra-rapid
      else if (maxPower >= 50) score += 20; // Rapid
      else if (maxPower >= 22) score += 10; // Fast
      else score -= 10; // Slow

      // Number of chargers bonus
      const chargerCount = station.Connections?.length || 1;
      score += Math.min(chargerCount * 2, 10);

      // Service station bonus
      if (station.AddressInfo.Title?.toLowerCase().includes('services')) {
        score += 15;
      }

      // Operational status
      if (station.StatusType?.Title?.toLowerCase() !== 'operational') {
        score -= 50;
      }

      // Network reliability (preferred networks)
      const preferredNetworks = ['gridserve', 'ionity', 'tesla', 'bp pulse'];
      const networkName = station.OperatorInfo?.Title?.toLowerCase() || '';
      if (preferredNetworks.some((net) => networkName.includes(net))) {
        score += 10;
      }

      return { ...station, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Get maximum power rating from station connections
 */
function getMaxPowerKW(station) {
  if (!station.Connections || station.Connections.length === 0) return 0;

  return Math.max(
    ...station.Connections.map(
      (conn) => conn.PowerKW || conn.Amps * conn.Voltage / 1000 || 0
    )
  );
}

/**
 * Calculate estimated charging time based on power level
 */
export function estimateChargingTime(powerKW, batterySize = 75) {
  // Simplified calculation: assume charging from 20% to 80% (60% of battery)
  const chargeNeeded = batterySize * 0.6; // kWh
  const chargingEfficiency = 0.9; // 90% efficiency

  const timeHours = chargeNeeded / (powerKW * chargingEfficiency);
  return timeHours * 60; // Convert to minutes
}

/**
 * Estimate charging cost
 */
export function estimateChargingCost(powerKW, chargingTimeMinutes) {
  // UK average charging costs (pence per kWh)
  let costPerKWh;
  if (powerKW >= 150) costPerKWh = 79; // Ultra-rapid
  else if (powerKW >= 50) costPerKWh = 67; // Rapid
  else if (powerKW >= 22) costPerKWh = 45; // Fast
  else costPerKWh = 30; // Slow

  const energyUsed = (powerKW * chargingTimeMinutes) / 60;
  return (energyUsed * costPerKWh) / 100; // Convert pence to pounds
}

/**
 * Calculate route with charging stops
 */
export async function calculateRouteWithCharging(
  origin,
  destination,
  routeType = 'balanced',
  allStations,
  vehicleRange = 300 // km
) {
  try {
    // First, get the basic route without charging stops
    const baseRoute = await calculateRouteWithGoogle(origin, destination);
    
    // Find stations along the route
    const stationsAlongRoute = await findChargingStationsAlongRoute(
      baseRoute,
      allStations
    );

    // Score and rank stations
    const rankedStations = scoreAndRankStations(stationsAlongRoute);

    // Select charging stops based on route type
    let selectedStations = [];
    
    if (routeType === 'cheapest') {
      // Prefer slower, cheaper chargers
      selectedStations = rankedStations
        .filter((s) => {
          const maxPower = getMaxPowerKW(s);
          return maxPower < 150; // Avoid ultra-rapid
        })
        .slice(0, 3);
    } else if (routeType === 'fastest') {
      // Prefer ultra-rapid chargers
      selectedStations = rankedStations
        .filter((s) => {
          const maxPower = getMaxPowerKW(s);
          return maxPower >= 50; // Only rapid and ultra-rapid
        })
        .slice(0, 2);
    } else {
      // Balanced - mix of speed and cost
      selectedStations = rankedStations.slice(0, 2);
    }

    // Calculate charging times and costs
    let totalChargingTime = 0;
    let totalChargingCost = 0;

    selectedStations = selectedStations.map((station) => {
      const maxPower = getMaxPowerKW(station);
      const chargingTime = estimateChargingTime(maxPower);
      const chargingCost = estimateChargingCost(maxPower, chargingTime);

      totalChargingTime += chargingTime;
      totalChargingCost += chargingCost;

      return {
        ...station,
        chargingTimeMinutes: Math.round(chargingTime),
        chargingCost: chargingCost.toFixed(2),
        maxPowerKW: maxPower
      };
    });

    // If we have charging stops, recalculate route with waypoints
    let finalRoute = baseRoute;
    if (selectedStations.length > 0) {
      const waypoints = selectedStations.map((s) => ({
        lat: s.AddressInfo.Latitude,
        lng: s.AddressInfo.Longitude
      }));

      finalRoute = await calculateRouteWithGoogle(origin, destination, waypoints);
    }

    return {
      ...finalRoute,
      chargingStations: selectedStations,
      totalChargingTime: Math.round(totalChargingTime),
      totalChargingCost: totalChargingCost.toFixed(2),
      totalTime: finalRoute.duration + totalChargingTime * 60, // seconds
      routeType
    };

  } catch (error) {
    console.error('Error calculating route with charging:', error);
    throw error;
  }
}

export default {
  calculateRouteWithGoogle,
  calculateRouteWithCharging,
  findChargingStationsAlongRoute,
  scoreAndRankStations,
  estimateChargingTime,
  estimateChargingCost
};
