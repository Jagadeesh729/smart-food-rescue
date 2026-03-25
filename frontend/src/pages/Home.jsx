import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Globe, Utensils } from 'lucide-react';
import Button from '../components/Button';

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-white">
      {/* Hero Section */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 bg-emerald-50 relative overflow-hidden">
        {/* Background purely decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-20 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight z-10 mb-6 relative">
          Rescue Food, <span className="text-emerald-600">Save Lives.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600 z-10 font-medium">
          Join our real-time network connecting food donors with NGOs to eliminate food waste and fight hunger in your community.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 z-10">
          <Link to="/register">
            <Button className="text-lg px-8 py-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all">
              Join as Donor
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" className="text-lg px-8 py-4 bg-white/50 backdrop-blur-sm">
              Join as NGO
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-white py-24 pl-8 pr-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            
            <div className="text-center flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="bg-emerald-100 p-4 rounded-full mb-6 text-emerald-600">
                <Utensils size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Post Excess Food</h3>
              <p className="text-gray-600">Restaurants, events, or individuals list perfectly good excess food with photos and details.</p>
            </div>

            <div className="text-center flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="bg-emerald-100 p-4 rounded-full mb-6 text-emerald-600">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-Time Matching</h3>
              <p className="text-gray-600">Nearby NGOs receive instant notifications about available food based on their location.</p>
            </div>

            <div className="text-center flex flex-col items-center p-6 bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="bg-emerald-100 p-4 rounded-full mb-6 text-emerald-600">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Claim & Deliver</h3>
              <p className="text-gray-600">NGOs claim the food, pick it up, and distribute it to those in need. Simple and efficient.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
