# ✅ WattRoute Deployment Checklist

Use this checklist to ensure everything is set up correctly.

---

## 📋 Pre-Deployment Checklist

### ☐ Review Files
- [ ] Read `README.md` (overview)
- [ ] Read `QUICK_START.md` (15-min guide)
- [ ] Open `test-backend.html` in browser (for later testing)
- [ ] Understand `BEFORE_AFTER.md` (why this matters)

### ☐ Choose Hosting Platform
- [ ] Decided on hosting: Render.com / Railway.app / Krystal
- [ ] Created account on chosen platform
- [ ] Confirmed free tier availability

---

## 🚀 Backend Deployment Checklist

### ☐ Upload Backend Files
- [ ] Uploaded `server.js`
- [ ] Uploaded `package.json`
- [ ] Uploaded `.env` (with Google API key)
- [ ] Uploaded `.gitignore`

### ☐ Configure Hosting Platform
- [ ] Set environment: Node.js
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Added environment variable: `GOOGLE_MAPS_API_KEY`
- [ ] Value: `AIzaSyCrALW-2OdYsjm2ebF1zMMeHa6eTA7ssL4`

### ☐ Deploy & Verify
- [ ] Clicked "Deploy" button
- [ ] Waited for deployment to complete (2-3 minutes)
- [ ] Got backend URL (e.g., `https://wattroute-backend.onrender.com`)
- [ ] Saved backend URL somewhere safe

---

## 🧪 Backend Testing Checklist

### ☐ Health Check Test
- [ ] Opened `test-backend.html` in browser
- [ ] Entered backend URL in form
- [ ] Clicked "Test Health Endpoint"
- [ ] Saw ✅ SUCCESS message
- [ ] Message says "Backend is running correctly"

### ☐ Directions API Test
- [ ] Entered "London, UK" as origin
- [ ] Entered "Manchester, UK" as destination
- [ ] Clicked "Calculate Route"
- [ ] Saw ✅ ROUTE CALCULATED SUCCESSFULLY
- [ ] Duration shows approximately 3hr 29min
- [ ] Saw "This is REAL data from Google Maps! 🎉"

### ☐ Command Line Test (Optional)
```bash
# Health check
curl https://your-backend-url/health
```
- [ ] Got response: `{"status":"ok"}`

```bash
# Directions test
curl -X POST https://your-backend-url/api/directions \
  -H "Content-Type: application/json" \
  -d '{"origin":"London, UK","destination":"Manchester, UK"}'
```
- [ ] Got JSON response with route data

---

## 💻 Frontend Update Checklist

### ☐ Update Route Utils
- [ ] Opened `routeUtils.js`
- [ ] Found line 3: `const BACKEND_API_URL = 'http://localhost:3001';`
- [ ] Changed to your backend URL: `'https://your-backend-url'`
- [ ] Saved file

### ☐ Integrate into Frontend
- [ ] Located your current frontend route calculation code
- [ ] Replaced old simulated calculation with new `routeUtils.js` functions
- [ ] Imported: `import { calculateRouteWithCharging } from './routeUtils'`
- [ ] Updated route calculation to use: `calculateRouteWithCharging(origin, destination, routeType, stations)`

### ☐ Build & Test Locally (Optional)
- [ ] Ran `npm run build`
- [ ] Tested locally with `npm run dev`
- [ ] Verified routes calculate correctly
- [ ] Checked browser console for errors

---

## 📤 Upload to Krystal Checklist

### ☐ Build Production Files
- [ ] Ran `npm run build` in frontend directory
- [ ] Verified `dist/` folder was created
- [ ] Checked files in `dist/` look correct

### ☐ Upload to Krystal
- [ ] Logged into Krystal control panel
- [ ] Navigated to File Manager
- [ ] Located `public_html` or website root
- [ ] Backed up old files (optional but recommended)
- [ ] Uploaded all files from `dist/` folder
- [ ] Verified all files uploaded successfully

---

## ✅ Final Verification Checklist

### ☐ Test Live Site
- [ ] Visited https://wattroute.co.uk
- [ ] Page loads without errors
- [ ] Opened browser console (F12)
- [ ] No errors in console

### ☐ Test Route Calculation
- [ ] Entered "London, UK" as origin
- [ ] Entered "Manchester, UK" as destination
- [ ] Clicked "Calculate Route" (or equivalent)
- [ ] Routes calculated successfully
- [ ] Duration shows approximately 3hr 29min ✅
- [ ] Matches Google Maps time ✅

### ☐ Test Charging Stations
- [ ] Charging stations appear along route
- [ ] Stations show correct information
- [ ] Can click to expand station details
- [ ] Street View photos load
- [ ] "View on Map" links work

### ☐ Compare to Google Maps
- [ ] Opened Google Maps in new tab
- [ ] Searched same route: London → Manchester
- [ ] Google Maps shows: ~3hr 29min
- [ ] WattRoute shows: ~3hr 29min (or very close)
- [ ] ✅ Times match!

---

## 🎉 Success Criteria

When you can check ALL of these, you're done! ✅

- [ ] Backend deployed and running
- [ ] Backend health check passes
- [ ] Backend directions API works
- [ ] Frontend updated with backend URL
- [ ] Frontend rebuilt and uploaded
- [ ] Live site loads without errors
- [ ] Route calculation works
- [ ] Times match Google Maps
- [ ] Charging stations display correctly
- [ ] No console errors

---

## 🐛 Troubleshooting Reference

If something doesn't work, check:

### Backend Issues
- [ ] Environment variables set correctly?
- [ ] Google Maps API key valid?
- [ ] Backend logs show errors?
- [ ] `/health` endpoint accessible?

### Frontend Issues
- [ ] Backend URL correct in `routeUtils.js`?
- [ ] New build uploaded to Krystal?
- [ ] Browser cache cleared?
- [ ] Console shows CORS errors?

### Time Mismatch Issues
- [ ] Backend actually being called? (check Network tab)
- [ ] Still using old simulated code?
- [ ] API returning valid data?

---

## 📊 Performance Checks (After 24 Hours)

### ☐ Monitor API Usage
- [ ] Logged into Google Cloud Console
- [ ] Checked Directions API usage
- [ ] Confirmed usage under free tier limits
- [ ] Set up billing alerts (optional)

### ☐ Backend Health
- [ ] Backend still running
- [ ] No errors in logs
- [ ] Response times acceptable (<2 seconds)

### ☐ User Experience
- [ ] Tested multiple routes
- [ ] All routes calculate correctly
- [ ] Times remain accurate
- [ ] No user-reported issues

---

## 🎯 You're Done When...

✅ Backend is deployed and healthy
✅ test-backend.html shows all green
✅ Live site calculates accurate routes
✅ Times match Google Maps
✅ No errors anywhere
✅ You're proud to show it off! 🎉

---

## 📝 Notes & Issues

Use this space to track any issues or notes during deployment:

```
Date: ___________
Issue: ___________
Solution: ___________

Date: ___________
Issue: ___________
Solution: ___________
```

---

## 🎊 Celebration Checklist

After successful deployment:
- [ ] Shared on social media
- [ ] Told friends about accurate EV routing
- [ ] Tested with real journey
- [ ] Collected user feedback
- [ ] Planned next features

---

**Good luck with your deployment! 🚀**

If you complete this checklist, you'll have a fully functional WattRoute with accurate Google Maps data!
