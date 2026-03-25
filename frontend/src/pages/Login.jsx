import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otpData, setOtpData] = useState({ userId: '', code: '' });
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, verifyOTP, resendOTP } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error detail:', err);
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      const userId = err.response?.data?.userId;
      
      if (message.toLowerCase().includes('verify') && userId) {
        setOtpData(prev => ({ ...prev, userId }));
        setShowOtp(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await verifyOTP(otpData.userId, otpData.code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-8 border border-gray-100">
        
        {!showOtp ? (
          <>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <LogIn size={24} />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to continue your food rescue journey
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input 
                  label="Email Address" 
                  name="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <Input 
                  label="Password" 
                  name="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" disabled={loading} className="py-3">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">Verify Email</h2>
              <p className="mt-2 text-sm text-gray-600">Account found, but not verified. Enter the OTP sent to your email.</p>
            </div>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-6 font-medium">{error}</div>}

            <form className="space-y-6" onSubmit={handleOtpSubmit}>
              <Input 
                label="OTP Code" 
                name="code" 
                value={otpData.code} 
                onChange={(e) => setOtpData({ ...otpData, code: e.target.value })} 
                required 
                placeholder="123456"
                className="text-center tracking-widest text-xl"
              />
              <Button type="submit" disabled={loading} className="py-3">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={async () => {
                    setError('');
                    try {
                      await resendOTP(otpData.userId);
                      alert('New OTP sent to your email!');
                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to resend OTP.');
                    }
                  }}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Resend code
                </button>
              </div>
            </form>
          </>
        )}
        
        {!showOtp && (
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-500 transition">
              Sign up now
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
