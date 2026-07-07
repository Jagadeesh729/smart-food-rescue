const Donation = require('../models/Donation');
const User = require('../models/User');
const { calculateDistance } = require('../utils/geoHelper');
const { broadcastNewDonation } = require('../sockets/socketHandler');

// @desc    Create a new donation
// @route   POST /api/donations
// @access  Private (Donor only)
const createDonation = async (req, res) => {
  try {
    const { title, description, foodType, quantity, unit, expiryTime, location } = req.body;
    let imageUrl = '';

    if (req.file) {
      if (req.file.path && req.file.path.startsWith('http')) {
        imageUrl = req.file.path;
      } else if (req.file.filename) {
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      } else {
        imageUrl = req.file.path;
      }
    }

    let parsedLocation;
    try {
      parsedLocation = JSON.parse(location);
    } catch {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    if (!parsedLocation.lat || !parsedLocation.lng) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      title,
      description,
      foodType,
      quantity,
      unit,
      image: imageUrl,
      expiryTime,
      location: {
        address: parsedLocation.address,
        type: 'Point',
        geoCoords: [parsedLocation.lng, parsedLocation.lat],
        coordinates: {
          lat: parsedLocation.lat,
          lng: parsedLocation.lng
        }
      }
    });

    // Broadcast new donation to all connected clients (for live NGO browsing)
    broadcastNewDonation(donation);

    // Notify nearby NGOs via email (non-blocking, fire-and-forget)
    setImmediate(async () => {
      try {
        const { sendEmail } = require('../services/emailService');
        const NGOs = await User.find({ role: 'NGO' });

        const nearbyNGOs = NGOs.filter(ngo => {
          if (!ngo.address?.coordinates?.lat) return false;
          const dist = calculateDistance(
            parsedLocation.lat, parsedLocation.lng,
            ngo.address.coordinates.lat, ngo.address.coordinates.lng
          );
          return dist <= 5; // 5 km radius
        });

        const emails = nearbyNGOs.map(n => n.email);
        if (emails.length > 0) {
          await sendEmail(
            emails.join(','),
            `New Food Rescue Alert: ${title}`,
            `<h3>Urgent: New food donation available nearby!</h3>
             <p><strong>${title}</strong></p>
             <p>Type: ${foodType} | Quantity: ${quantity} ${unit}</p>
             <p>Location: ${parsedLocation.address || 'Nearby'}</p>
             <p>Please log in to your dashboard to claim it before it expires.</p>`
          );
        }
      } catch (err) {
        console.error('[Donations] Error sending NGO notifications:', err.message);
      }
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active donations (Pending or Requested)
// @route   GET /api/donations
// @access  Public
const getDonations = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query; // radius in km

    // Browse should only show food that hasn't been claimed/completed yet
    let query = {
      status: { $in: ['Pending', 'Requested'] },
      expiryTime: { $gt: new Date() }
    };

    if (lat && lng && radius) {
      query['location.geoCoords'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      };
    }

    let donations = await Donation.find(query).populate('donorId', 'name email phone');

    if (lat && lng) {
      donations = donations.map(donation => {
        const d = donation.toObject();
        if (d.location?.coordinates?.lat) {
          d.distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            d.location.coordinates.lat, d.location.coordinates.lng
          ).toFixed(1);
        }
        return d;
      });
    }

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Public
const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donorId', 'name email address phone');
    if (donation) {
      res.json(donation);
    } else {
      res.status(404).json({ message: 'Donation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donations by current donor
// @route   GET /api/donations/my
// @access  Private (Donor only)
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  getMyDonations
};
