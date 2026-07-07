import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/Button';
import { MapPin, Clock, Navigation, Package, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix default marker icon for Leaflet (webpack/vite asset path issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BrowseDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [newBadge, setNewBadge] = useState(false); // shows "New!" indicator when socket fires
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();

  const fetchDonations = async (lat, lng) => {
    try {
      setLoading(true);
      const query = lat && lng ? `?lat=${lat}&lng=${lng}&radius=50` : '';
      const { data } = await api.get(`/donations${query}`);
      setDonations(data);
      setNewBadge(false);
    } catch (err) {
      console.error('[Browse] Failed to fetch donations:', err);
      toast.error('Failed to load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setUserLocation({ lat, lng });
          fetchDonations(lat, lng);
        },
        () => {
          // Silently fall back — no alert needed
          fetchDonations();
        }
      );
    } else {
      fetchDonations();
    }
  }, []);

  // Listen for new donations broadcast from socket so NGOs see live updates
  useEffect(() => {
    if (!socket) return;

    const handleNewDonation = (donation) => {
      // Don't auto-insert without location check — just show a refresh prompt
      setNewBadge(true);
      toast('A new donation is available nearby!', {
        icon: '🍱',
        duration: 5000,
      });
    };

    socket.on('newDonationBroadcast', handleNewDonation);
    return () => {
      socket.off('newDonationBroadcast', handleNewDonation);
    };
  }, [socket]);

  const claimDonation = async (id) => {
    if (!user) {
      toast.error('Please log in to claim donations');
      return;
    }
    setClaimingId(id);
    try {
      await api.post('/requests', {
        donationId: id,
        message: 'We would like to rescue this food donation'
      });
      toast.success('Request sent! Check your dashboard for updates.');
      // Remove from list optimistically — will refresh on socket event too
      setDonations(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request. Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleRefresh = () => {
    fetchDonations(userLocation?.lat, userLocation?.lng);
  };

  const centerPosition = donations.length > 0 && donations[0].location?.coordinates
    ? [donations[0].location.coordinates.lat, donations[0].location.coordinates.lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : [20.5937, 78.9629]; // India center

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">

      {/* Left — Donation List */}
      <div className="md:w-1/3 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100">
        {/* List Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Navigation size={18} className="text-emerald-600" /> Nearby Food
          </h2>
          <div className="flex items-center gap-2">
            {newBadge && (
              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full animate-pulse">
                New!
              </span>
            )}
            <button
              onClick={handleRefresh}
              title="Refresh donations"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded-lg w-full mt-2" />
              </div>
            ))
          ) : donations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Package size={48} className="text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium text-sm">No donations available near you</p>
              <p className="text-gray-400 text-xs mt-1">Check back soon — donations are added regularly</p>
              <button
                onClick={handleRefresh}
                className="mt-4 text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          ) : (
            donations.map((donation) => (
              <div
                key={donation._id}
                className="p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1 flex-1">{donation.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                    donation.foodType === 'Cooked'
                      ? 'bg-orange-100 text-orange-700'
                      : donation.foodType === 'Raw'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {donation.foodType}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{donation.description}</p>

                <div className="flex flex-wrap items-center text-xs text-gray-500 mb-3 gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Package size={12} /> {donation.quantity} {donation.unit}
                  </span>
                  {donation.distance && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Navigation size={12} /> {donation.distance} km
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {donation.location?.address
                      ? `${donation.location.address.slice(0, 28)}${donation.location.address.length > 28 ? '…' : ''}`
                      : 'Location hidden'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {new Date(donation.expiryTime).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                    })}
                  </span>
                </div>

                {user?.role === 'NGO' && (
                  <Button
                    onClick={() => claimDonation(donation._id)}
                    disabled={claimingId === donation._id}
                    className="w-full py-2 text-sm"
                  >
                    {claimingId === donation._id ? 'Sending...' : 'Claim This Food'}
                  </Button>
                )}

                {!user && (
                  <p className="text-center text-xs text-gray-400 mt-1">
                    <a href="/login" className="text-emerald-600 font-bold">Sign in as NGO</a> to claim
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right — Map */}
      <div className="md:w-2/3 h-full rounded-xl overflow-hidden shadow-sm border border-gray-100 relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse z-10 flex items-center justify-center">
            <div className="text-gray-400 flex items-center gap-2 text-sm">
              <RefreshCw size={16} className="animate-spin" /> Loading map...
            </div>
          </div>
        )}
        <MapContainer center={centerPosition} zoom={userLocation ? 12 : 5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {donations.map((donation) => {
            if (!donation.location?.coordinates) return null;
            return (
              <Marker
                key={donation._id}
                position={[donation.location.coordinates.lat, donation.location.coordinates.lng]}
              >
                <Popup className="rounded-lg">
                  <div className="p-1 min-w-[160px]">
                    <h4 className="font-bold text-sm mb-1">{donation.title}</h4>
                    <p className="text-xs text-gray-600 mb-1">
                      {donation.quantity} {donation.unit} &bull; {donation.foodType}
                    </p>
                    {donation.distance && (
                      <p className="text-xs text-emerald-600 font-bold mb-2">{donation.distance} km away</p>
                    )}
                    {user?.role === 'NGO' && (
                      <button
                        onClick={() => claimDonation(donation._id)}
                        disabled={claimingId === donation._id}
                        className="bg-emerald-600 text-white w-full py-1.5 text-xs rounded-lg hover:bg-emerald-700 transition font-bold"
                      >
                        {claimingId === donation._id ? 'Sending...' : 'Claim Food'}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {!loading && donations.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 text-sm text-gray-600 border border-gray-200">
            <AlertCircle size={16} className="text-amber-500" />
            No donations in this area yet
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseDonations;
