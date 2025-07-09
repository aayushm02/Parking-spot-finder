# Parking Spot Finder

A modern MERN stack application for finding and booking parking spots.

## Quick Start

### For Windows Users:

```cmd
setup.bat
```

### For Mac/Linux Users:

```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup:

1. **Install Dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Environment Setup**

   - Copy `backend/.env.example` to `backend/.env`
   - Configure your MongoDB URI, JWT secret, and other settings

3. **Start Development Servers**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Features

- 🔐 JWT Authentication
- 🗺️ Interactive Maps
- 📱 Responsive Design
- 🎨 Material-UI with Glassmorphism
- ⚡ Real-time Updates
- 💳 Payment Integration
- 📊 Admin Dashboard

## Tech Stack

- **Frontend**: React, Material-UI, Leaflet Maps
- **Backend**: Node.js, Express.js, MongoDB
- **Real-time**: Socket.io
- **Payments**: Stripe
- **Maps**: Leaflet/Google Maps

## Project Structure

```
parking-spot-finder/
├── backend/          # Node.js API server
├── frontend/         # React application
├── README.md
├── setup.sh         # Linux/Mac setup script
└── setup.bat        # Windows setup script
```

For detailed documentation, see the full README.md file.
