const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

// Load env vars at the very beginning before any modules are required
dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');
const startExpiryJob = require('./cron/expiryJob');

// Routes
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const requestRoutes = require('./routes/requestRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const server = http.createServer(app);

// Middleware
const path = require('path');
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174',
  'https://smart-food-rescue-jet.vercel.app'
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS Warning: Origin ${origin} is not in whitelist.`);
      callback(null, false); // Don't throw error, just block CORS
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security Headers for Google Sign-In
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/stats', statsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Smart Food Rescue API is running...');
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database first
    await connectDB();
    
    // 2. Initialize Socket.io
    initSocket(server);
    
    // 3. Start Cron Jobs
    startExpiryJob();
    
    // 4. Start HTTP Server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Fatal Startup Error: Server failed to start due to database connection failure.');
    process.exit(1);
  }
};

startServer();
