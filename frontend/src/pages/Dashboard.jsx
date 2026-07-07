import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import {
  Package, CheckCircle, Clock, Users, MapPin, ArrowRight, Timer,
  AlertCircle, AlertTriangle, TrendingUp, Search, Filter, Calendar, Phone, Mail
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// ProgressTracker moved OUTSIDE Dashboard to avoid re-creation on every render
// ─────────────────────────────────────────────
const STEPS = ['Created', 'Requested', 'Accepted', 'Picked Up', 'Completed'];

const STATUS_STEP_MAP = {
  'Pending': 1,
  'Requested': 2,
  'Accepted': 3,
  'PickedUp': 4,
  'Completed': 5,
  'Expired': 0,
  'Rejected': 0
};

const ProgressTracker = ({ currentStatus }) => {
  if (currentStatus === 'Expired' || currentStatus === 'Rejected') return null;

  const currentStepIndex = (STATUS_STEP_MAP[currentStatus] || 1) - 1;

  return (
    <div className="flex items-center w-full mt-4 gap-1">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              idx < currentStepIndex
                ? 'bg-emerald-600 text-white'
                : idx === currentStepIndex
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {idx < currentStepIndex ? <CheckCircle size={13} /> : idx + 1}
            </div>
            <span className={`text-[9px] sm:text-[10px] mt-1 font-medium text-center leading-tight ${
              idx <= currentStepIndex ? 'text-emerald-700' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-5 ${idx < currentStepIndex ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Status badge config
// ─────────────────────────────────────────────
const getStatusConfig = (status) => {
  const configs = {
    'Pending':   { color: 'bg-gray-100 text-gray-700 border-gray-200',     label: 'Pending' },
    'Requested': { color: 'bg-blue-100 text-blue-700 border-blue-200',      label: 'Requested' },
    'Accepted':  { color: 'bg-amber-100 text-amber-700 border-amber-200',   label: 'Accepted' },
    'PickedUp':  { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Picked Up' },
    'Completed': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Completed' },
    'Expired':   { color: 'bg-red-100 text-red-600 border-red-200',         label: 'Expired' },
    'Rejected':  { color: 'bg-red-100 text-red-600 border-red-200',         label: 'Rejected' },
  };
  return configs[status] || { color: 'bg-gray-100 text-gray-700 border-gray-200', label: status };
};

const getExpiryLabel = (expiryTime) => {
  const diff = new Date(expiryTime) - new Date();
  if (diff < 0) return { label: 'Expired', color: 'text-red-500' };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours < 2) return { label: `Expires in ${hours}h ${mins}m`, color: 'text-red-500' };
  if (hours < 6) return { label: `Expires in ${hours}h ${mins}m`, color: 'text-amber-500' };
  return { label: `Expires in ${hours}h ${mins}m`, color: 'text-emerald-600' };
};

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
};

// ─────────────────────────────────────────────
// Stat Card component
// ─────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 transform translate-x-4 -translate-y-4 ${color}`}>
      <Icon size={64} />
    </div>
    <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{value ?? '—'}</h3>
  </div>
);

// ─────────────────────────────────────────────
// Dashboard Component
// ─────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [myDonations, setMyDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const chartContainerRef = React.useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {}
      );
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const promises = [api.get('/stats'), api.get('/requests')];
      if (user.role === 'Donor') {
        promises.push(api.get('/donations/my'));
      }

      const results = await Promise.all(promises);
      const [statsRes, requestsRes] = results;

      setStats(statsRes.data);

      if (user.role === 'Donor') {
        const donationsRes = results[2];
        setMyDonations(donationsRes.data);
        setMyRequests(requestsRes.data); // Requests ON the donor's donations
      } else if (user.role === 'NGO') {
        setMyRequests(requestsRes.data); // Requests MADE BY this NGO
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setLoadingList(false);
    }
  }, [user.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data) => {
      fetchDashboardData();
      toast.success(`New request from ${data.ngoName || 'an NGO'} for "${data.donationTitle || 'your donation'}"!`, { icon: '🍱' });
    };

    const handleStatusUpdate = (data) => {
      fetchDashboardData();
      const config = getStatusConfig(data.status);
      toast(`"${data.donationTitle || 'Donation'}" status → ${config.label}`, { icon: '🔔' });
    };

    socket.on('newRequest', handleNewRequest);
    socket.on('statusUpdate', handleStatusUpdate);

    return () => {
      socket.off('newRequest', handleNewRequest);
      socket.off('statusUpdate', handleStatusUpdate);
    };
  }, [socket, fetchDashboardData]);

  // ResizeObserver for chart mount
  useEffect(() => {
    let observer;
    if (!mounted && !loading && chartContainerRef.current) {
      observer = new ResizeObserver((entries) => {
        if (entries[0].contentRect.width > 0) {
          setMounted(true);
          observer.disconnect();
        }
      });
      observer.observe(chartContainerRef.current);
    }
    return () => observer?.disconnect();
  }, [loading, mounted]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/requests/${id}/status`, { status });
      toast.success(`Status updated to "${getStatusConfig(status).label}"`);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      toast.success('Request cancelled');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cancellation failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // ── Chart data ──
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  let chartData = [];
  let statCards = [];

  if (user.role === 'Donor' && stats) {
    chartData = [
      { name: 'Total',     value: stats.totalDonations || 0 },
      { name: 'Active',    value: stats.activeDonations || 0 },
      { name: 'Requests',  value: stats.requestsReceived || 0 },
      { name: 'Completed', value: stats.completedDonations || 0 },
      { name: 'Expired',   value: stats.expiredDonations || 0 },
    ];
    statCards = [
      { label: 'Total Donations',  value: stats.totalDonations,     icon: Package,       color: 'text-blue-500' },
      { label: 'Active',           value: stats.activeDonations,     icon: TrendingUp,    color: 'text-emerald-500' },
      { label: 'Requests Received', value: stats.requestsReceived,  icon: Users,         color: 'text-amber-500' },
      { label: 'Completed',        value: stats.completedDonations,  icon: CheckCircle,   color: 'text-purple-500' },
      { label: 'Expired',          value: stats.expiredDonations,    icon: AlertTriangle, color: 'text-red-500' },
    ];
  } else if (user.role === 'NGO' && stats) {
    chartData = [
      { name: 'Available',   value: stats.availableDonations || 0 },
      { name: 'Active Req',  value: stats.activeRequests || 0 },
      { name: 'Completed',   value: stats.completedRequests || 0 },
      { name: "Today's",     value: stats.todayPickups || 0 },
    ];
    statCards = [
      { label: 'Available Food',    value: stats.availableDonations, icon: Package,     color: 'text-blue-500' },
      { label: 'Active Requests',   value: stats.activeRequests,     icon: TrendingUp,  color: 'text-emerald-500' },
      { label: 'Completed Pickups', value: stats.completedRequests,  icon: CheckCircle, color: 'text-purple-500' },
      { label: "Today's Pickups",   value: stats.todayPickups,       icon: Calendar,    color: 'text-amber-500' },
    ];
  }

  // ── Filtered lists ──
  const filterStatuses = user.role === 'Donor'
    ? ['All', 'Pending', 'Requested', 'Accepted', 'PickedUp', 'Completed', 'Expired']
    : ['All', 'Pending', 'Accepted', 'PickedUp', 'Completed', 'Rejected'];

  const filteredDonations = myDonations.filter(item => {
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredRequests = myRequests.filter(req => {
    const matchStatus = statusFilter === 'All' || req.status === statusFilter;
    const title = user.role === 'NGO' ? req.donationId?.title : req.ngoId?.name;
    const matchSearch = (title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{user.role} Dashboard &bull; Real-time overview</p>
        </div>
        {user.role === 'Donor' && (
          <a
            href="/add-donation"
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition transform hover:-translate-y-0.5 flex items-center gap-2 w-fit"
          >
            <Package size={18} /> Add New Donation
          </a>
        )}
        {user.role === 'NGO' && (
          <a
            href="/donations"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition transform hover:-translate-y-0.5 flex items-center gap-2 w-fit"
          >
            <MapPin size={18} /> Browse Nearby Food
          </a>
        )}
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 sm:gap-6 ${user.role === 'Donor' ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Chart & Recent Activity */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[360px]">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Metrics Overview
            </h2>
            <div ref={chartContainerRef} className="flex-grow w-full">
              {mounted && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-xs text-center text-gray-400 mt-2 italic">Updates in real-time</p>
          </div>

          {/* Recent Activity */}
          <RecentActivityFeed role={user.role} donations={myDonations} requests={myRequests} />
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[360px] flex flex-col">

            {/* List Header + Search + Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {user.role === 'Donor'
                  ? <><Package size={18} className="text-emerald-500" /> My Donations</>
                  : <><Users size={18} className="text-blue-500" /> Active Food Rescues</>
                }
                <span className="text-xs bg-gray-100 text-gray-500 py-1 px-2 rounded-full font-medium">
                  {user.role === 'Donor' ? filteredDonations.length : filteredRequests.length}
                </span>
              </h2>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={user.role === 'Donor' ? 'Search donations...' : 'Search food or donor...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="relative">
                <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none bg-white"
                >
                  {filterStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-grow space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {loadingList ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : user.role === 'Donor' ? (
                <DonorList
                  donations={filteredDonations}
                  requests={myRequests}
                  onUpdateStatus={updateStatus}
                />
              ) : (
                <NGOList
                  requests={filteredRequests}
                  onUpdateStatus={updateStatus}
                  onCancel={cancelRequest}
                  userLocation={userLocation}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Donor List
// ─────────────────────────────────────────────
const DonorList = ({ donations, requests, onUpdateStatus }) => {
  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-500 font-medium">No donations found</p>
        <a href="/add-donation" className="mt-2 text-sm text-emerald-600 font-bold hover:underline">
          Add your first donation →
        </a>
      </div>
    );
  }

  return (
    <>
      {donations.map(item => {
        const expiry = getExpiryLabel(item.expiryTime);
        const config = getStatusConfig(item.status);
        // FIX: compare using .toString() to avoid reference mismatch
        const incomingRequests = requests.filter(req =>
          req.donationId?._id?.toString() === item._id?.toString()
        );
        const pendingRequests = incomingRequests.filter(r => r.status === 'Pending');
        // Show accepted/pickedup request so donor knows who has it
        const acceptedRequest = incomingRequests.find(r => ['Accepted', 'PickedUp'].includes(r.status));

        return (
          <div key={item._id} className="p-5 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
                    {item.foodType}
                  </span>
                </div>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Package size={13} /> {item.quantity} {item.unit}
                  </span>
                  <span className="flex items-center gap-1" title={`Created at ${new Date(item.createdAt).toLocaleString()}`}>
                    <Clock size={13} /> Created {getTimeAgo(item.createdAt)}
                  </span>
                  <span className="flex items-center gap-1" title={`Updated at ${new Date(item.updatedAt).toLocaleString()}`}>
                    <Calendar size={13} /> Updated {getTimeAgo(item.updatedAt)}
                  </span>
                  {item.location?.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {item.location.address.slice(0, 30)}{item.location.address.length > 30 ? '…' : ''}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${expiry.color}`}>
                  <Timer size={12} /> {expiry.label}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${config.color} shrink-0`}>
                {config.label}
              </span>
            </div>

            <ProgressTracker currentStatus={item.status} />

            {/* Incoming pending requests */}
            {pendingRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Users size={12} /> Incoming Requests ({pendingRequests.length})
                </p>
                {pendingRequests.map(req => (
                  <div key={req._id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{req.ngoId?.name}</span>
                      <span className="text-[10px] text-gray-500">{req.ngoId?.phone || req.ngoId?.email || 'No contact'}</span>
                      {req.message && (
                        <span className="text-[10px] text-gray-500 italic mt-0.5">"{req.message}"</span>
                      )}
                    </div>
                    <button
                      onClick={() => onUpdateStatus(req._id, 'Accepted')}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition shrink-0"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Accepted NGO info */}
            {acceptedRequest && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                  <CheckCircle size={12} className="text-emerald-500" /> Assigned NGO
                </p>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <p className="font-bold text-sm text-gray-800">{acceptedRequest.ngoId?.name}</p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {acceptedRequest.ngoId?.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone size={11} /> {acceptedRequest.ngoId.phone}
                      </span>
                    )}
                    {acceptedRequest.ngoId?.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Mail size={11} /> {acceptedRequest.ngoId.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const NGOList = ({ requests, onUpdateStatus, onCancel, userLocation }) => {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-500 font-medium">No active requests</p>
        <a href="/donations" className="mt-2 text-sm text-blue-600 font-bold hover:underline">
          Browse available food nearby →
        </a>
      </div>
    );
  }

  return (
    <>
      {requests.map(req => {
        const config = getStatusConfig(req.status);
        const donation = req.donationId;
        if (!donation) return null;

        // Hide expired requests automatically for NGO list
        const isExpired = donation.status === 'Expired' || new Date(donation.expiryTime) < new Date();
        if (isExpired && req.status !== 'Completed') {
          return null;
        }

        const expiry = donation.expiryTime ? getExpiryLabel(donation.expiryTime) : null;
        const donor = donation.donorId;

        // Calculate distance on client side if geolocation is available
        let calculatedDistance = null;
        if (userLocation && donation.location?.coordinates) {
          calculatedDistance = calculateDistance(
            userLocation.lat, userLocation.lng,
            donation.location.coordinates.lat, donation.location.coordinates.lng
          );
        }

        return (
          <div key={req._id} className="p-5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 truncate">{donation.title}</h3>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
                    {donation.foodType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Package size={13} /> {donation.quantity} {donation.unit}
                  </span>
                  {calculatedDistance && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold" title="Distance to donor">
                      <Navigation size={13} className="rotate-45" /> {calculatedDistance} km
                    </span>
                  )}
                  {donor?.name && (
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Users size={13} /> {donor.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> Requested {getTimeAgo(req.createdAt)}
                  </span>
                </div>
                {donation.location?.address && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={11} /> {donation.location.address}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs pt-1">
                  {expiry && (
                    <div className={`flex items-center gap-1 font-semibold ${expiry.color}`}>
                      <Timer size={11} /> {expiry.label}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-amber-600 font-semibold">
                    <Calendar size={11} /> Pickup Deadline: {new Date(donation.expiryTime).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                    })}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${config.color} shrink-0`}>
                {config.label}
              </span>
            </div>

            <ProgressTracker currentStatus={req.status} />

            {/* Donor contact info when accepted, picked up, or completed */}
            {['Accepted', 'PickedUp', 'Completed'].includes(req.status) && donor && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                  <Users size={12} className="text-blue-500" /> Donor Contact
                </p>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-1">
                  {donor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={12} className="text-blue-500" /> {donor.phone}
                    </div>
                  )}
                  {donor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail size={12} className="text-blue-500" /> {donor.email}
                    </div>
                  )}
                  {donor.address?.street && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin size={12} className="text-blue-500" />
                      {[donor.address.street, donor.address.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NGO Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {req.status === 'Pending' && (
                <button
                  onClick={() => onCancel(req._id)}
                  className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                >
                  Cancel Request
                </button>
              )}
              {req.status === 'Accepted' && (
                <button
                  onClick={() => onUpdateStatus(req._id, 'PickedUp')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-2 transition"
                >
                  Mark Picked Up <ArrowRight size={13} />
                </button>
              )}
              {req.status === 'PickedUp' && (
                <button
                  onClick={() => onUpdateStatus(req._id, 'Completed')}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2 transition"
                >
                  Mark Completed <CheckCircle size={13} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────
// Recent Activity helper and component
// ─────────────────────────────────────────────
const getRecentActivity = (role, donations, requests) => {
  const activities = [];

  if (role === 'Donor') {
    donations.forEach(donation => {
      activities.push({
        id: `don-create-${donation._id}`,
        timestamp: new Date(donation.createdAt),
        title: 'Donation Created',
        description: `Listed food donation "${donation.title}"`,
        type: 'create'
      });

      if (donation.status === 'Expired') {
        activities.push({
          id: `don-expire-${donation._id}`,
          timestamp: new Date(donation.updatedAt),
          title: 'Donation Expired',
          description: `Donation "${donation.title}" expired`,
          type: 'expire'
        });
      }
    });

    requests.forEach(req => {
      const donTitle = req.donationId?.title || 'Unknown Donation';
      const ngoName = req.ngoId?.name || 'an NGO';

      activities.push({
        id: `req-create-${req._id}`,
        timestamp: new Date(req.createdAt),
        title: 'NGO Requested Donation',
        description: `"${ngoName}" requested "${donTitle}"`,
        type: 'request'
      });

      if (req.status === 'Accepted') {
        activities.push({
          id: `req-accept-${req._id}`,
          timestamp: new Date(req.updatedAt),
          title: 'Request Accepted',
          description: `Accepted request from "${ngoName}" for "${donTitle}"`,
          type: 'accept'
        });
      } else if (req.status === 'PickedUp') {
        activities.push({
          id: `req-pickup-${req._id}`,
          timestamp: new Date(req.updatedAt),
          title: 'Food Picked Up',
          description: `"${ngoName}" picked up "${donTitle}"`,
          type: 'pickup'
        });
      } else if (req.status === 'Completed') {
        activities.push({
          id: `req-complete-${req._id}`,
          timestamp: new Date(req.updatedAt),
          title: 'Donation Completed',
          description: `"${ngoName}" completed rescue of "${donTitle}"`,
          type: 'complete'
        });
      }
    });
  } else if (role === 'NGO') {
    requests.forEach(req => {
      const donation = req.donationId;
      if (!donation) return;

      const donTitle = donation.title || 'Unknown Donation';
      const donorName = donation.donorId?.name || 'a Donor';

      activities.push({
        id: `req-sent-${req._id}`,
        timestamp: new Date(req.createdAt),
        title: 'Donation Requested',
        description: `Requested food donation "${donTitle}"`,
        type: 'request'
      });

      if (req.status === 'Accepted') {
        activities.push({
          id: `req-accept-${req._id}`,
          timestamp: new Date(req.updatedAt),
          title: 'Request Accepted',
          description: `Request for "${donTitle}" accepted by "${donorName}"`,
          type: 'accept'
        });
      } else if (req.status === 'PickedUp') {
        activities.push({
          id: `req-pickup-${req._id}`,
          timestamp: new Date(req.updatedAt),
          title: 'Food Picked Up',
          description: `Marked "${donTitle}" as Picked Up`,
          type: 'pickup'
        });
      } else if (req.status === 'Completed') {
        activities.push({
          id: `req-complete-${req._id}`,
          timestamp: new Date(req.updatedAt),
          title: 'Donation Completed',
          description: `Completed pickup & rescue of "${donTitle}"`,
          type: 'complete'
        });
      } else if (req.status === 'Rejected') {
        activities.push({
          id: `req-reject-${req._id}`,
          timestamp: new Date(req.updatedAt),
          title: 'Request Rejected',
          description: `Request for "${donTitle}" was rejected`,
          type: 'reject'
        });
      }
    });
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
};

const RecentActivityFeed = ({ role, donations, requests }) => {
  const activities = getRecentActivity(role, donations, requests).slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Clock size={18} className="text-emerald-600" /> Recent Activity
      </h2>
      
      {activities.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
          <Clock size={36} className="text-gray-200 mb-2" />
          <p className="text-gray-400 text-xs font-semibold">No recent activity logs</p>
        </div>
      ) : (
        <div className="flex-grow relative border-l-2 border-emerald-50 ml-3 space-y-5 pb-2">
          {activities.map((act) => {
            let IconComponent = Clock;
            let iconColor = 'text-gray-500 bg-gray-50';
            
            if (act.type === 'create') {
              IconComponent = Package;
              iconColor = 'text-blue-600 bg-blue-50';
            } else if (act.type === 'request') {
              IconComponent = Users;
              iconColor = 'text-amber-600 bg-amber-50';
            } else if (act.type === 'accept') {
              IconComponent = CheckCircle;
              iconColor = 'text-emerald-600 bg-emerald-50';
            } else if (act.type === 'pickup') {
              IconComponent = ArrowRight;
              iconColor = 'text-purple-600 bg-purple-50';
            } else if (act.type === 'complete') {
              IconComponent = CheckCircle;
              iconColor = 'text-teal-600 bg-teal-50';
            } else if (act.type === 'expire') {
              IconComponent = AlertTriangle;
              iconColor = 'text-red-500 bg-red-50';
            } else if (act.type === 'reject') {
              IconComponent = AlertCircle;
              iconColor = 'text-red-500 bg-red-50';
            }

            return (
              <div key={act.id} className="relative pl-7 group">
                <div className={`absolute -left-[13px] top-0.5 rounded-full p-1 border border-white shadow-sm transition-transform group-hover:scale-115 ${iconColor}`}>
                  <IconComponent size={10} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">{act.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{act.description}</p>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                    {getTimeAgo(act.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
