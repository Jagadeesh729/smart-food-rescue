import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddDonation from './pages/AddDonation';
import BrowseDonations from './pages/BrowseDonations';
import Profile from './pages/Profile';
import { Home as HomeIcon } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

// 404 Page
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
    <div className="text-8xl font-black text-gray-100 mb-2">404</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
    <p className="text-gray-500 mb-8 max-w-md">
      The page you're looking for doesn't exist or may have been moved.
    </p>
    <Link
      to="/"
      className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
    >
      <HomeIcon size={18} /> Back to Home
    </Link>
  </div>
);

const AppContent = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/donations" element={<BrowseDonations />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/add-donation" element={
            <ProtectedRoute allowedRoles={['Donor']}>
              <AddDonation />
            </ProtectedRoute>
          } />

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Toaster with proper config */}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
          },
          success: {
            style: { background: '#065f46', color: '#d1fae5' },
            iconTheme: { primary: '#34d399', secondary: '#d1fae5' }
          },
          error: {
            style: { background: '#7f1d1d', color: '#fecaca' },
            iconTheme: { primary: '#f87171', secondary: '#fecaca' }
          }
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
