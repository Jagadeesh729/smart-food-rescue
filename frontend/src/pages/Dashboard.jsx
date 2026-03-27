import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Package, CheckCircle, Clock, Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  let chartData = [];
  let pieData = [];
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  if (user.role === 'Donor') {
    chartData = [
      { name: 'Total Donations', value: stats.totalDonations },
      { name: 'Completed', value: stats.completedDonations },
      { name: 'Requests Received', value: stats.requestsReceived }
    ];
  } else if (user.role === 'NGO') {
    chartData = [
      { name: 'Active Requests', value: stats.activeRequests },
      { name: 'Completed Pickups', value: stats.completedRequests },
      { name: 'Available Food', value: stats.availableDonations }
    ];
  } else {
    chartData = [
      { name: 'Users', value: stats.totalUsers },
      { name: 'NGOs', value: stats.totalNGOs },
      { name: 'Donations', value: stats.totalDonations },
      { name: 'Completed', value: stats.completedDonations }
    ];
    pieData = [
      { name: 'Pending', value: stats.totalDonations - stats.completedDonations },
      { name: 'Completed', value: stats.completedDonations }
    ];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.name}. Here is your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {chartData.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center box-border hover:shadow-md transition">
            <div className={`p-4 rounded-full mr-4 ${index === 0 ? 'bg-blue-100 text-blue-600' : index === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {index === 0 ? <Package size={28} /> : index === 1 ? <CheckCircle size={28} /> : <Users size={28} />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Activity Overview</h2>
        <div className="h-80 w-full overflow-hidden" style={{ minHeight: '320px' }}>
          {mounted && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {user.role === 'Donor' && (
        <div className="mt-8 flex justify-end">
          <a href="/add-donation" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition flex items-center gap-2">
            <Package size={20} /> Add New Donation
          </a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
