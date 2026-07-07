import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  User, Mail, ShieldCheck, Calendar, Phone, MapPin, Building2,
  UserCircle, Edit3, Save, X, Lock, Package, CheckCircle, TrendingUp, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', city: '', state: '', street: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  // Fetch fresh profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/stats')
        ]);
        setProfileData(profileRes.data);
        setStats(statsRes.data);
        setForm({
          name: profileRes.data.name || '',
          phone: profileRes.data.phone || '',
          city: profileRes.data.address?.city || '',
          state: profileRes.data.address?.state || '',
          street: profileRes.data.address?.street || ''
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
        toast.error('Failed to load profile');
        // Fall back to localStorage data
        if (user) {
          setProfileData(user);
          setForm({
            name: user.name || '',
            phone: user.phone || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            street: user.address?.street || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (!user) return null;
  const display = profileData || user;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state
        }
      });
      setProfileData(prev => ({
        ...prev,
        name: form.name,
        phone: form.phone,
        address: { street: form.street, city: form.city, state: form.state }
      }));
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-pulse">
          <div className="h-32 bg-gray-200" />
          <div className="px-8 pb-8 pt-20 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  // Build stat cards based on role
  const statCards = display.role === 'Donor'
    ? [
        { label: 'Total Donations', value: stats?.totalDonations ?? '—', icon: Package, color: 'text-blue-500 bg-blue-50' },
        { label: 'Completed', value: stats?.completedDonations ?? '—', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' },
        { label: 'Active', value: stats?.activeDonations ?? '—', icon: TrendingUp, color: 'text-amber-500 bg-amber-50' },
        { label: 'Expired', value: stats?.expiredDonations ?? '—', icon: AlertTriangle, color: 'text-red-400 bg-red-50' },
      ]
    : [
        { label: 'Active Requests', value: stats?.activeRequests ?? '—', icon: TrendingUp, color: 'text-blue-500 bg-blue-50' },
        { label: 'Completed', value: stats?.completedRequests ?? '—', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' },
        { label: 'Available Food', value: stats?.availableDonations ?? '—', icon: Package, color: 'text-amber-500 bg-amber-50' },
        { label: "Today's Pickups", value: stats?.todayPickups ?? '—', icon: Calendar, color: 'text-purple-500 bg-purple-50' },
      ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

        {/* Cover Banner */}
        <div className="h-36 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
          />
        </div>

        {/* Avatar + Name */}
        <div className="relative px-8 pb-8">
          <div className="absolute -top-16 left-8">
            {display.picture ? (
              <img
                src={display.picture}
                alt={display.name}
                className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-black">
                {display.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="pt-20 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{display.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  display.role === 'NGO' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {display.role === 'NGO' ? 'NGO / Rescue Org' : 'Food Donor'}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                  <ShieldCheck size={14} /> Verified
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                <Calendar size={12} /> Member since {formatDate(display.createdAt)}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {!editing && !changingPassword && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm text-sm"
                  >
                    <Edit3 size={15} /> Edit Profile
                  </button>
                  {!display.picture && (
                    <button
                      onClick={() => setChangingPassword(true)}
                      className="flex items-center gap-2 px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition text-sm"
                    >
                      <Lock size={15} /> Change Password
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 pb-8">
          {statCards.map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border border-gray-100 flex items-center gap-3 ${card.color.split(' ')[1]}`}>
              <div className={`p-2 rounded-lg ${card.color.split(' ')[1]}`}>
                <card.icon size={18} className={card.color.split(' ')[0]} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-black text-gray-900">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="border-t border-gray-100 px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button onClick={() => setEditing(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street / Area</label>
                <input
                  value={form.street}
                  onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                <input
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Hyderabad"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                <input
                  value={form.state}
                  onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  placeholder="Telangana"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 text-sm"
              >
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        {changingPassword && (
          <div className="border-t border-gray-100 px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock size={18} className="text-emerald-500" /> Change Password
              </h3>
              <button onClick={() => setChangingPassword(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="max-w-md space-y-4">
              {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={passwordForm[field]}
                    onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePasswordSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 text-sm"
                >
                  <Lock size={14} /> {saving ? 'Saving...' : 'Update Password'}
                </button>
                <button
                  onClick={() => setChangingPassword(false)}
                  className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Info Grid (view mode) */}
        {!editing && !changingPassword && (
          <div className="border-t border-gray-100 px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Account Details */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <UserCircle size={16} className="text-emerald-500" /> Account Details
                </h3>
                <InfoRow icon={<Mail size={16} />} label="Email" value={display.email} />
                <InfoRow icon={<Phone size={16} />} label="Phone" value={display.phone || 'Not provided'} />
                <InfoRow icon={<Building2 size={16} />} label="Account Type"
                  value={display.role === 'NGO' ? 'NGO / Rescue Organization' : 'Individual Food Donor'} />
                <InfoRow icon={<Calendar size={16} />} label="Last Active"
                  value={formatDate(display.updatedAt || display.createdAt)} />
              </div>

              {/* Location */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500" /> Location Info
                </h3>
                <InfoRow icon={<MapPin size={16} />} label="Street"
                  value={display.address?.street || 'Not provided'} />
                <InfoRow icon={<Building2 size={16} />} label="City / State"
                  value={[display.address?.city, display.address?.state].filter(Boolean).join(', ') || 'Not provided'} />
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-2">
                  <p className="text-sm text-emerald-800 font-medium italic">
                    "Every meal shared is a life improved. Thank you for being part of Smart Food Rescue."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-gray-400 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-800 font-medium text-sm truncate">{value}</p>
    </div>
  </div>
);

export default Profile;
