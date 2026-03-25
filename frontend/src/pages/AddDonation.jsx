import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import { UploadCloud, MapPin } from 'lucide-react';

const AddDonation = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', foodType: 'Cooked', quantity: '', unit: 'kg', expiryTime: ''
  });
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location"
          });
        },
        () => {
          alert("Unable to retrieve your location");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleAddressSearch = async () => {
    if (!addressInput) return;
    setSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressInput)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        });
        setError('');
      } else {
        setError('Address not found. Please try a different query or use GPS.');
      }
    } catch (err) {
      setError('Failed to fetch address coordinates.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return setError("Location is required.");
    
    setLoading(true);
    setError('');

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    submitData.append('location', JSON.stringify(location));
    if (image) submitData.append('image', image);

    try {
      await api.post('/donations', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Food Donation</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Listing Title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., 50 boxes of Biryani from Wedding" autoComplete="off" />
          
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
            <textarea 
              id="description"
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              required
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Freshly cooked biryani, needs to be consumed within 4 hours..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="foodType" className="block text-gray-700 text-sm font-bold mb-2">Food Type</label>
              <select id="foodType" name="foodType" value={formData.foodType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="Cooked">Cooked Food</option>
                <option value="Raw">Raw Ingredients / Vegetables</option>
                <option value="Packaged">Packaged Goods</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="expiryTime" className="block text-gray-700 text-sm font-bold mb-2">Expiry Time</label>
              <input id="expiryTime" type="datetime-local" name="expiryTime" value={formData.expiryTime} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
              <div className="flex gap-2">
                <input id="quantity" type="number" name="quantity" value={formData.quantity} onChange={handleChange} required className="w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 50" />
                <label htmlFor="unit" className="sr-only">Quantity Unit</label>
                <select id="unit" name="unit" value={formData.unit} onChange={handleChange} className="w-1/3 px-4 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="kg">kg</option>
                  <option value="plates">plates</option>
                  <option value="boxes">boxes</option>
                  <option value="liters">liters</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="photo-upload" className="block text-gray-700 text-sm font-bold mb-2">Upload Photo</label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="photo-upload" className="flex flex-col flex-1 items-center px-4 py-2 bg-white rounded-lg border border-gray-300 border-dashed cursor-pointer hover:bg-gray-50">
                  <UploadCloud className="w-6 h-6 text-gray-400" />
                  <span className="mt-1 text-xs text-gray-500">{image ? image.name : 'Select a file'}</span>
                  <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label htmlFor="addressSearch" className="block text-gray-700 text-sm font-bold mb-2">Pickup Location</label>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input 
                id="addressSearch"
                type="text" 
                value={addressInput} 
                onChange={(e) => setAddressInput(e.target.value)} 
                placeholder="Type address manually (e.g., 123 Main St, New York)" 
                autoComplete="street-address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button type="button" onClick={handleAddressSearch} disabled={searchingLocation} className="shrink-0 py-2">
                {searchingLocation ? 'Searching...' : 'Search Address'}
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400 justify-center">
              <span className="w-1/4 bg-gray-200 h-px"></span>
              <span>OR</span>
              <span className="w-1/4 bg-gray-200 h-px"></span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <span className={`px-4 py-2 rounded-lg text-sm w-full line-clamp-2 ${location ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                {location ? `✓ ${location.address}` : 'Location not set'}
              </span>
              <Button type="button" onClick={getLocation} variant="outline" className="w-full sm:w-auto shrink-0 py-2">
                <MapPin size={18} /> Use GPS Location
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="py-3 mt-8 w-full">
            {loading ? 'Creating Listing...' : 'Submit Donation'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddDonation;
