import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { MapPin, Clock, Navigation } from 'lucide-react';

// Fix for default marker icon in leaflet
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
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const getLocationAndDonations = async () => {
      let lat, lng;
      
      // Try to get current position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            setUserLocation({ lat, lng });
            fetchDonations(lat, lng);
          },
          () => fetchDonations() // Fallback if blocked
        );
      } else {
        fetchDonations();
      }
    };

    const fetchDonations = async (lat, lng) => {
      try {
        const query = lat && lng ? `?lat=${lat}&lng=${lng}&radius=50` : '';
        const { data } = await api.get(`/donations${query}`);
        setDonations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getLocationAndDonations();
  }, []);

  const claimDonation = async (id) => {
    setClaimingId(id);
    try {
      const donation = donations.find(d => d._id === id);
      await api.post('/requests', { donationId: id, message: 'We would like to claim this food' });
      alert('Request sent successfully!');
      setDonations(donations.filter(d => d._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim');
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Finding nearby food...</div>;

  const centerPosition = donations.length > 0 && donations[0].location?.coordinates
    ? [donations[0].location.coordinates.lat, donations[0].location.coordinates.lng]
    : [20.5937, 78.9629]; // Default to India center

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">
      
      {/* Left List View */}
      <div className="md:w-1/3 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Navigation size={20} className="text-emerald-600" /> Nearby Donations
        </h2>
        <div className="overflow-y-auto space-y-4 pr-2">
          {donations.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">No donations available near you right now.</p>
          ) : (
            donations.map((donation) => (
              <div key={donation._id} className="p-4 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{donation.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${donation.foodType === 'Cooked' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {donation.foodType}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{donation.description}</p>
                <div className="flex flex-wrap items-center text-xs text-gray-500 mb-4 gap-x-4 gap-y-2">
                  <span className="flex items-center gap-1 shrink-0"><MapPin size={14}/> {donation.location?.address || 'Location Hidden'}</span>
                  {donation.distance && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold shrink-0">
                      <Navigation size={14}/> {donation.distance} km away
                    </span>
                  )}
                  <span className="flex items-center gap-1 shrink-0"><Clock size={14}/> Expires: {new Date(donation.expiryTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
                {user?.role === 'NGO' && (
                  <Button 
                    onClick={() => claimDonation(donation._id)} 
                    disabled={claimingId === donation._id}
                    className="w-full py-2 text-sm"
                  >
                    {claimingId === donation._id ? 'Sending Request...' : 'Claim Request'}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Map View */}
      <div className="md:w-2/3 h-full rounded-xl overflow-hidden shadow-sm border border-gray-100 relative">
        <MapContainer center={centerPosition} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {donations.map((donation) => {
            if (donation.location?.coordinates) {
              return (
                <Marker 
                  key={donation._id} 
                  position={[donation.location.coordinates.lat, donation.location.coordinates.lng]}
                >
                  <Popup className="rounded-lg">
                    <div className="p-1">
                      <h4 className="font-bold mb-1">{donation.title}</h4>
                      <p className="text-xs text-gray-600 mb-2">{donation.quantity} {donation.unit}</p>
                      {user?.role === 'NGO' && (
                        <button 
                          onClick={() => claimDonation(donation._id)}
                          className="bg-emerald-600 text-white w-full py-1 text-xs rounded hover:bg-emerald-700"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
        </MapContainer>
      </div>

    </div>
  );
};

export default BrowseDonations;
