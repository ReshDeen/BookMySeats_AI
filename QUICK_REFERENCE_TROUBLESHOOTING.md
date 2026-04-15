# 🔧 QUICK REFERENCE & TROUBLESHOOTING GUIDE

---

## ⚡ QUICK START REFERENCE

### Render URLs

- **Render Dashboard:** https://render.com/dashboard
- **Your Backend Service:** https://render.com/dashboard → Web Services → bookmyseat-backend

### Vercel URLs

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Frontend Project:** https://vercel.com/dashboard → Select bookmyseat-ai

### Services Status Check

**Check Backend is live:**
```bash
curl https://bookmyseat-backend-xxxxx.onrender.com/
# Should see: "Express server is running..."
```

**Check Frontend is live:**
```bash
# Just visit: https://bookmyseat-ai-xxxxx.vercel.app in browser
```

---

## 🧪 BROWSER CONSOLE TEST COMMANDS

**Paste these in browser console (DevTools) on your Vercel frontend:**

### Test 1: Backend Connection
```javascript
fetch('https://bookmyseat-backend-xxxxx.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend alive:', d))
  .catch(e => console.error('❌ Backend down:', e.message));
```

Expected: `✅ Backend alive: {...}`

---

### Test 2: API Base URL Configuration
```javascript
console.log('🔗 API Base URL:', process.env.REACT_APP_API_BASE_URL);
console.log('🔑 Razorpay Key:', process.env.REACT_APP_RAZORPAY_KEY_ID);
console.log('🪟 Environment:', process.env.NODE_ENV);
```

Expected:
```
🔗 API Base URL: https://bookmyseat-backend-xxxxx.onrender.com
🔑 Razorpay Key: rzp_test_SbiSdl0tXVdjyx
🪟 Environment: production
```

---

### Test 3: Razorpay Script Loaded
```javascript
console.log('Razorpay loaded:', !!window.Razorpay);
if (!window.Razorpay) {
  console.error('❌ Razorpay script not loaded!');
  console.error('Add to public/index.html: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>');
}
```

Expected: `Razorpay loaded: true`

---

### Test 4: Call Test API
```javascript
const testLogin = async () => {
  try {
    const response = await fetch('https://bookmyseat-backend-xxxxx.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    const data = await response.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
};
testLogin();
```

---

## 🐛 COMMON ERRORS & SOLUTIONS

### ERROR 1: "Cannot read properties of undefined (reading 'REACT_APP_API_BASE_URL')"

**Problem:** Environment variables not set

**Solution:**
1. Vercel Dashboard → Project Settings → Environment Variables
2. Add: `REACT_APP_API_BASE_URL` = `https://bookmyseat-backend-xxxxx.onrender.com`
3. Redeploy

---

### ERROR 2: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Problem:** Backend CORS not properly configured

**Solution:**
1. Render Dashboard → Web Service → Environment
2. Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
3. Restart service: Settings → Restart
4. Clear browser cache (Ctrl+Shift+Delete on Windows)

---

### ERROR 3: "TypeError: Cannot read property 'razorpay_payment_id' of undefined"

**Problem:** Payment response not received

**Solution:**
1. Check Razorpay modal actually opened
2. Check Razorpay key is correct: `REACT_APP_RAZORPAY_KEY_ID`
3. Check `rzp_test_` prefix in key (test mode)
4. Use test card: `4111 1111 1111 1111`

---

### ERROR 4: "404 Not Found" on API calls

**Problem:** API endpoint doesn't exist or wrong URL

**Solution:**
1. Open DevTools → Network tab
2. Check request URL (should be Render backend)
3. Check endpoint exists in backend (e.g., `/api/auth/login`)
4. If URL shows localhost: `REACT_APP_API_BASE_URL` not set

---

### ERROR 5: "Render service is suspended"

**Problem:** Free tier inactive for 15 minutes or out of hours

**Solution:**
1. Upgrade Render to paid plan ($7/month minimum)
2. Or redeploy manually (Render Dashboard → Restart)
3. Or use different hosting (Railway, Heroku, Fly.io)

---

### ERROR 6: "Vercel build fails: npm ERR! code EWORKSPACE"

**Problem:** Build system can't find dependencies

**Solution:**
1. Vercel Settings → General
2. Root Directory: Change from `/` to `frontend`
3. Build Command: `npm run build`
4. Output Directory: `build`
5. Redeploy

---

### ERROR 7: "MongooseError: Cannot connect to MongoDB"

**Problem:** MONGO_URI not valid or connection string wrong

**Solution:**
1. MongoDB Atlas → Clusters → Connect → Get connection string
2. Replace `<username>` and `<password>`
3. Ensure IP whitelist includes `0.0.0.0/0` (allow all)
4. Render Dashboard → Web Service → Environment
5. Update `MONGO_URI` with correct string
6. Restart service

---

### ERROR 8: "Razorpay is not defined" in console

**Problem:** Razorpay script not loaded in HTML

**Solution:**
1. Check `frontend/public/index.html` has:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```
2. If missing, add to `<head>` section
3. Push to GitHub
4. Vercel auto-redeploys

---

### ERROR 9: "SyntaxError: Unexpected token < in JSON at position 0"

**Problem:** Server returning HTML instead of JSON

**Solution:**
1. Backend crashed, Render showing error page
2. Check Render Logs: Render Dashboard → Logs tab
3. Fix error in backend code
4. Push to GitHub
5. Render auto-redeploys

---

### ERROR 10: "200 OK but no user data returned"

**Problem:** API succeeds but response format wrong

**Solution:**
1. Check backend response format in `backend/routes/authRoutes.js`
2. Expected: `{ user: {...}, message: "..." }`
3. Check MongoDB has user data
4. Check User model in `backend/models/User.js`

---

## 📊 LOGS & DEBUGGING

### Check Render Backend Logs

1. Go to: https://render.com/dashboard
2. Select: `bookmyseat-backend`
3. Click: **"Logs"** tab
4. Look for errors
5. Most recent messages at bottom

**Common log messages:**
```
// Good
✓ MongoDB connected
✓ Server running on port 5000
✓ Route loaded: /api/auth/login

// Bad
✗ MONGO_URI not set
✗ Razorpay keys missing
✗ Cannot find route handler
```

---

### Check Vercel Frontend Logs

1. Go to: https://vercel.com/dashboard
2. Select: `bookmyseat-ai`
3. Click: **"Deployments"** tab
4. Click latest deployment
5. Click: **"Logs"** tab

**Look for ESLint errors or build issues**

---

### Check Browser Console for Errors

DevTools shortcut: `F12` → Select **"Console"** tab

Look for:
- Red error messages
- Yellow warnings
- Network errors (XHR/Fetch failed)
- CORS errors

---

## 🔄 HOW TO REDEPLOY

### Redeploy Render Backend

**Option 1: Auto (recommended)**
- Push code to GitHub → Render auto-redeploys

**Option 2: Manual**
1. Render Dashboard → `bookmyseat-backend`
2. Click: **"Manual Deploy"** → **"Clear Build Cache and Deploy"**
3. Wait 2-3 minutes for deployment

### Redeploy Vercel Frontend

**Option 1: Auto (recommended)**
- Push code to GitHub → Vercel auto-redeploys

**Option 2: Manual**
1. Vercel Dashboard → `bookmyseat-ai`
2. Click: **"Deployments"** tab
3. Latest deployment → Click **"..."** → **"Redeploy"**
4. Wait 1-2 minutes for deployment

---

## 📝 ENVIRONMENT VARIABLE CHANGES

### After changing environment variables:

**Render (Backend):**
1. Dashboard → Web Service → Settings
2. Scroll to **"Advanced"** → **"Restart"**
3. Wait for restart
4. Check Logs to confirm

**Vercel (Frontend):**
1. Dashboard → Settings → Environment Variables
2. After adding/changing
3. Go to **"Deployments"**
4. Click latest → **"..."** → **"Redeploy"**

---

## 🚀 ZERO-DOWNTIME DEPLOYMENT

### For updates without losing users:

1. **Make code changes locally**
2. **Test locally:**
   ```bash
   cd backend && npm install && node server.js
   cd ../frontend && npm install && npm start
   ```
3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix: [description]"
   git push origin main
   ```
4. **Render & Vercel auto-deploy** (no manual restart needed)
5. **Monitor logs** during deployment
6. **Wait for "Live" status** before declaring success

---

## 🧹 CACHE CLEARING

### Frontend Cache Issues

**Vercel:**
1. Dashboard → `bookmyseat-ai` → Deployments
2. Latest deployment → **"..."** → **"Redeploy"**

**Browser (Windows):**
- Hard refresh: `Ctrl + Shift + R`
- Dev tools: Settings → **"Disable cache (while DevTools open)"**

### Backend Cache Issues

**Render:**
1. Dashboard → Web Service → Settings
2. Advanced → **"Clear Build Cache and Redeploy"**

---

## 📋 PRE-LAUNCH CHECKLIST

- [ ] Backend URL accessible
- [ ] Frontend URL accessible
- [ ] Login works (check Network tab)
- [ ] Payment modal opens
- [ ] Test payment succeeds with card: `4111 1111 1111 1111`
- [ ] Chatbot responds
- [ ] No red errors in browser console
- [ ] No 404 responses in Network tab
- [ ] CORS errors resolved
- [ ] All env vars set in both services
- [ ] Render logs show no errors
- [ ] Vercel build log shows no errors

---

## 🎯 SUPPORT RESOURCES

- **Render Support:** https://render.com/docs
- **Vercel Support:** https://vercel.com/help
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/
- **MongoDB:** https://docs.mongodb.com/
- **Razorpay:** https://razorpay.com/docs/

---

**Last Updated:** April 15, 2026
**Made for:** BookMySeats_AI Project
