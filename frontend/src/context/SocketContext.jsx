import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  // FIX: Use user._id as dependency (not the full user object) to prevent
  // unnecessary socket reconnects when auth state updates with same user
  const userId = user?._id;

  useEffect(() => {
    let socketInstance;

    if (userId) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        console.log('✅ [Socket] Connected to server');
        socketInstance.emit('joinRoom', userId);
      });

      socketInstance.on('connect_error', (err) => {
        // Non-fatal — real-time updates will just be delayed
        console.warn('⚠️ [Socket] Connection error (real-time updates may be delayed):', err.message);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log(`🔌 [Socket] Disconnected: ${reason}`);
      });

      // FIX: Do NOT add newRequest/statusUpdate listeners here.
      // Those are component-level concerns handled in Dashboard.jsx to avoid
      // duplicate toasts. Only global/cross-app events belong here.

      setSocket(socketInstance);
    } else {
      // User logged out — clear socket
      setSocket(null);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [userId]); // FIX: depend on userId, not the full user object

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook with safe null checks
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  // If context is null (before mount), return safe default
  if (!context) {
    return { socket: null };
  }

  return context;
};

export default SocketContext;
