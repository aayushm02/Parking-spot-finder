#!/bin/bash

# Parking Spot Finder - Setup Script
# This script sets up the development environment for the MERN stack application

echo "🚗 Setting up Parking Spot Finder Application..."
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not detected. Please ensure MongoDB is installed and running."
    echo "   You can also use MongoDB Atlas for cloud database."
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully!"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully!"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Go back to project root
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables in backend/.env"
echo "2. Start MongoDB service"
echo "3. Run 'npm run dev' in the backend directory"
echo "4. Run 'npm start' in the frontend directory"
echo ""
echo "Happy coding! 🚀"
