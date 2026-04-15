# 📋 DEPLOYMENT PREPARATION CHECKLIST

Use this document to gather all information needed before deployment.

---

## 1️⃣ MONGODB ATLAS SETUP

### Create/Get MongoDB Connection String

1. Go to: https://www.mongodb.com/cloud/atlas
2. Log in (or create account)
3. Click **"Create"** → **Create a Cluster** (Choose Free Tier)
4. Create a database user:
   - Username: `bookmyseat_user`
   - Password: Generate strong password
5. Get connection string:
   - Cluster → **"Connect"** → **"Drivers"**
   - Copy connection string
   - Replace `<username>` and `<password>`

### Your MongoDB Connection String:

```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/bookmyseat?retryWrites=true&w=majority
```

**Fill in your values:**
- Cluster name: `__________________________`
- Username: `__________________________`
- Password: `__________________________`
- Complete URI: `__________________________`

---

## 2️⃣ RAZORPAY SETUP

### Get Razorpay Keys

1. Go to: https://dashboard.razorpay.com/
2. Log in
3. Settings → API Keys
4. Copy:
   - **Key ID** (Public, safe to expose)
   - **Key Secret** (Private, ONLY in backend .env)

### Your Razorpay Keys:

**Test Key ID (for public use in frontend):**
```
RAZORPAY_KEY_ID=__________________________
```

**Test Key Secret (for backend only):**
```
RAZORPAY_KEY_SECRET=__________________________
```

**Test card for payment testing:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)

---

## 3️⃣ OPENAI API KEY (For Chatbot)

### Get OpenAI Key

1. Go to: https://platform.openai.com/api-keys
2. Log in (or create account)
3. Click **"Create new secret key"**
4. Copy key

### Your OpenAI Key:

```
OPENAI_API_KEY=__________________________
```

---

## 4️⃣ FIREBASE CONFIGURATION (Already Set)

✅ **Frontend** → `frontend/src/firebase.js` already configured.

Your Firebase Project ID: `bookmyseatsai`

**No action needed** - Firebase is already configured in code.

---

## 5️⃣ BACKEND ENVIRONMENT VARIABLES (For Render)

Create `backend/.env` with these values:

```env
# MongoDB
MONGO_URI=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# OpenAI
OPENAI_API_KEY=

# Server
PORT=5000
NODE_ENV=production
```

**Checklist:**
- [ ] MONGO_URI filled
- [ ] RAZORPAY_KEY_ID filled
- [ ] RAZORPAY_KEY_SECRET filled
- [ ] OPENAI_API_KEY filled
- [ ] File saved as `backend/.env`
- [ ] `.env` is NOT committed (already in .gitignore)

---

## 6️⃣ RENDER DEPLOYMENT

### Before you deploy:

**Backend repository:** `ReshDeen/BookMySeats_AI`
**Root Directory:** `backend` ✅

**Environment Variables to add in Render:**

| Variable | Value | From |
|----------|-------|------|
| MONGO_URI | _____________ | MongoDB Atlas |
| RAZORPAY_KEY_ID | _____________ | Razorpay Dashboard |
| RAZORPAY_KEY_SECRET | _____________ | Razorpay Dashboard |
| OPENAI_API_KEY | _____________ | OpenAI |
| NODE_ENV | `production` | Fixed |

**After deployment, note:**
- Render Backend URL: `https://__________________________`

---

## 7️⃣ VERCEL DEPLOYMENT

### Before you deploy:

**Frontend repository:** `ReshDeen/BookMySeats_AI`
**Root Directory:** `frontend` ✅

**Build & Output:**
- Build Command: `npm run build` ✅
- Output Directory: `build` ✅

**Environment Variables to add in Vercel:**

| Variable | Value | From |
|----------|-------|------|
| REACT_APP_API_BASE_URL | `https://bookmyseat-backend-XXXXX.onrender.com` | Render URL (step 6) |
| REACT_APP_RAZORPAY_KEY_ID | _____________ | Razorpay Dashboard |

**After deployment, note:**
- Vercel Frontend URL: `https://__________________________`

---

## 8️⃣ FIREBASE CONFIGURATION (Already Set)

**Frontend** → `frontend/src/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA0KigMSTkCXvQy0sUEI5nXcWHGcABTzak",
  authDomain: "bookmyseatsai.firebaseapp.com",
  projectId: "bookmyseatsai",
  storageBucket: "bookmyseatsai.firebasestorage.app",
  messagingSenderId: "1066738061230",
  appId: "1:1066738061230:web:869ea23524d278ef90823f",
  measurementId: "G-FN8CELEJ43"
};
```

✅ **Already configured** - No changes needed

---

## 9️⃣ TEST CREDENTIALS

### For testing login:

Create a test user:
1. Go to Vercel deployed frontend
2. Click **"Sign Up"** (if available) or use **"Email Login"**
3. Register test account:
   - Email: `test@example.com`
   - Password: `Test@123456`

### For testing payment:

Use Razorpay test card:
- **Card Number:** `4111 1111 1111 1111`
- **Expiry:** `12/25` (or any future date)
- **CVV:** `123` (any 3 digits)
- **Name:** Any name
- **Amount:** Will be pre-filled

---

## 🔟 DEPLOYMENT ORDER

**Follow this exact order:**

1. ✅ **Set up MongoDB Atlas** → Get MONGO_URI
2. ✅ **Set up Razorpay** → Get KEY_ID and KEY_SECRET
3. ✅ **Set up OpenAI** → Get API_KEY
4. ✅ **Create `backend/.env`** with all keys
5. ✅ **Deploy backend to Render** → Get Render URL
6. ✅ **Deploy frontend to Vercel** → Use Render URL
7. ✅ **Test login flow** → Check network requests
8. ✅ **Test payment flow** → Try test card
9. ✅ **Test chatbot** → Send test message

---

## 📝 FINAL DEPLOYMENT SUMMARY

**Saved URLs for reference:**

```
Backend (Render):
URL: https://___________________________________

Frontend (Vercel):
URL: https://___________________________________

GitHub Repository:
https://github.com/ReshDeen/BookMySeats_AI

MongoDB:
URI: mongodb+srv://___________________________________

Razorpay Account:
Dashboard: https://dashboard.razorpay.com/

Test Credentials:
Email: test@example.com
Password: Test@123456

Test Payment Card:
4111 1111 1111 1111 | 12/25 | 123
```

---

## ⚠️ SECURITY REMINDERS

- ✅ **Never commit `.env` files** - Already in `.gitignore`
- ✅ **Never share API keys** - Keep RAZORPAY_KEY_SECRET private
- ✅ **RAZORPAY_KEY_ID is public** - OK to have in frontend code
- ✅ **RAZORPAY_KEY_SECRET is private** - Only in backend `.env`
- ✅ **MONGO_URI** - Only in backend `.env`, never in frontend
- ✅ **OPENAI_API_KEY** - Only in backend `.env`, never in frontend

---

**Status:** ⏳ Ready to start deployment

**Next Step:** Follow `PRODUCTION_DEPLOYMENT_GUIDE.md`
