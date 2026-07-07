/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  };

  const verifyOTP = async (userId, otp) => {
    const { data } = await api.post('/auth/verify', { userId, otp });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const resendOTP = async (userId) => {
    const { data } = await api.post('/auth/resend-otp', { userId });
    return data;
  };

  const checkEmail = async (email) => {
    const { data } = await api.get(`/auth/check-email?email=${email}`);
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Update profile — syncs backend data back to localStorage and context
  const updateProfile = async (profileData) => {
    const { data } = await api.put('/auth/profile', profileData);
    // Server returns a fresh token + updated user fields — update localStorage
    const updatedUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      verifyOTP,
      resendOTP,
      checkEmail,
      googleLogin,
      updateProfile,
      logout,
      loading: false
    }}>
      {children}
    </AuthContext.Provider>
  );
};
