import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { UserPlus, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'Donor', phone: '' 
  });
  const [otpData, setOtpData] = useState({ userId: '', code: '' });
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, verifyOTP } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await register(formData);
      setOtpData({ ...otpData, userId: res.userId });
      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
              <Input label="Full Name / Organization" name="name" value={formData.name} onChange={handleChange} required />
              <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Account Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="role" value="Donor" checked={formData.role === 'Donor'} onChange={handleChange} className="mr-2 accent-emerald-600" />
                    Donor
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="role" value="NGO" checked={formData.role === 'NGO'} onChange={handleChange} className="mr-2 accent-emerald-600" />
                    NGO / Receiver
                  </label>
                </div>
              </div>

              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />

              <Button type="submit" disabled={loading} className="py-3 mt-6">
                {loading ? 'Registering...' : 'Sign Up'}
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
              <p className="mt-2 text-sm text-gray-600">Enter the 6-digit OTP sent to your email.</p>
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
