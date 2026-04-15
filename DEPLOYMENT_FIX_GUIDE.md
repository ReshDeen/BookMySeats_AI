# BookMySeat AI - Deployment Fix Guide

## ✅ Code Changes Applied

- **Backend CORS:** Updated to allow Vercel and Netlify production domains
- **Login.js:** Fixed to use `buildApiUrl()` helper for all API calls
- **CORS credentials:** Enabled for cross-origin requests

---

## 🔧 Required Environment Variable Setup

### **STEP 1: Get Your Backend URL from Render**

1. Go to [render.com](https://render.com)
2. Click on your Web Service (backend deployment)
3. Copy the URL from the top - it should look like: `https://bookmyseat-backend.onrender.com`
4. **Keep this URL handy** - you'll need it for the next steps

---

### **STEP 2: Configure Vercel Frontend Environment Variables**

1. Go to [vercel.com](https://vercel.com)
2. Select your project (BookMySeat frontend)
3. Go to **Settings → Environment Variables**
4. Add these variables:

#### **For Production & Preview:**

| Key | Value | Example |
|-----|-------|---------|
| `REACT_APP_API_BASE_URL` | Your Render backend URL | `https://bookmyseat-backend.onrender.com` |
| `REACT_APP_RAZORPAY_KEY_ID` | Your Razorpay test key | `rzp_test_SbiSdl0tXVdjyx` |

**Steps:**
- Click "Add New"
- Set Key: `REACT_APP_API_BASE_URL`
- Set Value: `https://your-backend-url.onrender.com` (replace with your actual render URL)
- Select: Production, Preview
- Click Add
- Repeat for `REACT_APP_RAZORPAY_KEY_ID`

5. **Redeploy Vercel:**
   - Go to Deployments
   - Click "Redeploy" on the latest deployment
   - Choose "Use existing Build Cache" → Deploy

---

### **STEP 3: Update Render Backend Environment Variables**

1. Go to [render.com](https://render.com)
2. Select your Web Service (backend)
3. Go to **Settings → Environment**
4. Add/Update these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Your Vercel frontend URL (e.g., `https://bookmyseat.vercel.app`) |

**Steps:**
- Find the environment variable form
- Update `NODE_ENV` to `production`
- The CORS will automatically accept your Vercel domain (regex pattern included)
- Save changes

5. **Render will auto-redeploy** after environment changes

---

## 🧪 Testing Checklist

After deploying, test each feature:

### **1. Email Login**
- [ ] Go to your Vercel frontend
- [ ] Click "Continue with Mail"
- [ ] Create account or sign in
- [ ] Should redirect to home page ✅

### **2. Google Login**
- [ ] Click "Continue with Google"
- [ ] Complete Google login
- [ ] Should redirect to home page ✅

### **3. Payment (Razorpay)**
- [ ] Book seats for a movie
- [ ] Click "Proceed to Payment"
- [ ] Razorpay gateway should open
- [ ] Complete test payment (use test card: 4111 1111 1111 1111)
- [ ] Should show success message ✅

### **4. Profile & History**
- [ ] After login, go to Profile
- [ ] Should show user details and payment history
- [ ] No CORS errors in browser console ✅

---

## 🐛 Troubleshooting

### **Problem: CORS errors in browser console**
```
Access-Control-Allow-Origin missing
```
**Solution:**
- Check Vercel frontend URL in browser
- Verify it matches the domain format in backend CORS regex
- Render backend must be redeployed after environment changes
- Check backend logs on Render dashboard

### **Problem: API calls return 404**
```
GET https://bookmyseat-backend.onrender.com/api/auth/login 404
```
**Solution:**
- Verify `REACT_APP_API_BASE_URL` is set in Vercel
- Check it EXACTLY matches your Render URL (no trailing slash)
- Redeploy Vercel after changing env vars

### **Problem: Razorpay not loading/showing 404**
```
Razorpay: script loading failed
```
**Solution:**
- Verify **Razorpay checkout script in `frontend/public/index.html`** contains:
  ```html
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  ```
- Ensure `REACT_APP_RAZORPAY_KEY_ID` is set in Vercel
- Check browser console for script errors

### **Problem: Cookies/sessions not persisting**
**Solution:**
- CORS `credentials: true` is now enabled
- JWT tokens should work properly

---

## 📋 Quick Reference URLs

After deployment, you'll have:

```
Frontend (Vercel):  https://bookmyseat.vercel.app
Backend (Render):   https://bookmyseat-backend.onrender.com
API Routes:         https://bookmyseat-backend.onrender.com/api/*
```

Database (MongoDB) stays the same - both frontend and backend use the same MongoDB URI.

---

## 🚀 Next Steps

1. **Complete the environment variable setup above**
2. **Redeploy both Vercel and Render**
3. **Test all 4 features from the checklist**
4. **Check browser console for errors** (F12 → Console tab)
5. **Check Render logs** if backend issues persist

If you still have issues after these steps, check:
- Are environment variables actually saved? (Refresh and check again)
- Did you redeploy AFTER setting environment variables?
- Is the CORS error showing the exact domain? Note it down.

---

## 📞 Support Commands

**Check Render logs:**
```bash
Open Render dashboard → Your Web Service → Logs tab
Look for "Server listening" or error messages
```

**Test API directly:**
```bash
# Test if backend is running
curl https://your-render-backend-url.onrender.com/api/movies

# Should return JSON, not 404
```

**Check Frontend build:**
```bash
In Vercel dashboard → Deployments → Click latest → See build logs
Should show successful build with environment variables loaded
```
