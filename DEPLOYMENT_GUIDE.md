# 🚗⚡ WattRoute - Real Google Maps Integration Guide

## What We're Doing

Replacing the simulated route calculation with **real Google Maps data** using a backend proxy.

## Why We Need a Backend

- ❌ **Problem**: Google Maps API has CORS restrictions when called from browser
- ✅ **Solution**: Backend server proxies the API calls
- 🎯 **Result**: Real driving times, actual routes, accurate charging station placement

---

## Step 1: Choose Your Backend Hosting Option

### Option A: Krystal Hosting (Same host as frontend) ⭐ RECOMMENDED

**Check if Krystal supports Node.js:**
1. Log into Krystal control panel
2. Look for "Node.js" or "Application Hosting" options
3. Check their support docs or contact support

**If Krystal supports Node.js:**
- Deploy backend to subdomain: `api.wattroute.co.uk`
- Keep everything in one place
- Easiest to manage

**If Krystal doesn't support Node.js:**
- Use Option B or C below

---

### Option B: Render.com (Free Tier) 🆓

**Perfect for small projects, free tier includes:**
- 750 hours/month free
- Automatic HTTPS
- Easy deployment from GitHub

**Steps:**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo (or upload files)
5. Configure:
   - **Name**: wattroute-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add environment variable:
   - Key: `GOOGLE_MAPS_API_KEY`
   - Value: `AIzaSyCrALW-2OdYsjm2ebF1zMMeHa6eTA7ssL4`
7. Deploy!
8. You'll get URL like: `https://wattroute-backend.onrender.com`

---

### Option C: Railway.app (Free Tier) 🆓

**Similar to Render, also free:**
- $5 free credit/month
- Very fast deployment
- Good for hobby projects

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects Node.js
6. Add environment variables in dashboard:
   - `GOOGLE_MAPS_API_KEY`
7. Deploy!
8. Generate domain in settings

---

### Option D: Vercel (Serverless) 🚀

**Convert to serverless functions:**
- Free tier: 100GB bandwidth/month
- Instant deployment

**Note**: Requires slight code modification to use Vercel's serverless format.

---

## Step 2: Deploy the Backend

### Files to Upload/Deploy:

```
wattroute-backend/
├── package.json
├── server.js
├── .env
└── README.md
```

### Using Render/Railway:

1. **Upload files to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "WattRoute backend"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy via platform:**
   - Connect GitHub repo
   - Platform auto-installs dependencies
   - Add environment variables
   - Deploy!

3. **Get your backend URL:**
   - Example: `https://wattroute-backend.onrender.com`
   - Example: `https://wattroute-backend.railway.app`

---

## Step 3: Update Frontend Code

### Update the Backend API URL

In `routeUtils.js` (line 3), change:

```javascript
const BACKEND_API_URL = 'http://localhost:3001';
```

To your deployed backend URL:

```javascript
const BACKEND_API_URL = 'https://wattroute-backend.onrender.com';
// or
const BACKEND_API_URL = 'https://api.wattroute.co.uk';
// or
const BACKEND_API_URL = 'https://wattroute-backend.railway.app';
```

### Replace Your Current Route Calculation

1. Open your existing WattRoute frontend code
2. Find where route calculation happens (likely in your main component)
3. Replace the old simulated function with the new `calculateRouteWithCharging` from `routeUtils.js`

### Example Integration:

```javascript
import { calculateRouteWithCharging } from './routeUtils';

// In your route calculation function:
const calculateRoutes = async () => {
  setLoading(true);
  
  try {
    // Get all charging stations first (your existing code)
    const stations = await fetchChargingStations();
    
    // Calculate 3 route types with REAL Google Maps data
    const [cheapest, balanced, fastest] = await Promise.all([
      calculateRouteWithCharging(origin, destination, 'cheapest', stations),
      calculateRouteWithCharging(origin, destination, 'balanced', stations),
      calculateRouteWithCharging(origin, destination, 'fastest', stations),
    ]);
    
    setRoutes({ cheapest, balanced, fastest });
  } catch (error) {
    console.error('Error calculating routes:', error);
    setError('Failed to calculate routes');
  } finally {
    setLoading(false);
  }
};
```

---

## Step 4: Test It!

### 1. Test Backend Directly:

```bash
# Health check
curl https://your-backend-url.onrender.com/health

# Test directions
curl -X POST https://your-backend-url.onrender.com/api/directions \
  -H "Content-Type: application/json" \
  -d '{"origin":"London, UK","destination":"Manchester, UK"}'
```

### 2. Test Frontend:

1. Rebuild frontend: `npm run build`
2. Upload to Krystal
3. Test a route (e.g., London to Manchester)
4. Compare time to Google Maps ✅

---

## Step 5: Verify It's Working

**You should now see:**
- ✅ Accurate driving times matching Google Maps
- ✅ Real route paths following actual roads
- ✅ Charging stations along actual motorways
- ✅ Correct total journey times

**Example:**
- Before: 3hr 5min (straight-line estimate)
- After: 3hr 29min (real Google Maps time) ✅

---

## Troubleshooting

### Backend Issues:

**Error: "Failed to fetch"**
- Check backend URL is correct
- Check backend is running (visit `/health` endpoint)
- Check CORS is enabled for wattroute.co.uk

**Error: "Google Maps API error"**
- Verify API key is in environment variables
- Check API key has Directions API enabled in Google Cloud Console
- Check billing is enabled (Google requires it even for free tier)

### Frontend Issues:

**Still showing old times:**
- Clear browser cache
- Check backend URL is updated in code
- Check browser console for errors

---

## Cost & Limits

### Backend Hosting:
- **Render Free Tier**: 750 hours/month (enough for 24/7)
- **Railway Free Tier**: $5 credit/month
- Both plenty for a personal project

### Google Maps API:
- **Current usage**: Free tier includes:
  - 28,000 free Directions API calls/month
  - $200 free credit/month
- **Your usage**: Probably 100-500 calls/month
- **Cost**: Likely $0

### Monitoring:
- Check Google Cloud Console for API usage
- Set up billing alerts if you want

---

## Next Steps After Deployment

1. ✅ Deploy backend to Render/Railway/Krystal
2. ✅ Update frontend with backend URL
3. ✅ Rebuild and upload frontend to Krystal
4. ✅ Test routes
5. ✅ Compare times to Google Maps
6. 🎉 Celebrate accurate data!

---

## Optional Improvements

After basic deployment works:

1. **Add rate limiting** to backend (protect API)
2. **Cache frequent routes** (save API calls)
3. **Add error boundaries** in frontend
4. **Monitor API usage** in Google Cloud Console
5. **Add analytics** to see popular routes

---

## Support

If you get stuck:
- Check backend `/health` endpoint
- Check browser console for errors
- Verify Google Maps API key is working
- Test backend directly with curl

---

## File Checklist

**Backend files ready:**
- [x] package.json
- [x] server.js
- [x] .env
- [x] README.md

**Frontend files ready:**
- [x] routeUtils.js (updated)

**What you need:**
1. Choose hosting (Render/Railway/Krystal)
2. Deploy backend
3. Get backend URL
4. Update frontend with URL
5. Rebuild frontend
6. Upload to Krystal
7. Test!

---

Let's get this deployed! 🚀
