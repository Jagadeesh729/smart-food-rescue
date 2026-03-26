import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { LogIn, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otpData, setOtpData] = useState({ userId: '', code: '' });
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  const { login, verifyOTP, resendOTP, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  // Cooldown effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);
    
    const loadingToast = !showOtp ? toast.loading('Signing in...') : null;
    
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error detail:', err);
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      const userId = err.response?.data?.userId;
      
      if (message.toLowerCase().includes('verify') && userId) {
        setOtpData(prev => ({ ...prev, userId }));
        setShowOtp(true);
        toast( 'Please verify your email to continue.', { icon: 'ℹ️' });
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
      if (loadingToast) toast.dismiss(loadingToast);
    }
  };

  const handleGoogleSuccess = async (response) => {
    const loginToast = toast.loading('Signing in with Google...');
    try {
      await googleLogin(response.credential);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google login failed.');
    } finally {
      toast.dismiss(loginToast);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);
    const verifyToast = toast.loading('Verifying code...');
    
    try {
      await verifyOTP(otpData.userId, otpData.code);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      toast.dismiss(verifyToast);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    const resendToast = toast.loading('Sending code...');
    try {
      await resendOTP(otpData.userId);
      toast.success('New OTP sent to your email!');
      setCooldown(60); // 60s cooldown
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      setError(msg);
      toast.error(msg);
    } finally {
      toast.dismiss(resendToast);
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

            <form className="space-y-6" onSubmit={handleSubmit} autoComplete="on">
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign-In failed')}
                theme="outline"
                shape="pill"
                width={400}
                ux_mode="redirect"
              />
            </div>
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

            <form className="space-y-6" onSubmit={handleOtpSubmit} autoComplete="off">
              <Input 
                label="OTP Code" 
                name="code" 
                value={otpData.code} 
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setOtpData({ ...otpData, code: val });
                }} 
                required 
                placeholder="123456"
                className="text-center tracking-[0.5em] text-2xl font-mono"
                autoFocus
              />
              <Button type="submit" disabled={loading} className="py-3">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className={`font-bold ${cooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:underline'}`}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
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
