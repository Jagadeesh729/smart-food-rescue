import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { UserPlus, ShieldCheck, MailCheck, MailX, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'Donor', phone: '' 
  });
  const [otpData, setOtpData] = useState({ userId: '', code: '' });
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  // Email check states
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, checking, taken, available
  const checkTimeoutRef = useRef(null);

  const { register, verifyOTP, resendOTP, checkEmail, googleLogin } = useContext(AuthContext);
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'email') {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      
      if (!value || !value.includes('@')) {
        setEmailStatus('idle');
        return;
      }

      setEmailStatus('checking');
      checkTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await checkEmail(value);
          setEmailStatus(res.exists ? 'taken' : 'available');
        } catch (err) {
          setEmailStatus('idle');
        }
      }, 250);
    }
  };

  const handleGoogleSuccess = async (response) => {
    const loginToast = toast.loading('Signing up with Google...');
    try {
      await googleLogin(response.credential);
      toast.success('Account created and verified!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google registration failed.');
    } finally {
      toast.dismiss(loginToast);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (emailStatus === 'taken') {
      toast.error('This email is already registered.');
      return;
    }
    
    setError('');
    setLoading(true);
    const regToast = toast.loading('Creating account...');
    
    try {
      const res = await register(formData);
      setOtpData({ ...otpData, userId: res.userId });
      setShowOtp(true);
      toast.success('Account created! Please verify your email.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      toast.dismiss(regToast);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const verifyToast = toast.loading('Verifying code...');
    
    try {
      await verifyOTP(otpData.userId, otpData.code);
      toast.success('Great! Your email is verified.');
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
      setCooldown(60);
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
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        
        {!showOtp ? (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <UserPlus size={24} />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
              <p className="mt-2 text-sm text-gray-600">Join our food rescue network today</p>
            </div>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-6 font-medium">{error}</div>}

            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <Input label="Full Name / Organization" name="name" value={formData.name} onChange={handleChange} required autoComplete="name" />
              
              <div className="relative">
                <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                <div className="absolute right-0 top-9 pr-3 flex items-center pt-0.5">
                  {emailStatus === 'checking' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                  {emailStatus === 'available' && <MailCheck className="w-5 h-5 text-emerald-500" />}
                  {emailStatus === 'taken' && <MailX className="w-5 h-5 text-red-500" />}
                </div>
                {emailStatus === 'taken' && <p className="text-[11px] text-red-500 mt-1 font-medium italic">Email already in use. Maybe login?</p>}
              </div>

              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" />
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Account Type</label>
                <div className="flex space-x-4">
                  <label htmlFor="role-donor" className="flex items-center cursor-pointer">
                    <input type="radio" id="role-donor" name="role" value="Donor" checked={formData.role === 'Donor'} onChange={handleChange} className="mr-2 accent-emerald-600" />
                    Donor
                  </label>
                  <label htmlFor="role-ngo" className="flex items-center cursor-pointer">
                    <input type="radio" id="role-ngo" name="role" value="NGO" checked={formData.role === 'NGO'} onChange={handleChange} className="mr-2 accent-emerald-600" />
                    NGO / Receiver
                  </label>
                </div>
              </div>

              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required autoComplete="new-password" />

              <Button type="submit" disabled={loading || emailStatus === 'checking'} className="py-3 mt-6">
                {loading ? 'Registering...' : 'Sign Up'}
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
              <p className="mt-2 text-sm text-gray-600">Enter the 6-digit OTP sent to your email.</p>
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
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-500 transition">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
