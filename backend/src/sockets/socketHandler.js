const socketIo = require('socket.io');

let io;

const getAllowedOrigins = () => {
  const origins = ['http://localhost:5173', 'http://localhost:5174'];
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  return origins;
};

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // User joins a private room named with their user ID for direct notifications
    socket.on('joinRoom', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`[Socket] User ${userId} joined their private room`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Returns io instance, or null if not initialized (safer than throwing)
const getIo = () => {
  if (!io) {
    throw new Error('[Socket] Socket.io not initialized');
  }
  return io;
};

// Broadcast a new donation to all connected NGOs browsing the donations page
const broadcastNewDonation = (donation) => {
  if (!io) return;
  // Emit to all connected clients (NGOs can react to this in BrowseDonations)
  io.emit('newDonationBroadcast', {
    _id: donation._id,
    title: donation.title,
    foodType: donation.foodType,
    quantity: donation.quantity,
    unit: donation.unit,
    location: donation.location,
    expiryTime: donation.expiryTime,
    status: donation.status,
    createdAt: donation.createdAt
  });
};

module.exports = {
  initSocket,
  getIo,
  broadcastNewDonation
};
