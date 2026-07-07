import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Globe, Utensils, Users, Package, CheckCircle, ArrowRight, Leaf, Clock } from 'lucide-react';
import Button from '../components/Button';
import api from '../services/api';

// Animated counter hook
const useCountUp = (target, duration = 1500, started = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || !target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, started]);
  return count;
};

const StatBadge = ({ label, value, icon: Icon, color, started }) => {
  const count = useCountUp(value, 1200, started);
  return (
    <div className="text-center p-6">
      <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={28} />
      </div>
      <div className="text-4xl font-black text-gray-900 mb-1">
        {value ? count.toLocaleString() : '—'}
        {value > 0 && <span className="text-emerald-500">+</span>}
      </div>
      <div className="text-sm font-semibold text-gray-500">{label}</div>
    </div>
  );
};

const Home = () => {
  const [stats, setStats] = useState(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    api.get('/stats/public')
      .then(res => setStats(res.data))
      .catch(() => {}); // Non-critical, page works without stats
  }, []);

  // Start counters when stats section comes into view
  useEffect(() => {
    if (!statsRef.current || !stats) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [stats]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-white">

      {/* ── Hero Section ── */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 bg-gradient-to-b from-emerald-50 to-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-10 left-20 w-52 h-52 bg-pink-100 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-4000" />

        <div className="z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <Leaf size={14} /> Real-time Food Rescue Network
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            Rescue Food,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              Save Lives.
            </span>
          </h1>
          <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
            Join our real-time network connecting food donors with NGOs to eliminate food waste and fight hunger in your community.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="text-lg px-8 py-4 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 hover:-translate-y-1 transform transition-all duration-200">
                Start Donating Food
              </Button>
            </Link>
            <Link to="/donations">
              <Button variant="outline" className="text-lg px-8 py-4 hover:-translate-y-1 transform transition-all duration-200 bg-white">
                Browse Available Food <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live Stats Section ── */}
      <div ref={statsRef} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-emerald-100 font-semibold text-sm uppercase tracking-widest mb-2">
            Our Platform Impact
          </p>
          <h2 className="text-3xl font-bold text-center text-white mb-10">
            Real People, Real Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white/10 backdrop-blur rounded-2xl p-6">
            <StatBadge label="Donations Listed" value={stats?.totalDonations} icon={Package} color="bg-white/20 text-white" started={statsStarted} />
            <StatBadge label="Successful Rescues" value={stats?.completedDonations} icon={CheckCircle} color="bg-white/20 text-white" started={statsStarted} />
            <StatBadge label="Meals Served" value={stats?.estimatedMeals} icon={Heart} color="bg-white/20 text-white" started={statsStarted} />
            <StatBadge label="Active NGOs" value={stats?.totalNGOs} icon={Users} color="bg-white/20 text-white" started={statsStarted} />
            <StatBadge label="Food Donors" value={stats?.totalDonors} icon={Globe} color="bg-white/20 text-white" started={statsStarted} />
            <StatBadge label="Live Now" value={stats?.activeDonations} icon={Clock} color="bg-white/20 text-white" started={statsStarted} />
          </div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <div className="w-full bg-white py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-emerald-600 font-bold text-sm uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Utensils size={32} />,
                step: '01',
                title: 'Post Excess Food',
                desc: 'Restaurants, events, or individuals list perfectly good excess food with photos, quantity, and pickup time.',
                color: 'bg-emerald-50 text-emerald-600'
              },
              {
                icon: <Globe size={32} />,
                step: '02',
                title: 'Real-Time Matching',
                desc: 'Nearby NGOs receive instant notifications about available food based on proximity and food type.',
                color: 'bg-blue-50 text-blue-600'
              },
              {
                icon: <Heart size={32} />,
                step: '03',
                title: 'Claim & Deliver',
                desc: 'NGOs claim the food, coordinate pickup, and distribute it to those in need — efficiently and transparently.',
                color: 'bg-pink-50 text-pink-600'
              }
            ].map((item, i) => (
              <div key={i} className="relative text-center flex flex-col items-center p-8 bg-gray-50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group border border-transparent hover:border-emerald-100">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow">
                  {item.step}
                </div>
                <div className={`${item.color} p-5 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA Section ── */}
      <div className="w-full bg-emerald-50 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to make a difference?</h2>
          <p className="text-gray-600 mb-8 text-lg">Join hundreds of donors and NGOs already working together to fight food waste and hunger.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="text-base px-8 py-3 shadow-lg hover:-translate-y-0.5 transition-transform">
                Join as Donor
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="text-base px-8 py-3 bg-white hover:-translate-y-0.5 transition-transform">
                Register as NGO
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
