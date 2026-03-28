import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Package, CheckCircle, Clock, Users, MapPin, ExternalLink, ArrowRight, Timer, AlertCircle } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [myDonations, setMyDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [mounted, setMounted] = useState(false);
  const chartContainerRef = React.useRef(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        api.get('/stats'),
        user.role === 'Donor' ? api.get('/donations/my') : api.get('/requests')
      ]);
      setStats(statsRes.data);
      if (user.role === 'Donor') setMyDonations(listRes.data);
      else if (user.role === 'NGO') setMyRequests(listRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      toast.error('Failed to update dashboard');
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

    socket.on('newRequest', (data) => {
      fetchDashboardData();
      toast.success(`New request for ${data.donationTitle || 'your donation'}!`, { icon: '🍱' });
    });

    socket.on('statusUpdate', (data) => {
      fetchDashboardData();
      toast(`Donation status updated to ${data.status}`, { icon: '🔔' });
    });

    return () => {
      socket.off('newRequest');
      socket.off('statusUpdate');
    };
  }, [socket, fetchDashboardData]);

  useEffect(() => {
    let observer;
    if (!mounted && !loading && chartContainerRef.current) {
      observer = new ResizeObserver((entries) => {
        if (entries[0].contentRect.width > 0) {
          setMounted(true);
          setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
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
      toast.success(`Status updated to ${status}`);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
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

  const getExpiryLabel = (expiryTime) => {
    const diff = new Date(expiryTime) - new Date();
    if (diff < 0) return { label: 'Expired', color: 'text-red-500' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { label: `Expires in ${hours}h ${mins}m`, color: 'text-amber-500' };
  };

  const getStatusConfig = (status) => {
    const configs = {
      'Pending': { color: 'bg-gray-100 text-gray-700', step: 1 },
      'Requested': { color: 'bg-blue-100 text-blue-700', step: 2 },
      'Accepted': { color: 'bg-amber-100 text-amber-700', step: 3 },
      'PickedUp': { color: 'bg-purple-100 text-purple-700', label: 'Picked Up', step: 4 },
      'Completed': { color: 'bg-emerald-100 text-emerald-700', step: 5 },
      'Expired': { color: 'bg-red-100 text-red-700', step: 0 },
      'Rejected': { color: 'bg-red-100 text-red-700', step: 0 }
    };
    return configs[status] || { color: 'bg-gray-100 text-gray-700', step: 1, label: status };
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Initializing dashboard...</div>;

  let chartData = [];
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  if (user.role === 'Donor') {
    chartData = [
      { name: 'Total', value: stats.totalDonations },
      { name: 'Active', value: stats.activeDonations },
      { name: 'Requests', value: stats.requestsReceived },
      { name: 'Completed', value: stats.completedDonations }
    ];
  } else if (user.role === 'NGO') {
    chartData = [
      { name: 'Available', value: stats.availableDonations },
      { name: 'Active Req', value: stats.activeRequests },
      { name: 'Completed', value: stats.completedRequests }
    ];
  }

  const ProgressTracker = ({ currentStatus }) => {
    const steps = ['Created', 'Requested', 'Accepted', 'Picked Up', 'Completed'];
    const currentStepIndex = getStatusConfig(currentStatus).step - 1;
    
    if (currentStatus === 'Expired' || currentStatus === 'Rejected') return null;

    return (
      <div className="flex items-center w-full mt-4 gap-1">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx <= currentStepIndex ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {idx < currentStepIndex ? <CheckCircle size={14} /> : idx + 1}
              </div>
              <span className={`text-[10px] sm:text-xs mt-1 font-medium ${idx <= currentStepIndex ? 'text-emerald-700' : 'text-gray-400'}`}>{step}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${idx < currentStepIndex ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">{user.role} Dashboard • Real-time overview</p>
        </div>
        {user.role === 'Donor' && (
          <a href="/add-donation" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition transform hover:-translate-y-1 flex items-center gap-2 w-fit">
            <Package size={20} /> Add New Donation
          </a>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {chartData.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 transform translate-x-4 -translate-y-4`}>
                <Package size={64} />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.name}</p>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-[400px]">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-blue-600" /> Metrics Visualization
          </h2>
          <div ref={chartContainerRef} className="flex-grow w-full relative">
            {mounted && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-center text-gray-400 mt-2 italic">Updates automatically as you take actions</p>
        </div>

        {/* Dynamic List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                {user.role === 'Donor' ? <Package size={20} className="text-emerald-600" /> : <Users size={20} className="text-blue-600" />}
                {user.role === 'Donor' ? 'My Recent Donations' : 'Active Food Rescues'}
              </span>
              <span className="text-xs bg-gray-100 text-gray-500 py-1 px-3 rounded-full font-medium">Tracking {user.role === 'Donor' ? myDonations.length : myRequests.length} items</span>
            </h2>

            <div className="flex-grow space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingList ? (
                <div className="flex items-center justify-center h-48 text-gray-400">Loading tracking data...</div>
              ) : user.role === 'Donor' ? (
                myDonations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No donations found</p>
                        <a href="/add-donation" className="text-emerald-600 text-sm font-bold mt-2 inline-block">Start by adding your first donation</a>
                    </div>
                ) : (
                    myDonations.map((item) => {
                      const expiry = getExpiryLabel(item.expiryTime);
                      const config = getStatusConfig(item.status);
                      return (
                        <div key={item._id} className="p-5 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 transition group">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition">{item.title}</h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Package size={14}/> {item.quantity} {item.unit}</span>
                                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className={`flex items-center gap-1 text-xs font-semibold ${expiry.color}`}>
                                <Timer size={12}/> {expiry.label}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
                                {config.label || item.status}
                              </span>
                            </div>
                          </div>
                          
                          <ProgressTracker currentStatus={item.status} />
                          
                          {/* Donor Actions would typically happen on a specific Request, 
                              but here we show the general status. To accept a request, 
                              a Donor would see a "View Requests" button if status is Requested */}
                          {item.status === 'Requested' && (
                              <div className="mt-4 pt-4 border-top border-gray-50 flex justify-end">
                                  <button onClick={() => toast('Go to individual requests to accept an NGO', { icon: 'ℹ️' })} className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                      Manage Requests <ArrowRight size={14}/>
                                  </button>
                              </div>
                          )}
                        </div>
                      );
                    })
                )
              ) : (
                myRequests.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No active requests</p>
                        <a href="/donations" className="text-blue-600 text-sm font-bold mt-2 inline-block">Browse available food nearby</a>
                    </div>
                ) : (
                    myRequests.map((req) => {
                      const config = getStatusConfig(req.status);
                      const donation = req.donationId;
                      if (!donation) return null;
                      return (
                        <div key={req._id} className="p-5 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition">
                           <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900">{donation.title}</h3>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase font-black">NGO Action</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1 font-medium text-gray-700"><User size={14}/> {donation.donorId?.name || 'Unknown Donor'}</span>
                                <span className="flex items-center gap-1"><Clock size={14}/> Requested {getTimeAgo(req.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin size={12}/> {donation.location?.address}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
                                {config.label || req.status}
                              </span>
                            </div>
                          </div>

                          <ProgressTracker currentStatus={req.status} />

                          {/* NGO Actions */}
                          <div className="mt-6 flex flex-wrap gap-2">
                             {req.status === 'Accepted' && (
                                <button 
                                  onClick={() => updateStatus(req._id, 'PickedUp')}
                                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-2 transition"
                                >
                                  Mark Picked Up <ArrowRight size={14}/>
                                </button>
                             )}
                             {req.status === 'PickedUp' && (
                                <button 
                                  onClick={() => updateStatus(req._id, 'Completed')}
                                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-2 transition"
                                >
                                  Mark Completed <CheckCircle size={14}/>
                                </button>
                             )}
                             <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-2 transition ml-auto">
                                View Details <ExternalLink size={14}/>
                             </button>
                          </div>
                        </div>
                      );
                    })
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
