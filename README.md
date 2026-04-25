# AushadhiSaathi Backend

Backend server for the AushadhiSaathi mobile app with Gemini AI, Google Maps integration, and Kannada/English language support.

## Features

- 🤖 **Gemini AI Health Assistant** - Chat-based health queries in English/Kannada
- 📍 **Google Maps Integration** - Location services, geocoding, and directions
- 🌐 **Bilingual Support** - Full Kannada and English language toggle
- 💊 **Prescription Scanner** - OCR-powered prescription analysis
- 👩‍⚕️ **ASHA Worker Locator** - Find nearest community health workers

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# Google Gemini API Key
# Get from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API Key (Optional - mock data used if not provided)
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Start the Server

```bash
node server.js
```

Or use nodemon for development:

```bash
npm install -g nodemon
nodemon server.js
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Chat with Health Assistant
```
POST /api/chat
Content-Type: application/json

{
  "message": "What are the side effects of Metformin?",
  "language": "en"  // or "kn" for Kannada
}
```

### Get Nearest ASHA Workers
```
GET /api/asha-workers?lat=12.9716&lng=77.5946&radius=5
```

### Geocode Address
```
GET /api/geocode?address=Marathahalli,Bangalore
```

### Get Directions
```
GET /api/directions?origin=12.9716,77.5946&destination=12.9352,77.6245&mode=walking
```

### Scan Prescription
```
POST /api/scan-prescription
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "language": "en"  // or "kn" for Kannada
}
```

## Frontend Integration

Update your frontend files to use the backend API:

### Example: Chat Integration

```javascript
async function sendMessage(message, language = 'en') {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, language })
  });
  
  const data = await response.json();
  return data.response;
}
```

### Example: Language Toggle

```javascript
let currentLanguage = 'en';

function setLanguage(lang) {
  currentLanguage = lang;
  document.body.setAttribute('data-lang', lang);
  
  // Update UI buttons
  document.getElementById('btn-en').className = 
    lang === 'en' ? 'active' : '';
  document.getElementById('btn-kn').className = 
    lang === 'kn' ? 'active' : '';
}
```

## Project Structure

```
/workspace
├── server.js              # Express backend server
├── .env                   # Environment variables
├── package.json           # Node.js dependencies
├── home.html             # Main landing page
├── health_assist_chat.html    # Chat interface
├── nearest_ash_worker.html    # ASHA worker locator
├── scan_prescription.html     # Prescription scanner
└── README.md             # This file
```

## API Keys Required

1. **Google Gemini API** - For AI chat and prescription scanning
   - Visit: https://makersuite.google.com/app/apikey
   - Free tier available

2. **Google Maps API** (Optional) - For maps and location services
   - Visit: https://console.cloud.google.com/apis/credentials
   - Enable: Geocoding API, Directions API
   - Free tier: $200 monthly credit

## Security Notes

- Never commit `.env` file to version control
- Use HTTPS in production
- Implement rate limiting for public APIs
- Add authentication for sensitive endpoints

## License

ISC
