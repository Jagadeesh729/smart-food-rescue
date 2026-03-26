import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, ShieldCheck, Calendar, Phone, MapPin, Building2, UserCircle } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Member since March 2026';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
        
        {/* Profile Info Overlay */}
        <div className="relative px-8 pb-8">
          <div className="absolute -top-16 left-8">
            {user.picture ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <User size={64} />
              </div>
            )}
          </div>
          
          <div className="pt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  user.role === 'NGO' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {user.role}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                  <ShieldCheck size={16} /> Verified User
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Content Tabs/Grid */}
        <div className="border-t border-gray-100 px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Account Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCircle className="text-emerald-500" size={20} /> Account Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400"><Mail size={18} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Email Address</p>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400"><Phone size={18} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Phone Number</p>
                    <p className="text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400"><Calendar size={18} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Joined On</p>
                    <p className="text-gray-900 font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location / Organization Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="text-emerald-500" size={20} /> Organization Info
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400"><MapPin size={18} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Primary Location</p>
                    <p className="text-gray-900 font-medium">
                      {user.address?.city ? `${user.address.city}, ${user.address.state || ''}` : 'No address saved.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400"><Building2 size={18} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Account Type</p>
                    <p className="text-gray-900 font-medium">
                      {user.role === 'NGO' ? 'NGO / Rescue Organization' : 'Individual Food Donor'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-6 md:mt-0">
                <p className="text-sm text-emerald-800 font-medium italic">
                  "Working together to ensure no healthy food goes to waste."
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
