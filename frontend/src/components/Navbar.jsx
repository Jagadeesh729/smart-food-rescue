import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Utensils, LogOut, LayoutDashboard, HeartHandshake } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-emerald-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center space-x-2 font-bold text-2xl hover:text-emerald-100 transition">
          <Utensils size={32} />
          <span>Smart Food Rescue</span>
        </Link>
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              <span className="font-medium text-emerald-100 hidden sm:block">Hello, {user.name}</span>
              <Link to="/donations" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                <HeartHandshake size={20} /> Browse
              </Link>
              <Link to="/dashboard" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                <LayoutDashboard size={20} /> Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-emerald-200 transition font-medium">Login</Link>
              <Link to="/register" className="bg-white text-emerald-600 hover:bg-gray-100 px-5 py-2 rounded-lg font-bold transition shadow-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
