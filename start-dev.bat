@echo off
echo Starting PillBridge Development Environment...
echo.

echo Starting MongoDB (make sure MongoDB is installed and running)
echo If you don't have MongoDB installed, please install it from: https://www.mongodb.com/try/download/community
echo.

echo Starting Backend Server...
start "PillBridge Backend" cmd /k "cd backend && npm start"

echo.
timeout /t 3 /nobreak > nul

echo Starting Frontend Development Server...
start "PillBridge Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend will be available at: http://localhost:3000
echo Frontend will be available at: http://localhost:5173
echo.
pause
