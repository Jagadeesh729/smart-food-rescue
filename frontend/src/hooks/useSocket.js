import { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
      
      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        socketInstance.emit('joinRoom', user._id);
      });

      socketInstance.on('newRequest', (data) => {
        toast.success(`New request from ${data.ngoName} for your donation!`, {
          duration: 5000,
          position: 'top-right',
        });
      });

      socketInstance.on('statusUpdate', (data) => {
        toast.success(`Donation "${data.donationTitle}" status updated to ${data.status}`, {
          duration: 5000,
          position: 'top-right',
        });
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user]);

  return socket;
};
