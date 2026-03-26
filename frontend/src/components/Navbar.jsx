import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Utensils, LogOut, LayoutDashboard, HeartHandshake, User, Menu, X, UserCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const navLinks = [
    { name: 'Browse Donations', path: '/donations', icon: <HeartHandshake size={20} /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  ];

  return (
    <nav className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 font-bold text-2xl hover:scale-105 transform transition duration-200">
            <Utensils size={32} />
            <span className="hidden xs:block tracking-tight text-white">Smart Rescue</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className="hover:text-emerald-100 transition-colors font-semibold flex items-center gap-1.5 text-sm"
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-emerald-700/50 hover:bg-emerald-700 p-1.5 pr-3 rounded-full transition duration-200 border border-emerald-500/30"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white border border-white/20">
                      <User size={18} />
                    </div>
                  )}
                  <span className="text-sm font-bold truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 text-gray-800 animate-in fade-in zoom-in duration-200">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition font-bold text-sm"
                      >
                        <UserCircle size={18} className="text-emerald-600" /> My Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 hover:text-red-600 transition font-bold text-sm text-gray-600"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="hover:text-emerald-100 transition-colors font-bold text-sm">Login</Link>
                <Link to="/register" className="bg-white text-emerald-600 hover:bg-gray-100 px-5 py-2 rounded-xl font-extrabold transition shadow-sm text-sm">
                  Join Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 transition shadow-inner"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Links */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-emerald-500 animate-in slide-in-from-top duration-300">
            <div className="space-y-2 mt-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-700 transition font-bold"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              
              {user && (
                <Link 
                  to="/profile" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-700 transition font-bold"
                >
                  <UserCircle size={20} /> My Profile
                </Link>
              )}

              <div className="pt-2 border-t border-emerald-500">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-800/50 hover:bg-red-600 transition font-bold"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    <Link 
                      to="/login" 
                      onClick={() => setIsMenuOpen(false)}
                      className="text-center p-3 rounded-xl border-2 border-emerald-400 hover:bg-emerald-700 transition font-bold"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setIsMenuOpen(false)}
                      className="text-center p-3 rounded-xl bg-white text-emerald-600 hover:bg-emerald-50 transition font-extrabold shadow-md"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
