# BookMySeats_AI

AI-powered movie ticket booking platform with smart recommendations, secure authentication, online payments, profile management, and downloadable receipts.

## Project Description
BookMySeats_AI is a full-stack web application for discovering movies, selecting seats, booking tickets, and managing payment history.

Key capabilities include:
- Firebase-powered login (Google and email)
- Guest access mode
- Movie listing and search
- Seat selection and booking workflow
- Razorpay payment integration
- Payment verification and receipt generation (PDF + email)
- AI chatbot assistance for movie/help queries
- Profile, notifications, and feedback modules

## Live Links
- Frontend (Vercel): https://bookmyseatsai.vercel.app
- Backend (Render): https://bookmyseats-ai-dekf.onrender.com
- GitHub Repository: https://github.com/ReshDeen/BookMySeats_AI
- Demo Video: 
- Presentation/Poster:
- Documentation:

## Tech Stack

### Frontend
- React 19 (Create React App)
- Firebase Auth
- CSS (custom styling)

### Backend
- Node.js
- Express.js
- Mongoose
- Nodemailer
- PDFKit

### AI + External Services
- OpenAI API (chat assistant)
- Razorpay (payments)
- Gmail SMTP (email receipts/notifications)

### Database
- MongoDB Atlas

## Core Features
- Sign up / Sign in with email-password
- Google OAuth login using Firebase
- Guest mode entry
- Browse and search recommended movies
- Seat availability and booking
- Razorpay checkout and payment verification
- Payment history and downloadable receipts
- Email receipt send endpoint
- User profile and notifications
- Feedback submission
- Chat assistant endpoint-backed UI

## Architecture Overview
- Frontend calls backend through environment-based API URL resolution.
- Backend exposes REST APIs under /api/* and manages:
  - auth lifecycle
  - booking lifecycle
  - payment + receipt lifecycle
  - profile + notifications
  - chatbot responses
- MongoDB stores users, bookings, payments, feedback, notifications, and chat history.

## API Overview

### Health
- GET /api/health

### Auth
- POST /api/auth/request-otp
- POST /api/auth/verify-otp
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/guest
- POST /api/auth/google-login
- GET /api/auth/profile/:userId
- PUT /api/auth/profile/:userId

### Movies
- GET /api/movies
- GET /api/movies/trending
- GET /api/movies/genre/:genre
- GET /api/movies/:movieId
- POST /api/movies
- POST /api/movies/seed/create-sample-movies

### Bookings
- GET /api/bookings/seats/:movieId
- POST /api/bookings/book
- GET /api/bookings/user/:userId
- GET /api/bookings/:bookingId
- PUT /api/bookings/:bookingId/payment
- PUT /api/bookings/:bookingId/cancel

### Payments
- POST /api/payments/create-order
- POST /api/payments/verify
- POST /api/payments/record
- GET /api/payments/history/:userId
- GET /api/payments/receipt/:paymentId
- GET /api/payments/receipt/:paymentId/pdf
- POST /api/payments/receipt/:paymentId/send

### Chatbot
- POST /api/chat/message
- POST /api/chat

### Feedback
- POST /api/feedback/submit
- GET /api/feedback/movie/:movieId
- GET /api/feedback/user/:userId
- GET /api/feedback

### Profile + Notifications
- GET /api/profile/:userId
- GET /api/notifications/user/:userId
- PUT /api/notifications/user/:userId/read-all

## Project Structure

```
BookMySeats_AI/
  backend/
    controllers/
    models/
    routes/
    services/
    server.js
    package.json
  frontend/
    public/
    src/
      components/
      pages/
      styles/
      utils/
    package.json
  README.md
```

## Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas connection string
- Firebase project (Auth enabled)
- Razorpay test/live credentials
- OpenAI API key
- Gmail app password (for SMTP)

### 1) Clone
```bash
git clone https://github.com/ReshDeen/BookMySeats_AI.git
cd BookMySeats_AI
```

### 2) Backend setup
```bash
cd backend
npm install
```

Create backend/.env:
```env
PORT=5000
MONGO_URI=
NODE_ENV=development

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

OPENAI_API_KEY=

EMAIL_USER=
EMAIL_PASS=

JWT_SECRET=
```

Run backend:
```bash
npm start
```

### 3) Frontend setup
```bash
cd ../frontend
npm install
```

Create frontend/.env.local:
```env
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=
```

Run frontend:
```bash
npm start
```

## Production Deployment

### Frontend (Vercel)
- Root directory: frontend
- Build command: npm run build
- Output directory: build

Required Vercel env vars:
```env
REACT_APP_API_BASE_URL=https://bookmyseats-ai-dekf.onrender.com
REACT_APP_RAZORPAY_KEY_ID=
```

### Backend (Render)
- Root directory: backend
- Build command: npm install
- Start command: node server.js

Required Render env vars:
```env
MONGO_URI=
NODE_ENV=production
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
OPENAI_API_KEY=
EMAIL_USER=
EMAIL_PASS=
JWT_SECRET=
```

## Firebase Setup Notes (Google Login)
To avoid auth/unauthorized-domain errors:
- Firebase Console -> Authentication -> Settings -> Authorized domains
- Add your production domain(s):
  - bookmyseatsai.vercel.app
  - any active vercel preview/project domain used for testing

Also ensure Google provider is enabled under Authentication -> Sign-in method.

## Database Notes
Main collections/models include:
- users
- movies
- bookings
- payments
- feedback
- notifications
- chat history

CRUD coverage:
- Create: auth, bookings, payment records, feedback
- Read: movies, profile, payment history, notifications
- Update: booking/payment state, notification read state, profile
- Delete: [Add if implemented in your current routes]

## Testing Checklist
- Email signup/login works
- Google login works from production domain
- Guest login works
- Seat booking flow works
- Razorpay popup opens and verifies payment
- Payment history renders with receipts
- Receipt email send endpoint works
- Chat assistant responds
- Profile and notifications load

## Known Notes
- Render free tier may sleep; first API call can be delayed.
- Google login requires correct Firebase authorized domains.
- Keep API keys only in deployment environment variables.

## Security Notes
- Never commit .env files.
- Rotate exposed keys immediately if they were ever shared.
- Use separate dev/test/prod credentials.

## Roadmap (Optional)
- Add admin analytics dashboard
- Add booking cancellation refund workflow
- Add test suite (frontend + backend integration)
- Add rate limiting and API hardening

## Contributors
- ReshDeen (Reshma Banu T)

## License
..

---
If this project helped you, consider starring the repository.
