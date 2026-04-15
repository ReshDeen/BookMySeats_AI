# ⚙️ BOOKMYSEATS_AI: EXACT CONFIGURATION TEMPLATE

**For:** Your BookMySeats_AI Project
**Frontend Structure:** `/frontend` (React)
**Backend Structure:** `/backend` (Express.js)

---

## 🔴 STEP 0: GATHER YOUR CREDENTIALS

Before deploying, collect these from service providers:

### From MongoDB Atlas:
```
MONGO_URI = mongodb+srv://USERNAME:PASSWORD@CLUSTER_NAME.mongodb.net/bookmyseat?retryWrites=true&w=majority
```

Example:
```
MONGO_URI = mongodb+srv://bookmyseat_user:MyPassword123@cluster0.abcd1234.mongodb.net/bookmyseat?retryWrites=true&w=majority
```

**How to get it:**
1. Go to: https://www.mongodb.com/cloud/atlas
2. Clusters → Connect → Drivers → Copy connection string
3. Replace `<username>` and `<password>`

---

### From Razorpay Dashboard:
```
RAZORPAY_KEY_ID = rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET = xxxxxxxxxxxxxxxx
```

**How to get it:**
1. Go to: https://dashboard.razorpay.com
2. Settings → API Keys
3. Copy KEY ID and KEY SECRET (keep secret hidden)

---

### From OpenAI:
```
OPENAI_API_KEY = sk-proj-xxxxxxxxxxxxxxxxxx
```

**How to get it:**
1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy immediately (can't see it again)

---

### Your Razorpay Account Info:
- Test Key ID: (Check your dashboard - already have it)
- Example: `rzp_test_SbiSdl0tXVdjyx`
- This is safe to put in frontend code ✅

---

## 🔵 STEP 1: PREPARE BACKEND .env

**File location:** `backend/.env`

Create this file with YOUR values:

```env
# ============================================
# MONGODB CONFIGURATION
# ============================================
# Get from: MongoDB Atlas → Clusters → Connect
# Format: mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DBNAME
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/bookmyseat?retryWrites=true&w=majority

# ============================================
# RAZORPAY CONFIGURATION (Payment Gateway)
# ============================================
# Get from: https://dashboard.razorpay.com/app/settings/api-keys
# PUBLIC KEY (safe): Test key starting with rzp_test_
RAZORPAY_KEY_ID=rzp_test_SbiSdl0tXVdjyx

# PRIVATE KEY (keep secret!): Secret key from dashboard
# DO NOT commit this to GitHub
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE

# ============================================
# OPENAI CONFIGURATION (Chatbot)
# ============================================
# Get from: https://platform.openai.com/api-keys
# Copy the full key starting with sk-proj-
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx

# ============================================
# SERVER CONFIGURATION
# ============================================
# Render sets PORT automatically, but include for local testing
PORT=5000

# Always "production" for production deployments
NODE_ENV=production
```

**Save this file locally but DON'T commit to GitHub** (it's in .gitignore)

---

## 🟢 STEP 2: DEPLOY BACKEND TO RENDER

### 2A. Create Render Account
- Go to: https://render.com/register
- Sign up with GitHub
- Allow Render to access your GitHub

### 2B. Create Web Service on Render

1. **Dashboard → New +**
2. **Select: Web Service**
3. **Connect Repository:**
   - Select: `ReshDeen/BookMySeats_AI`
   - Branch: `main`
4. **Configure Service:**
   - Name: `bookmyseat-backend`
   - Environment: `Node`
   - Region: (closest to your users)
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. **Root Directory: `backend`** ⚠️ IMPORTANT
6. Click **Create Web Service**

### 2C. Add Environment Variables to Render

1. After service created, go to **Settings → Environment**
2. Add each variable (click **Add Environment Variable**):

| Name | Value |
|------|-------|
| MONGO_URI | `mongodb+srv://USERNAME:PASSWORD@...` |
| RAZORPAY_KEY_ID | `rzp_test_SbiSdl0tXVdjyx` |
| RAZORPAY_KEY_SECRET | `YOUR_SECRET_FROM_DASHBOARD` |
| OPENAI_API_KEY | `sk-proj-...` |
| NODE_ENV | `production` |

3. Click **Save Changes**
4. Wait 2-3 minutes for deployment
5. Look for **"Live"** status ✅

### 2D. Copy Your Render Backend URL

Once deployed, you'll see:
```
https://bookmyseat-backend-e5j6.onrender.com
```

**Note this URL** - you'll need it for the frontend!

---

## 🟡 STEP 3: DEPLOY FRONTEND TO VERCEL

### 3A. Create Vercel Account
- Go to: https://vercel.com/signup
- Sign up with GitHub
- Allow Vercel to access your GitHub

### 3B. Create Project on Vercel

1. **Dashboard → Add New → Project**
2. **Import Git Repository:**
   - Search: `BookMySeats_AI`
   - Select: `ReshDeen/BookMySeats_AI`
3. **Configure Project:**
   - Project Name: `bookmyseat-ai`
   - Framework: `Create React App`
   - Root Directory: `/frontend` ⚠️ IMPORTANT
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Click Deploy**

### 3C. Add Environment Variables to Vercel

1. After deployment, go to **Settings → Environment Variables**
2. Add these variables for **Production** environment:

| Name | Value | Example |
|------|-------|---------|
| REACT_APP_API_BASE_URL | `https://bookmyseat-backend-e5j6.onrender.com` | Use your Render URL from Step 2D |
| REACT_APP_RAZORPAY_KEY_ID | `rzp_test_SbiSdl0tXVdjyx` | Your Razorpay test key |

3. Click **Save**
4. Vercel automatically redeploys
5. Wait 1-2 minutes for deployment
6. Look for green **"Ready"** status ✅

### 3D. Copy Your Vercel Frontend URL

Once deployed, you'll see:
```
https://bookmyseat-ai-xxxxx.vercel.app
```

---

## 🏁 STEP 4: YOUR DEPLOYED URLS

**After deploying both services, you have:**

```
Frontend (Vercel):
https://bookmyseat-ai-xxxxx.vercel.app

Backend (Render):
https://bookmyseat-backend-e5j6.onrender.com

MongoDB:
Connected via MONGO_URI in backend

Razorpay:
Test account with KEY_ID and KEY_SECRET

OpenAI:
Connected via API_KEY for chatbot
```

---

## 🧪 STEP 5: QUICK TESTS

### Test 1: Backend is running
Open in browser:
```
https://bookmyseat-backend-e5j6.onrender.com/
```
Should see message (not 404)

### Test 2: Frontend is running
Open in browser:
```
https://bookmyseat-ai-xxxxx.vercel.app
```
Should see your BookMySeats app

### Test 3: Login flow
1. Click "Sign In"
2. Open DevTools (F12)
3. Go to Network tab
4. Try email login
5. Look for request to:
   ```
   https://bookmyseat-backend-e5j6.onrender.com/api/auth/login
   ```
6. Should be **200 OK** ✅

### Test 4: Payment flow
1. Book some seats
2. Click "Pay Now"
3. Try payment with test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: Any 3 digits
4. Should complete successfully ✅

---

## 🔄 AFTER DEPLOYMENT CHANGES

### If you change backend code:
1. Make changes locally
2. Test: `cd backend && npm install && node server.js`
3. Git commit: `git add . && git commit -m "message" && git push origin main`
4. Render auto-redeploys in 1-2 minutes
5. Check Render Logs to confirm

### If you change frontend code:
1. Make changes locally
2. Test: `cd frontend && npm start`
3. Git commit: `git add . && git commit -m "message" && git push origin main`
4. Vercel auto-redeploys in 1-2 minutes
5. Check Vercel Logs to confirm

### If you change environment variables:
1. Update in Render/Vercel dashboard
2. For Render: Services usually auto-restart
3. For Vercel: Click latest deployment → "Redeploy"
4. Wait for deployment to finish

---

## 🚨 TROUBLESHOOTING FOR YOUR SETUP

### Problem: "Cannot POST /api/auth/login" (404)

**Your specific fix:**
1. Vercel → Settings → Environment Variables
2. Check: `REACT_APP_API_BASE_URL` is exactly:
   ```
   https://bookmyseat-backend-e5j6.onrender.com
   ```
   (Replace xxxxx with YOUR Render ID)
3. Click "Redeploy latest"
4. Wait 2 minutes
5. Try login again

### Problem: "CORS error" in browser

**Your specific fix:**
1. Open `backend/server.js`
2. Check line ~25 has `isProductionOrigin` function
3. It should already support `*.vercel.app`
4. If custom domain: Add it to regex pattern
5. Push to GitHub
6. Render auto-redeploys

### Problem: "Razorpay modal won't open"

**Your specific fix:**
1. Check `REACT_APP_RAZORPAY_KEY_ID` in Vercel env vars
2. Should match: Dashboard → https://dashboard.razorpay.com
3. Check `frontend/public/index.html` has Razorpay script:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```
4. If missing, add to `<head>` section
5. Push to GitHub
6. Vercel redeploys

### Problem: "Render service suspended"

Free tier stops after 15 minutes idle.

**Your options:**
1. Upgrade Render to paid ($7/month minimum)
2. Or visit Render dashboard → Click "Restart" every 15 min (not practical)
3. Or move to another provider (Railway, Fly.io, Heroku)

---

## 📋 YOUR PERSONAL CHECKLIST

Print this out and check off as you go:

```
BEFORE DEPLOYMENT:
☐ GitHub repo has clean code (git push origin main)
☐ Collected MONGO_URI from MongoDB
☐ Collected RAZORPAY keys from dashboard
☐ Collected OPENAI_API_KEY

RENDER BACKEND:
☐ Created Render account
☐ Created Web Service
☐ Set Root Directory to: backend
☐ Added all 5 environment variables
☐ Service shows "Live" status
☐ Copied Render URL: https://bookmyseat-backend-xxxxx.onrender.com

VERCEL FRONTEND:
☐ Created Vercel account
☐ Created Project
☐ Set Root Directory to: frontend
☐ Added REACT_APP_API_BASE_URL = MY RENDER URL
☐ Added REACT_APP_RAZORPAY_KEY_ID
☐ Project shows "Ready" status
☐ Copied Vercel URL: https://bookmyseat-ai-xxxxx.vercel.app

TESTING:
☐ Backend URL accessible in browser
☐ Frontend URL accessible in browser
☐ Login works (check Network tab)
☐ Payment modal opens
☐ Test payment succeeds
☐ Chatbot responds
☐ No console errors

READY FOR LAUNCH:
☐ All tests pass
☐ No red errors
☐ No 404s in Network tab
☐ Verified login flow
☐ Verified payment flow
☐ Ready to share URLs with friends! 🎉
```

---

## 🎯 QUICK REFERENCE FOR YOUR PROJECT

```
Repository:     https://github.com/ReshDeen/BookMySeats_AI
Frontend Folder: /frontend (React app)
Backend Folder:  /backend (Express server)

Frontend Entry:  frontend/src/index.js
Backend Entry:   backend/server.js

Build Systems:
  Frontend: npm run build (creates /frontend/build)
  Backend: npm install (in /backend)

Environment Files:
  Frontend vars:  REACT_APP_* prefix (frontend/.env.production)
  Backend vars:   No prefix (backend/.env)

API Base Helper: frontend/src/utils/api.js
  Uses: REACT_APP_API_BASE_URL environment variable

Firebase Config: frontend/src/firebase.js
  Already configured ✅

Database: MongoDB Atlas (via MONGO_URI)
Payment: Razorpay (via KEY_ID and KEY_SECRET)
AI: OpenAI (via OPENAI_API_KEY)
Auth: Firebase (front) + MongoDB (back)
```

---

## 📞 IF YOU GET STUCK

1. **Check Render Logs:**
   - Render Dashboard → bookmyseat-backend → Logs tab
   - Look for red error messages

2. **Check Vercel Logs:**
   - Vercel Dashboard → bokmyseat-ai → Deployments → Latest → Logs

3. **Check Browser Console:**
   - F12 → Console tab
   - Look for red error messages

4. **Check Network Tab:**
   - F12 → Network tab
   - Click on API request
   - Check Response for error details

5. **Run console test:**
   - In browser: `fetch('https://YOUR_RENDER_URL/').then(r => r.text()).then(t => console.log(t))`
   - Should print server message

---

**Last Updated:** April 15, 2026
**Project:** BookMySeats_AI
**Status:** Ready for production deployment

✅ You have everything you need. Start with Step 0 and work through each step!
