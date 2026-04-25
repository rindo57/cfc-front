require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AushadhiSaathi API is running' });
});

// Chat with Health Assistant (Gemini-powered)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const systemPrompt = language === 'kn' 
      ? 'ನೀವು ಆರೋಗ್ಯ ಸಹಾಯಕ. ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ವೈದ್ಯಕೀಯ ಸಲಹೆಗಳನ್ನು ನೀಡಿ.'
      : 'You are a helpful health assistant. Provide accurate medical information and guidance.';
    
    const prompt = `${systemPrompt}\n\nUser query: ${message}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      success: true, 
      response: text,
      language: language
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response',
      message: error.message 
    });
  }
});

// Get nearest ASHA workers (with location)
app.get('/api/asha-workers', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    // Mock data - in production, this would query a database
    const ashaWorkers = [
      {
        id: 1,
        name: 'Lakshmi Devi',
        name_kn: 'ಲಕ್ಷ್ಮಿ ದೇವಿ',
        nhmId: '8849-552',
        phone: '+91 9876543210',
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Sector 14, Marathahalli Village',
        address_kn: 'ಸೆಕ್ಟರ್ 14, ಮಾರತಹಳ್ಳಿ ಗ್ರಾಮ',
        distance: 0.8,
        available: true
      },
      {
        id: 2,
        name: 'Geetha Sharma',
        name_kn: 'ಗೀತಾ ಶರ್ಮಾ',
        nhmId: '9021-331',
        phone: '+91 9876543211',
        latitude: 12.9352,
        longitude: 77.6245,
        address: 'Varthur Main Road, Colony Area',
        address_kn: 'ವರ್ತೂರು ಮುಖ್ಯ ರಸ್ತೆ, ಕಾಲೋನಿ ಪ್ರದೇಶ',
        distance: 1.5,
        available: true
      },
      {
        id: 3,
        name: 'Manjula Rao',
        name_kn: 'ಮಂಜುಳಾ ರಾವ್',
        nhmId: '7712-440',
        phone: '+91 9876543212',
        latitude: 12.9591,
        longitude: 77.6974,
        address: 'Brookefield Ext., Block B',
        address_kn: 'ಬ್ರೂಕ್‌ಫೀಲ್ಡ್ ಎಕ್ಸ್‌ಟೆಂಷನ್, ಬ್ಲಾಕ್ ಬಿ',
        distance: 2.2,
        available: false
      }
    ];
    
    // If coordinates provided, calculate distances (Haversine formula)
    if (lat && lng) {
      ashaWorkers.forEach(worker => {
        worker.distance = calculateDistance(lat, lng, worker.latitude, worker.longitude);
      });
      ashaWorkers.sort((a, b) => a.distance - b.distance);
    }
    
    res.json({ 
      success: true, 
      workers: ashaWorkers.filter(w => w.distance <= radius)
    });
  } catch (error) {
    console.error('ASHA Workers API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ASHA workers',
      message: error.message 
    });
  }
});

// Google Maps Geocoding
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      // Return mock data if no API key
      return res.json({
        success: true,
        mock: true,
        results: [{
          geometry: {
            location: {
              lat: 12.9716,
              lng: 77.5946
            }
          },
          formatted_address: 'Bangalore, Karnataka, India'
        }]
      });
    }
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: apiKey
        }
      }
    );
    
    res.json({ success: true, results: response.data.results });
  } catch (error) {
    console.error('Geocode API Error:', error);
    res.status(500).json({ 
      error: 'Failed to geocode address',
      message: error.message 
    });
  }
});

// Google Maps Directions
app.get('/api/directions', async (req, res) => {
  try {
    const { origin, destination, mode = 'walking' } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      // Return mock data
      return res.json({
        success: true,
        mock: true,
        routes: [{
          legs: [{
            distance: { text: '1.2 km', value: 1200 },
            duration: { text: '15 mins', value: 900 },
            steps: [
              { html_instructions: 'Head north on Main Road', distance: { text: '0.5 km' } },
              { html_instructions: 'Turn right onto Hospital Street', distance: { text: '0.7 km' } }
            ]
          }]
        }]
      });
    }
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin,
          destination,
          mode,
          key: apiKey
        }
      }
    );
    
    res.json({ success: true, routes: response.data.routes });
  } catch (error) {
    console.error('Directions API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get directions',
      message: error.message 
    });
  }
});

// Scan prescription (OCR with Gemini Vision)
app.post('/api/scan-prescription', async (req, res) => {
  try {
    const { imageData, language = 'en' } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    
    const prompt = language === 'kn'
      ? 'ಈ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ಔಷಧಿಗಳು, ಡೋಸ್ ಮತ್ತು ಸೂಚನೆಗಳನ್ನು ಹೊರತೆಗೆಯಿರಿ. ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.'
      : 'Analyze this prescription and extract medicine names, dosages, and instructions. Format the response clearly.';
    
    const imagePart = {
      inlineData: {
        data: imageData.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: 'image/jpeg'
      }
    };
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      success: true, 
      extractedText: text,
      language: language
    });
  } catch (error) {
    console.error('Prescription Scan API Error:', error);
    res.status(500).json({ 
      error: 'Failed to scan prescription',
      message: error.message 
    });
  }
});

// Utility: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AushadhiSaathi Backend running on port ${PORT}`);
  console.log(`📍 API Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/chat`);
  console.log(`   GET  /api/asha-workers`);
  console.log(`   GET  /api/geocode`);
  console.log(`   GET  /api/directions`);
  console.log(`   POST /api/scan-prescription`);
});
