import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let socketInstance;

    if (user) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'] // Ensure compatibility
      });

      socketInstance.on('connect', () => {
        console.log('✅ Connected to socket server');
        socketInstance.emit('joinRoom', user._id);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
        // Added console warning as requested by the user
        console.warn('Socket not available yet. Real-time updates may be delayed.');
      });

      // Global socket events if any
      socketInstance.on('newRequest', (data) => {
        toast.success(`New request for ${data.donationTitle || 'your donation'}!`, { icon: '🍱' });
      });

      socketInstance.on('statusUpdate', (data) => {
        toast(`Donation status updated to ${data.status}`, { icon: '🔔' });
      });

      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  // Provide an object with the socket for easy destructuring
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context safely
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  // Defensive programming: check if context exists
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  // Handle the case where the context itself might be null (not provided at all)
  if (!context) {
    console.warn('SocketContext is null. Make sure SocketProvider wraps your App.');
    return { socket: null };
  }

  return context;
};

export default SocketContext;
