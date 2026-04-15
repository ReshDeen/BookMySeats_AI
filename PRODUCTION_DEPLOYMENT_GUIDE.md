# 🚀 BookMySeats_AI: Complete Production Deployment Guide

**Project Structure:**
- Frontend: React (in `/frontend`)
- Backend: Node.js + Express (in `/backend`, entry: `server.js`)
- Database: MongoDB Atlas
- Payment: Razorpay
- Auth: Firebase

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] **Step 1-5**: Backend setup on Render
- [ ] **Step 6-10**: Frontend setup on Vercel
- [ ] **Step 11**: Environment variables configured
- [ ] **Step 12**: CORS properly set
- [ ] **Step 13**: Test login flow
- [ ] **Step 14**: Test payment flow
- [ ] **Step 15**: Test chatbot

---

## PART 1: BACKEND DEPLOYMENT (RENDER)

### Step 1: Prepare Backend for Production

**File:** `backend/.env`

Create this file in your backend folder with production values:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/bookmyseat?retryWrites=true&w=majority

# Server Port (Render sets this automatically, but include for local testing)
PORT=5000

# Razorpay Keys (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_SbiSdl0tXVdjyx
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# OpenAI Key (For Chatbot)
OPENAI_API_KEY=your_openai_key_here

# Environment
NODE_ENV=production
```

**⚠️ IMPORTANT:** Never commit `.env` file. It's in `.gitignore` for security.

---

### Step 2: Verify Backend Server Configuration

**File:** `backend/server.js` - Already correct, but verify:

✅ **Correct:**
```javascript
// CORS is already configured for production
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isLocalhost(origin) || isProductionOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));
```

The regex patterns already support:
- `localhost:PORT`
- `*.vercel.app` (Vercel frontend)
- `*.render.com` (Render backend)
- `*.netlify.app` (Netlify frontend)

✅ No code changes needed.

---

### Step 3: Create Render Web Service

**Go to:** https://render.com/dashboard

1. Click **"New +"** → Select **"Web Service"**
2. **Connect Git Repository**:
   - Select: `ReshDeen/BookMySeats_AI`
   - Branch: `main`
   - Root Directory: `backend` (IMPORTANT: Set this)
3. **Configure Service**:
   - Name: `bookmyseat-backend` (or similar)
   - Environment: `Node`
   - Region: Choose closest to your users
4. **Build & Start Commands** (Already correct):
   - Build command: `npm install`
   - Start command: `node server.js`

---

### Step 4: Add Environment Variables to Render

1. In Render dashboard, go to your Web Service
2. Click **"Environment"** tab
3. Add these variables:

| Key | Value | Example |
|-----|-------|---------|
| `MONGO_URI` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/bookmyseat` |
| `RAZORPAY_KEY_ID` | From Razorpay Dashboard | `rzp_test_SbiSdl0tXVdjyx` |
| `RAZORPAY_KEY_SECRET` | From Razorpay Dashboard | `AbCdEfGhIjKlMnOpQrStUvWx` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-proj-xxxxx` |
| `NODE_ENV` | Always production | `production` |

4. Click **"Save Changes"** → Render redeploys automatically

---

### Step 5: Verify Backend is Running

1. After ~2-3 minutes, Render shows **"Live"** status
2. Visit: `https://bookmyseat-backend-xxxxx.onrender.com/`
3. You should see: `"Hello from Express server"` or your welcome message
4. **Note your Render URL** - you'll need this for frontend

Example: `https://bookmyseat-backend-e5j6.onrender.com`

---

## PART 2: FRONTEND DEPLOYMENT (VERCEL)

### Step 6: Prepare Frontend for Production

**Verify:** `frontend/package.json`

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

✅ Already correct. No changes needed.

---

### Step 7: Create `.env.production` for Frontend

**File:** `frontend/.env.production`

```env
REACT_APP_API_BASE_URL=https://bookmyseat-backend-e5j6.onrender.com
REACT_APP_RAZORPAY_KEY_ID=rzp_test_SbiSdl0tXVdjyx
```

**Important Notes:**
- Use your actual Render backend URL
- Use test Razorpay key (visible keys are public, that's correct)
- `.env.production` is NOT committed (it's in .gitignore) - Vercel loads from dashboard

---

### Step 8: Verify Frontend API Configuration

**File:** `frontend/src/utils/api.js` - Already correct:

```javascript
const DEFAULT_API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : '';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL).trim();

export const buildApiUrl = (path) => 
  (API_BASE_URL ? `${API_BASE_URL}${path}` : path);
```

✅ This correctly:
- Uses `http://localhost:5000` in development
- Uses `REACT_APP_API_BASE_URL` in production
- Falls back gracefully

No changes needed.

---

### Step 9: Create Vercel Project

**Go to:** https://vercel.com/dashboard

1. Click **"Add New"** → Select **"Project"**
2. **Import Git Repository**:
   - Search: `BookMySeats_AI`
   - Select: `ReshDeen/BookMySeats_AI`
3. **Configure Project**:
   - Project Name: `bookmyseat-ai` (or similar)
   - Framework Preset: `Create React App`
   - Root Directory: `frontend` (IMPORTANT: Set this to /frontend)
   - Build command: `npm run build`
   - Output directory: `build`

---

### Step 10: Add Environment Variables to Vercel

1. In Vercel project settings, click **"Environment Variables"**
2. Add these variables for all environments (Production + Preview):

| Key | Value |
|-----|-------|
| `REACT_APP_API_BASE_URL` | `https://bookmyseat-backend-e5j6.onrender.com` |
| `REACT_APP_RAZORPAY_KEY_ID` | `rzp_test_SbiSdl0tXVdjyx` |

3. Click **"Save"** → Vercel redeploys automatically

**⚠️ CRITICAL:** Make sure to use YOUR actual Render backend URL (not this example).

---

## PART 3: CONFIGURATION & TESTING

### Step 11: Get Your URLs

After both services deploy, you'll have:

**Backend:** `https://bookmyseat-backend-xxxxx.onrender.com`
**Frontend:** `https://bookmyseat-ai-xxxxx.vercel.app`

**Update Vercel environment variable if you haven't already:**
- Render URL changes when you deploy
- Copy the exact URL from Render dashboard
- Paste it as `REACT_APP_API_BASE_URL` in Vercel

---

### Step 12: Verify CORS Configuration

Your backend CORS is production-ready, but double-check in `backend/server.js`:

The regex pattern should match your Vercel URL:
```javascript
/^https:\/\/(.*\.vercel\.app|.*\.netlify\.app|.*\.render\.com)(\/)?$/i
```

✅ This matches: `https://bookmyseat-ai-xxxxx.vercel.app`

No changes needed.

---

### Step 13: Test Login Flow

**In Browser (on Vercel URL):**

1. Open **DevTools** → **Network tab**
2. Click **"Sign In" / "Login"**
3. Try **Email Login**:
   - Email: `test@example.com`
   - Password: `password123`
   - Click Sign In

**Expected Results:**
- ✅ Network request to `https://bookmyseat-backend-xxxxx.onrender.com/api/auth/login`
- ✅ Status: `200 OK`
- ✅ Response contains: `{ user: {...}, message: "..." }`
- ✅ You're logged in

**If it fails:**
- Check Network tab → Click failed request
- Look at "Response" tab
- Common errors:
  - `404`: Backend route doesn't exist
  - `500`: Backend error (check Render logs)
  - `CORS error`: Frontend URL not in backend CORS
  - API endpoint not reaching: `REACT_APP_API_BASE_URL` not set

---

### Step 14: Test Payment Flow

**In Browser (logged in):**

1. Navigate to **Theater** → Select seats → Click **"Pay Now"**
2. Choose payment method (UPI, Card, etc.)
3. Click **"PAY ₹XXX"**

**Expected Results:**
- ✅ Razorpay modal opens
- ✅ Can enter test card: `4111 1111 1111 1111`
- ✅ Expiry: Any future month/year
- ✅ CVV: Any 3 digits
- ✅ Payment succeeds → Booking created

**If it fails:**
- Check DevTools → Network tab
- Look for: `https://bookmyseat-backend-xxxxx.onrender.com/api/payments/create-order`
- If fails with `503`: Razorpay keys not set in Render env vars
- If fails with `404`: Route doesn't exist

---

### Step 15: Test AI Chatbot (Optional)

**In Browser (on any page):**

1. Look for **Chatbot** widget (usually bottom-right)
2. Type a message about movies
3. Hit Enter

**Expected Results:**
- ✅ AI responds with movie recommendations
- ✅ Network request to `/api/chatbot`
- ✅ No errors in console

---

## 🔧 COMMON ISSUES & FIXES

### Issue 1: "Cannot POST /api/auth/login" (404)

**Cause:** `REACT_APP_API_BASE_URL` not set or wrong

**Fix:**
1. Vercel Dashboard → Settings → Environment Variables
2. Check: `REACT_APP_API_BASE_URL` = `https://bookmyseat-backend-xxxxx.onrender.com`
3. Redeploy: Click "Deployments" → Three dots → "Redeploy"

---

### Issue 2: CORS Error in Browser Console

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Cause:** Frontend URL not in backend CORS

**Fix:**
1. Render Dashboard → Web Service → Environment tab
2. Check your Vercel URL matches regex in backend CORS
3. Or manually add to `backend/server.js` in `isProductionOrigin`:

```javascript
const isProductionOrigin = (origin) => {
  if (!origin) return false;
  return /^https:\/\/(.*\.vercel\.app|.*\.netlify\.app|.*\.render\.com|your-custom-domain\.com)(\/)?$/i.test(origin);
};
```

---

### Issue 3: "Razorpay is not defined" Error

**Cause:** Razorpay script not loaded

**Fix:**
1. Check `frontend/public/index.html`:

```html
<head>
  ...
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
```

2. If missing, add it

---

### Issue 4: Render Service Suspended

**Cause:** Free tier has 15-minute inactivity limit

**Fix:** Upgrade to paid tier or deploy on Railway/Heroku instead

---

### Issue 5: Build Fails on Vercel

**Error:** `npm ERR! code EWORKSPACE`

**Fix:**
1. Vercel Dashboard → Settings → Root Directory
2. Change to: `frontend` (not root)
3. Redeploy

---

### Issue 6: Node Modules Cache Issues

**Fix (in Render):**
1. Dashboard → Web Service → Settings
2. Clear build cache: **"Clear cache and rebuild"**
3. Redeploy

---

### Issue 7: Environment Variables Not Loading

**Symptoms:** Hardcoded fallback URLs appear in requests

**Fix:**
1. Vercel/Render: Verify env vars are added
2. Redeploy after adding env vars
3. Don't rely on `.env` files in deployed code
4. Use dashboard to set variables

---

## 📝 FINAL CHECKLIST

Before going live:

- [ ] Render backend URL is available
- [ ] Vercel frontend URL is available
- [ ] `REACT_APP_API_BASE_URL` set in Vercel = Render URL
- [ ] `RAZORPAY_KEY_ID` set in both Vercel and Render
- [ ] `MONGO_URI` set in Render
- [ ] Login test passes
- [ ] Payment test passes
- [ ] No console errors
- [ ] Network requests show correct URLs

---

## 🧪 PRODUCTION TEST SCRIPT

**In Browser Console on Vercel URL:**

```javascript
// Test 1: Check API base URL
console.log('API Base:', process.env.REACT_APP_API_BASE_URL);

// Test 2: Check Razorpay key
console.log('RZP Key:', process.env.REACT_APP_RAZORPAY_KEY_ID);

// Test 3: Test API call
fetch('https://YOUR_RENDER_URL/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend health:', d))
  .catch(e => console.error('Backend error:', e));

// Test 4: Check Razorpay script
console.log('Razorpay loaded:', !!window.Razorpay);
```

Expected output:
```
API Base: https://bookmyseat-backend-xxxxx.onrender.com
RZP Key: rzp_test_SbiSdl0tXVdjyx
Backend health: {...}
Razorpay loaded: true
```

---

## 🎯 NEXT STEPS

1. **Follow Steps 1-10** exactly as written
2. **Test Steps 13-15** after both services deploy
3. **Fix any issues** using the troubleshooting guide
4. **Go live** once all tests pass

---

## 📞 SUPPORT LINKS

- **Render Help:** https://render.com/docs
- **Vercel Help:** https://vercel.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/
- **Razorpay API:** https://razorpay.com/docs/api/

---

**Last Updated:** April 15, 2026
**Project:** BookMySeats_AI
**Status:** Ready for production deployment
