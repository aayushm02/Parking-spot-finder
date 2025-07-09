# Development Guide - Parking Spot Finder

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Setup Instructions

1. **Clone and Setup:**

   ```bash
   git clone <repository-url>
   cd prohj1

   # For Windows
   setup.bat

   # For Linux/Mac
   ./setup.sh
   ```

2. **Environment Configuration:**

   ```bash
   # Backend - Create .env file
   cd backend
   cp .env.example .env

   # Edit .env with your settings:
   # MONGODB_URI=mongodb://localhost:27017/parking-spot-finder
   # JWT_SECRET=your-jwt-secret-key
   # STRIPE_SECRET_KEY=your-stripe-secret-key
   # EMAIL_SERVICE_API_KEY=your-email-service-key
   ```

3. **Start Development Servers:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

4. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Panel: http://localhost:3000/admin

## 📱 Application Features

### User Roles

- **Regular User**: Search spots, make bookings, manage profile
- **Spot Owner**: List spots, manage bookings, view analytics
- **Admin**: Full system management, user administration

### Core Features

- **Authentication**: JWT-based with role-based access
- **Spot Management**: CRUD operations, search, filtering
- **Booking System**: Real-time availability, QR codes
- **Payment Integration**: Stripe/PayPal support
- **Real-time Updates**: Socket.io for live notifications
- **Admin Dashboard**: User management, analytics, reports

### UI/UX Features

- **Glassmorphism Theme**: Modern translucent design
- **Responsive Design**: Works on all devices
- **Dark/Light Mode**: Theme switching
- **Interactive Maps**: Location visualization
- **Progressive Web App**: Offline support

## 🛠️ Development Workflow

### Backend Development

```bash
cd backend
npm run dev          # Start development server
npm run test         # Run tests
npm run lint         # Check code quality
npm run build        # Build for production
```

### Frontend Development

```bash
cd frontend
npm start            # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run eject        # Eject from Create React App
```

## 📂 Project Structure

```
prohj1/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Authentication, error handling
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   └── theme/       # Material-UI theme
│   └── public/          # Static assets
└── docs/                # Documentation
```

## 🔧 Configuration

### Backend Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/parking-spot-finder

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_SERVICE_API_KEY=your-email-service-key
EMAIL_FROM=noreply@parkingfinder.com

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Frontend Environment Variables

```env
# API
REACT_APP_API_URL=http://localhost:5000

# Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Payment
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Frontend Testing

```bash
cd frontend
npm run test              # Run all tests
npm run test:coverage     # Coverage report
```

## 🚀 Deployment

### Backend Deployment (Heroku)

```bash
# Install Heroku CLI
heroku create parking-spot-finder-api
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

### Frontend Deployment (Netlify)

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

## 📊 Monitoring & Analytics

### Performance Monitoring

- **Backend**: Morgan logging, error tracking
- **Frontend**: Web Vitals, performance metrics
- **Database**: MongoDB Atlas monitoring

### Analytics Integration

- Google Analytics for user behavior
- Custom event tracking for business metrics
- Real-time dashboard for system health

## 🔐 Security

### Authentication & Authorization

- JWT tokens with expiration
- Role-based access control
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints

### Data Protection

- Input validation and sanitization
- HTTPS enforcement
- CORS configuration
- Environment variable security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📞 Support

For issues and questions:

- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🎯 Next Steps

1. **Complete Integration Testing**
2. **Set up CI/CD Pipeline**
3. **Configure Production Environment**
4. **Add Performance Monitoring**
5. **Implement Advanced Features**

---

**Happy Coding! 🚗💨**
