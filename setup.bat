@echo off
echo 🚗 Setting up Parking Spot Finder Application...
echo =================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if MongoDB is installed
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB is not detected. Please ensure MongoDB is installed and running.
    echo    You can also use MongoDB Atlas for cloud database.
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version

REM Install backend dependencies
echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed successfully!

REM Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
cd ..\frontend
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed successfully!

REM Go back to project root
cd ..

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Configure your environment variables in backend\.env
echo 2. Start MongoDB service
echo 3. Run 'npm run dev' in the backend directory
echo 4. Run 'npm start' in the frontend directory
echo.
echo Happy coding! 🚀
pause
