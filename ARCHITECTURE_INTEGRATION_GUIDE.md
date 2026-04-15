# 🏗️ ARCHITECTURE & INTEGRATION GUIDE

---

## 📱 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│  (Chrome, Firefox, Safari on any device)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS Request
                         │
                    ┌────▼────────────────────────────────┐
                    │    VERCEL (Frontend)                │
                    │  bookmyseat-ai-xxxxx.vercel.app     │
                    │                                      │
                    │  React App                           │
                    │  ├─ Login Page                       │
                    │  ├─ Theater (Seat Selection)         │
                    │  ├─ Payment Page                     │
                    │  ├─ Profile                          │
                    │  └─ Chatbot Component                │
                    └────┬─────────────────────────────────┘
                         │
                         │ Calls buildApiUrl()
                         │ Uses: REACT_APP_API_BASE_URL env var
                         │
                    ┌────▼────────────────────────────────┐
                    │    RENDER (Backend)                 │
                    │  bookmyseat-backend-xxxxx.onr...    │
                    │                                      │
                    │  Express.js API                      │
                    │  ├─ GET /api/health                  │
                    │  ├─ POST /api/auth/login             │
                    │  ├─ POST /api/auth/signup            │
                    │  ├─ POST /api/payments/create-order  │
                    │  ├─ POST /api/payments/verify        │
                    │  ├─ POST /api/bookings/book          │
                    │  ├─ POST /api/chatbot                │
                    │  └─ GET /api/movies                  │
                    └────┬─────────────────────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
      │ Query           │ Query            │ API Call
      │ & Update        │ & Update         │
      │                  │                  │
    ┌─▼──────────────┐ ┌─▼───────────────┐ ┌─▼──────────────┐
    │   MongoDB      │ │   Razorpay      │ │   OpenAI       │
    │   Atlas        │ │   Payment API   │ │   (Chatbot)    │
    │                │ │                 │ │                │
    │ • Users        │ │ • Create orders │ │ • Responses    │
    │ • Bookings     │ │ • Verify pay    │ │ • Recommendations
    │ • Payments     │ │                 │ │                │
    │ • Feedback     │ └─────────────────┘ └────────────────┘
    │ • Notifications│
    └────────────────┘
```

---

## 🔄 DATA FLOW: LOGIN

```
1. User enters email & password
   ↓
2. frontend/src/pages/Login.js calls:
   buildApiUrl('/api/auth/login')
   ↓
3. buildApiUrl() returns:
   'https://render-backend-url.onrender.com/api/auth/login'
   ↓
4. Frontend sends POST request:
   {
     email: 'user@example.com',
     password: 'password123'
   }
   ↓
5. Render Backend receives at:
   backend/routes/authRoutes.js → /api/auth/login
   ↓
6. Backend:
   - Finds user in MongoDB
   - Compares password
   - If match: Returns user object
   - If no match: Returns error
   ↓
7. Frontend receives response
   ↓
8. If success:
   - Save user to state
   - Save to localStorage
   - Redirect to Dashboard
   ↓
9. User is logged in ✅
```

---

## 💳 DATA FLOW: PAYMENT

```
1. User selects seats & clicks "Pay Now"
   ↓
2. Frontend (Payment.js) calls:
   buildApiUrl('/api/payments/create-order')
   ↓
3. Request body:
   { amount: 300 } (price in rupees)
   ↓
4. Backend receives order creation request
   ↓
5. Backend creates Razorpay order:
   razorpay.orders.create({
     amount: 30000, (in paise, so 300 * 100)
     currency: 'INR'
   })
   ↓
6. Backend returns:
   {
     id: 'order_xxxxx',
     amount: 30000,
     currency: 'INR'
   }
   ↓
7. Frontend opens Razorpay modal with:
   {
     key: RAZORPAY_KEY_ID, (public key)
     amount: 30000,
     order_id: 'order_xxxxx'
   }
   ↓
8. User enters payment details:
   Card: 4111 1111 1111 1111
   Expiry: 12/25
   CVV: 123
   ↓
9. Razorpay processes payment
   ↓
10. Razorpay returns paymentResponse:
    {
      razorpay_payment_id: 'pay_xxxxx',
      razorpay_order_id: 'order_xxxxx',
      razorpay_signature: 'sig_xxxxx'
    }
    ↓
11. Frontend calls:
    buildApiUrl('/api/payments/verify')
    with paymentResponse
    ↓
12. Backend verifies signature using:
    RAZORPAY_KEY_SECRET (private key)
    ↓
13. If signature valid:
    - Mark payment as "successful"
    - Create booking in MongoDB
    - Send confirmation email
    ↓
14. Frontend receives success
    ↓
15. Show success message ✅
    ↓
16. Booking created, user gets ticket 🎫
```

---

## 💬 DATA FLOW: CHATBOT

```
1. User types message in chatbot widget
   ↓
2. Frontend sends to:
   buildApiUrl('/api/chatbot')
   ↓
3. Request:
   {
     message: 'Recommend good movies',
     userId: 'user_id_from_firebase'
   }
   ↓
4. Backend receives at:
   backend/routes/chatbotRoutes.js
   ↓
5. Backend calls OpenAI API:
   openai.createChatCompletion({
     model: 'gpt-3.5-turbo',
     messages: [
       { role: 'user', content: 'message...' }
     ]
   })
   ↓
6. OpenAI returns AI response
   ↓
7. Backend sends back to frontend:
   {
     reply: 'AI generated response...',
     success: true
   }
   ↓
8. Frontend displays response in chatbot
   ↓
9. User sees AI answer ✅
```

---

## 🔐 SECURITY ARCHITECTURE

```
PUBLIC (Safe to expose):
├─ Frontend URLs (Vercel)
├─ Backend URLs (Render)
├─ Firebase API keys
└─ Razorpay KEY_ID (public identifier)

PRIVATE (Never expose):
├─ MONGO_URI (database connection)
├─ RAZORPAY_KEY_SECRET (payment secret)
├─ OPENAI_API_KEY (AI service key)
└─ Firebase private config (on backend)

WHERE THEY GO:
├─ Frontend .env.production:
│  ├─ REACT_APP_API_BASE_URL (backend URL)
│  └─ REACT_APP_RAZORPAY_KEY_ID (public key)
│
└─ Backend .env (Render environment):
   ├─ MONGO_URI
   ├─ RAZORPAY_KEY_SECRET
   └─ OPENAI_API_KEY
```

---

## 🌐 CORS POLICIES

```
Frontend Origin: https://bookmyseat-ai-xxxxx.vercel.app
Backend CORS Settings:

✅ ALLOWED:
├─ http://localhost:3000 (local dev)
├─ http://localhost:5000 (local dev)
├─ https://*.vercel.app (any Vercel frontend)
└─ https://*.render.com (any Render backend)

❌ BLOCKED:
├─ http://malicious-site.com
├─ https://some-random-domain.com
└─ Any requests without proper origin headers
```

---

## 🛣️ BACKEND ROUTE MAP

```
/api/auth/
  ├─ POST /login          ← Email/password login
  ├─ POST /signup         ← User registration
  ├─ POST /google-login   ← Google OAuth
  └─ POST /guest          ← Guest login

/api/payments/
  ├─ POST /create-order   ← Generate Razorpay order
  ├─ POST /verify         ← Verify payment signature
  └─ GET /history         ← User payment history

/api/bookings/
  ├─ POST /book           ← Create booking
  ├─ GET /:id             ← Get booking details
  └─ GET /user/:userId    ← Get user's bookings

/api/chatbot/
  ├─ POST /               ← Get AI response
  └─ GET /history         ← Chat history

/api/movies/
  ├─ GET /                ← List all movies
  ├─ GET /:id             ← Movie details
  └─ GET /search          ← Search movies

/api/notifications/
  ├─ GET /                ← User notifications
  ├─ POST /mark-read      ← Mark as read
  └─ DELETE /:id          ← Delete notification

/api/profile/
  ├─ GET /                ← User profile
  ├─ PUT /                ← Update profile
  └─ GET /feedback        ← User feedback

/api/feedback/
  ├─ POST /               ← Submit feedback
  └─ GET /                ← Get feedback
```

---

## 📡 ENVIRONMENT VARIABLES MAP

```
VERCEL (Frontend)
├─ REACT_APP_API_BASE_URL
│  └─ Used in: frontend/src/utils/api.js
│  └─ Value: https://bookmyseat-backend-xxxxx.onrender.com
│
└─ REACT_APP_RAZORPAY_KEY_ID
   └─ Used in: frontend/src/pages/Payment.js
   └─ Value: rzp_test_SbiSdl0tXVdjyx

RENDER (Backend)
├─ MONGO_URI
│  └─ Used in: backend/server.js line ~68
│  └─ Value: mongodb+srv://user:pass@cluster.mongodb.net/bookmyseat
│
├─ RAZORPAY_KEY_ID
│  └─ Used in: backend/routes/paymentRoutes.js
│  └─ Value: rzp_test_SbiSdl0tXVdjyx
│
├─ RAZORPAY_KEY_SECRET
│  └─ Used in: backend/routes/paymentRoutes.js
│  └─ Value: [secret key - never expose]
│
├─ OPENAI_API_KEY
│  └─ Used in: backend/routes/chatbotRoutes.js
│  └─ Value: sk-proj-xxxxx
│
├─ PORT
│  └─ Render sets automatically
│  └─ Value: 5000 (or Render's assigned port)
│
└─ NODE_ENV
   └─ Should be: production
   └─ Value: production
```

---

## 🔗 SERVICE CONNECTIONS

```
Vercel ← → Render
  │              │
  ├─(HTTPS)─────→├─ Express Server
  │              │
  └─(HTTPS)─────←└─ Returns JSON
                 │
                 ├─ MongoDB Atlas
                 │  └─ TCP/SSL Connection
                 │
                 ├─ Razorpay API
                 │  └─ HTTPS REST Call
                 │
                 └─ OpenAI API
                    └─ HTTPS REST Call
```

---

## 🚀 DEPLOYMENT SUMMARY

```
Step 1: Push clean code to GitHub
   ↓
Step 2: Create Render Web Service
   ├─ Point to: backend/ folder
   ├─ Add env vars: MONGO_URI, RAZORPAY_*, OPENAI_*
   └─ Deploy → Get Render URL
   ↓
Step 3: Create Vercel Project
   ├─ Point to: frontend/ folder
   ├─ Add env vars: REACT_APP_API_BASE_URL (Render URL),
   │                REACT_APP_RAZORPAY_KEY_ID
   └─ Deploy → Get Vercel URL
   ↓
Step 4: Test
   ├─ Login: Check Network tab → Request goes to Render URL ✅
   ├─ Payment: Razorpay modal opens → Test card succeeds ✅
   ├─ Chatbot: Send message → AI response received ✅
   └─ No errors in console ✅
   ↓
Step 5: Go Live 🎉
```

---

## 📊 PRODUCTION CHECKLIST

```
Before Launch:
☐ Backend service shows "Live" on Render
☐ Frontend app shows deployment success on Vercel
☐ REACT_APP_API_BASE_URL = Render backend URL
☐ All environment variables set in both services
☐ CORS allows Vercel frontend URL
☐ API endpoints respond with 200 OK
☐ Login flow works end-to-end
☐ Payment flow works end-to-end
☐ No console errors in DevTools
☐ No network 4xx/5xx errors
```

---

## 🎯 COMMON PITFALLS

```
❌ Mistake 1: Hardcoding localhost in frontend code
   ✅ Solution: Use REACT_APP_API_BASE_URL env var

❌ Mistake 2: Putting secrets in frontend code
   ✅ Solution: Only KEY_ID in frontend, KEY_SECRET in backend

❌ Mistake 3: Forgetting to set env vars after deploying
   ✅ Solution: Set in dashboard BEFORE deploying

❌ Mistake 4: Not redeploying after changing env vars
   ✅ Solution: Change env → Redeploy service

❌ Mistake 5: CORS not configured for new domain
   ✅ Solution: Add domain regex to backend CORS

❌ Mistake 6: Using localhost URL in Vercel env
   ✅ Solution: Use Render backend HTTPS URL

❌ Mistake 7: Committing .env files to GitHub
   ✅ Solution: Already in .gitignore - good!

❌ Mistake 8: Using Razorpay live keys in test
   ✅ Solution: Use test keys (rzp_test_*)
```

---

## 🔄 API REQUEST FLOW (In Code)

```
frontend/src/pages/Login.js:
1. User clicks Sign In
2. Calls: fetch(buildApiUrl('/api/auth/login'), {...})
3. buildApiUrl() checks process.env.REACT_APP_API_BASE_URL
4. buildApiUrl() returns: 
   'https://bookmyseat-backend-xxxxx.onrender.com/api/auth/login'
5. fetch() sends HTTPS request to that URL
6. Browser automatically includes credentials (cookies)
7. Request hits Render backend
8. Express routes to handler in backend/routes/authRoutes.js
9. Handler processes login
10. Handler returns JSON response
11. fetch() receives response
12. Frontend updates state/redirects
```

---

## 📈 SCALABILITY NOTES

```
Current Setup:
├─ Vercel: Auto-scales globally (CDN)
├─ Render: Single instance (free tier limited)
├─ MongoDB: Shared cluster (limited)
└─ Razorpay: Scales automatically

To Scale Up:
├─ Render: Upgrade instance size
├─ MongoDB: Upgrade to dedicated cluster
├─ Frontend: Already at scale on Vercel
└─ Add caching: Redis (requires upgrade)
```

---

**Last Updated:** April 15, 2026
**For:** BookMySeats_AI
**Version:** Production Ready
