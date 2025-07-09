# Parking Spot Finder - MERN Stack Application

A modern, responsive parking spot finder application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring Material-UI design and real-time updates.

## Features

### Frontend (React.js)

- **Modern UI/UX**: Material-UI with translucent glassmorphism design
- **Authentication**: JWT-based login/register system
- **Map Integration**: Interactive maps with Leaflet/Google Maps
- **Real-time Updates**: Socket.io for live parking availability
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Search & Filters**: Advanced search with location-based filtering
- **Booking System**: Complete reservation workflow with QR codes
- **User Dashboard**: Manage bookings and profile
- **Admin Panel**: Comprehensive admin controls

### Backend (Node.js + Express.js)

- **RESTful API**: Complete CRUD operations
- **Authentication**: JWT tokens with refresh token support
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for live updates
- **Payment Integration**: Stripe payment processing
- **Email Service**: Nodemailer for notifications
- **Security**: Helmet, rate limiting, CORS protection
- **Geolocation**: Distance-based search and filtering

### Database (MongoDB)

- **Users**: Authentication and profile management
- **Parking Spots**: Location, pricing, and availability
- **Bookings**: Reservation management
- **Payments**: Transaction history and processing

## Project Structure

```
parking-spot-finder/
├── backend/
│   ├── controllers/        # Request handlers
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth and error handling
│   ├── utils/             # Helper functions
│   ├── server.js          # Entry point
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   ├── theme/         # Material-UI theme
│   │   └── App.js         # Root component
│   └── public/            # Static assets
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd parking-spot-finder
   ```

2. **Install Backend Dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Create a `.env` file in the backend directory:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/parking-spot-finder
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

5. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod

   # Or use MongoDB Atlas cloud connection
   ```

6. **Start the Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

7. **Start the Frontend Development Server**

   ```bash
   cd frontend
   npm start
   ```

8. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/me` - Update user profile

### Parking Spots

- `GET /api/spots` - Get all spots
- `GET /api/spots/search` - Search spots
- `GET /api/spots/nearby` - Get nearby spots
- `POST /api/spots` - Create new spot
- `PUT /api/spots/:id` - Update spot
- `DELETE /api/spots/:id` - Delete spot

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Payments

- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/process-payment` - Process payment
- `GET /api/payments/user/payments` - Get user payments

## Technologies Used

### Frontend

- React.js 18
- Material-UI (MUI) 5
- React Router DOM
- React Query
- Socket.io Client
- Axios
- Leaflet Maps
- Framer Motion
- React Hook Form
- React Hot Toast

### Backend

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT Authentication
- Socket.io
- Stripe
- Nodemailer
- Helmet (Security)
- CORS
- Rate Limiting

## Features in Detail

### Authentication System

- JWT-based authentication
- Password hashing with bcrypt
- Email verification
- Password reset functionality
- Role-based access control

### Map Integration

- Interactive maps with Leaflet
- Real-time parking spot markers
- Location-based search
- Distance calculation
- Geolocation API integration

### Booking System

- Real-time availability checking
- QR code generation
- Check-in/check-out functionality
- Booking history
- Rating and reviews

### Payment Integration

- Stripe payment processing
- Secure card payments
- Payment history
- Refund management
- Receipt generation

### Admin Features

- User management
- Spot approval system
- Analytics dashboard
- System monitoring
- Content moderation

## Development Scripts

### Backend

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test          # Run tests
```

### Frontend

```bash
npm start         # Start development server
npm run build     # Build for production
npm test          # Run tests
npm run eject     # Eject from Create React App
```

## Deployment

### Backend Deployment

1. Set up environment variables
2. Configure MongoDB connection
3. Deploy to platforms like Heroku, AWS, or DigitalOcean

### Frontend Deployment

1. Build the React app: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or AWS S3

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@parkingspotfinder.com or join our Discord community.

---

                                                                                               Thank you
