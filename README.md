# Smart Food Rescue System

A production-ready, portfolio-quality MERN stack application that connects food donors (restaurants, caterers, individuals) with NGOs and food rescue organizations in real-time.

## 🍱 Key Features

*   **Secure Authentication**: Dual-role JWT registration/login, multi-step email OTP verification using Nodemailer, and Google OAuth2 Sign-In.
*   **Real-Time Geolocation Matching**: Interactive map rendering (Leaflet/CARTO Map Tiles) with proximity filtering and client-side Haversine distance tracking.
*   **Reactive Dashboards**: Automatic, real-time counters, request timelines, and metrics charts powered by Socket.io and Recharts.
*   **Donation Lifecycle Manager**: Visual progress steps (Created → Requested → Accepted → Picked Up → Completed) with automatic background expiration cron jobs.
*   **Recent Activity Log**: In-memory generated activity timeline displaying historical status events without database bloating.
*   **Image Management**: Direct multipart-upload handling with CDN delivery optimization via Cloudinary.

---

## 🛠️ Tech Stack

*   **Database**: MongoDB (Mongoose ORM)
*   **Server Framework**: Node.js & Express
*   **Frontend Library**: React 19 (Vite Build System)
*   **Styling**: Tailwind CSS & Lucide Icons
*   **Web Sockets**: Socket.io-client / Socket.io-server
*   **Scheduling**: Node-Cron (Background Expiry Cleaner)

---

## 📁 Folder Structure

```text
smart-food-rescue/
├── backend/                  # Express server app
│   ├── uploads/              # Local backup uploads folder
│   └── src/
│       ├── config/           # Database configuration
│       ├── controllers/      # Route controllers (Auth, Donations, Requests, Stats)
│       ├── cron/             # Background node-cron jobs (Expiry checks)
│       ├── middleware/       # Auth guard, upload validator
│       ├── models/           # MongoDB Mongoose schemas (User, Donation, Request)
│       ├── routes/           # REST Router endpoints
│       ├── services/         # CDN and Email services
│       ├── sockets/          # Socket.io connection/room logic
│       ├── utils/            # Geolocation and Token generators
│       └── server.js         # Entry point
│
└── frontend/                 # React SPA application
    └── src/
        ├── assets/           # Visual resources
        ├── components/       # Reusable inputs, buttons, navbar
        ├── context/          # Global session state (AuthContext, SocketContext)
        ├── pages/            # View components (Home, Profile, Dashboard, Browse, Add)
        ├── services/         # Axios wrapper config
        ├── App.jsx           # Routing & Toast provider
        ├── main.jsx          # Entry point
        └── index.css         # Tailwind directives
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

Copy the template from `backend/.env.example` and supply:
```ini
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food_rescue
JWT_SECRET=your_super_jwt_secret_key
FRONTEND_URL=http://localhost:5173

# Email/SMTP (for OTP verification)
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

# CDN (for images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Sign-in Auth
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Frontend (`frontend/.env`)

Create a `.env` file in the `frontend` folder:
```ini
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Running Locally

### 1. Prerequisite Checks
Ensure you have `Node.js` (v18+) and a running instance of `MongoDB` locally.

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 API Endpoint Overview

### Authentication (`/api/auth`)
*   `POST /register` - Registers email/password with verification OTP.
*   `POST /verify` - Submits 6-digit OTP code to verify and activate account.
*   `POST /login` - Standard email/password login.
*   `POST /resend-otp` - Refreshes OTP and triggers SMTP delivery.
*   `POST /google` - Decodes JWT credential payload from Google login.
*   `GET /profile` - Fetches authenticated profile details.
*   `PUT /profile` - Updates phone, address, name, or password.

### Donations (`/api/donations`)
*   `POST /` - Creates new food donation listing (requires Donor role, multipart image, coordinates).
*   `GET /` - Retrieves available (Pending/Requested) food within proximity limits.
*   `GET /my` - Lists active/past donations posted by the logged-in donor.
*   `GET /:id` - Fetches precise details for a specific listing.

### Requests (`/api/requests`)
*   `POST /` - NGO claims a donation (sets donation status to `Requested`).
*   `GET /` - Fetches incoming requests (for Donors) or sent claims (for NGOs).
*   `PUT /:id/status` - Updates claim status (Accepted, PickedUp, Completed, Rejected).
*   `DELETE /:id` - Cancels pending NGO requests and resets donation status back to `Pending`.

### Analytics (`/api/stats`)
*   `GET /` - Returns dashboard overview statistics (including daily sub-metrics).
*   `GET /public` - Fetches public platform counters (Total Rescued Meals, Active Donors, Active NGOs).

---

## 🛫 Deployment Guide

### Backend Deployment (Render, Heroku, or VPS)
1. Set the Node.js production start script: `node src/server.js`.
2. Configure all environment variables in your hosting dashboard.
3. Configure `FRONTEND_URL` to point to your hosted frontend URL.

### Frontend Deployment (Vercel, Netlify)
1. Add environment variables: `VITE_API_URL` and `VITE_SOCKET_URL` pointing to your backend host.
2. For SPA client-side routing on **Vercel**, include a `vercel.json` file in the frontend root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
