# 🚀 Quick Start - Get Real Google Maps Data in 15 Minutes

## What You're Getting

✅ Backend server that proxies Google Maps API (avoids CORS)
✅ Updated frontend code that uses real route data
✅ Accurate driving times matching Google Maps

---

## Fastest Path to Deployment

### 1️⃣ Deploy Backend to Render.com (5 minutes)

**Why Render?** Free tier, super easy, no credit card needed for trial

1. Go to https://render.com
2. Sign up (use GitHub for fastest setup)
3. Click "New +" → "Web Service"
4. Choose "Build and deploy from a Git repository"
5. If you don't have a GitHub repo:
   - Click "Public Git repository"
   - Use: https://github.com/yourusername/wattroute-backend (you'll create this)
   
   **OR** Upload files manually:
   - Select "Use existing image" → "Docker"
   - No, just kidding - use the "New Web Service" flow
   - Render can deploy from a zip too!

6. **Easiest method - Manual Deploy:**
   - Create a new GitHub repo
   - Upload the `wattroute-backend` folder contents
   - Connect Render to that repo
   - Done!

7. **Configure:**
   - Name: `wattroute-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

8. **Add Environment Variable:**
   - Click "Environment" tab
   - Add New:
     - Key: `GOOGLE_MAPS_API_KEY`
     - Value: `AIzaSyCrALW-2OdYsjm2ebF1zMMeHa6eTA7ssL4`

9. **Deploy!** 
   - Click "Create Web Service"
   - Wait 2-3 minutes
   - You'll get URL: `https://wattroute-backend.onrender.com`

### 2️⃣ Update Frontend (5 minutes)

1. Open `routeUtils.js`
2. Find line 3:
   ```javascript
   const BACKEND_API_URL = 'http://localhost:3001';
   ```
3. Change to your Render URL:
   ```javascript
   const BACKEND_API_URL = 'https://wattroute-backend.onrender.com';
   ```
4. Replace this file in your frontend code
5. Rebuild: `npm run build`
6. Upload `dist` folder to Krystal

### 3️⃣ Test (5 minutes)

1. Visit wattroute.co.uk
2. Enter: London → Manchester
3. Check time matches Google Maps (should be 3hr 29min now!)

---

## Even Faster: Alternative Hosts

### Option: Railway.app
- Free $5 credit/month
- Faster deployment
- Steps identical to Render

### Option: Vercel
- Instant deployment
- Requires minor code tweaks
- Great free tier

---

## Verification Checklist

After deployment, verify:

- [ ] Backend health check works: `https://your-url.onrender.com/health`
- [ ] Frontend loads without errors
- [ ] Route calculation shows real times
- [ ] Times match Google Maps ✅

---

## What's in the Package

```
wattroute-backend/
├── server.js           ← Backend API server
├── package.json        ← Dependencies
├── .env                ← API key (already filled)
├── routeUtils.js       ← Updated frontend code
├── README.md           ← Detailed documentation
└── DEPLOYMENT_GUIDE.md ← Full deployment guide
```

---

## Need Help?

1. **Backend not working?**
   - Check `/health` endpoint
   - Check environment variables in Render dashboard
   - Check logs in Render dashboard

2. **Frontend not showing real data?**
   - Check browser console for errors
   - Verify backend URL is correct
   - Try hard refresh (Ctrl+F5)

3. **Still showing old times?**
   - Clear browser cache
   - Check you uploaded the new build
   - Verify routeUtils.js was updated

---

## 🎉 Success Criteria

**Before:** 3hr 5min (simulated)
**After:** 3hr 29min (real Google Maps data) ✅

You should now have:
✅ Accurate driving times
✅ Real route paths
✅ Correct charging station placement
✅ Proper motorway routing

---

## Free Tier Limits (You're Safe!)

- **Render**: 750 hours/month = 24/7 uptime ✅
- **Google Maps**: 28,000 API calls/month ✅
- **Your usage**: ~100-500 calls/month
- **Cost**: $0 ✅

---

Ready to deploy? Follow Step 1 above! 🚀
