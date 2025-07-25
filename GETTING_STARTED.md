# 🚀 PillBridge - Getting Started with MongoDB

This guide will help you set up and run PillBridge with MongoDB as the database.

## ✅ Quick Setup Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] MongoDB installed (local) OR MongoDB Atlas account (cloud)
- [ ] Git (optional)

### Setup Steps

#### 1. Install MongoDB (Choose one option)

**Option A: Local MongoDB**
- Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- Install and start the MongoDB service
- Default connection: `mongodb://localhost:27017`

**Option B: MongoDB Atlas (Cloud)**
- Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Create a free cluster
- Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/`)

#### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3. Configure Environment Variables

**Frontend (`.env` in root directory):**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=PillBridge
VITE_APP_VERSION=1.0.0
```

**Backend (`backend/.env`):**
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=pillbridge
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

#### 4. Initialize Database
```bash
node mongo-setup.js
```

#### 5. Start the Application

**Quick Start (Windows):**
```bash
# Double-click the file
start-dev.bat
```

**Manual Start:**
```bash
# Terminal 1 - Start Backend
cd backend
npm start

# Terminal 2 - Start Frontend (open new terminal)
npm run dev
```

## 🌐 Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/

## 📊 Database Collections

The system creates these MongoDB collections:

1. **users** - User accounts (patients & caregivers)
2. **medications** - Medication information and schedules
3. **reminders** - Medication reminders and acknowledgments
4. **mood_entries** - Daily mood tracking data
5. **game_scores** - Cognitive game performance

## 🎯 First Steps After Setup

1. **Register a Caregiver Account**
   - Visit http://localhost:5173
   - Click "Sign Up"
   - Choose "Caregiver" role
   - Note your unique caregiver code

2. **Register a Patient Account**
   - Use the caregiver code from step 1
   - Choose "Patient" role
   - Complete registration

3. **Test the System**
   - Add a medication as a patient
   - Set up reminders
   - Track mood
   - Try the pill recognition game

## 🔧 Troubleshooting

### Common Issues

**"Database setup failed"**
- Ensure MongoDB is running
- Check connection string in `.env` files
- Verify network connectivity (for Atlas)

**"Port already in use"**
- Change PORT in `backend/.env` to another number (e.g., 3001)
- Update VITE_API_BASE_URL in main `.env` file accordingly

**"npm install fails"**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall

**Frontend can't connect to backend**
- Verify backend is running on port 3000
- Check VITE_API_BASE_URL in `.env`
- Ensure no CORS issues in browser console

### MongoDB Connection Issues

**Local MongoDB not starting:**
```bash
# Windows
net start mongodb

# macOS/Linux
sudo systemctl start mongod
```

**MongoDB Atlas connection:**
- Ensure IP whitelist includes your current IP
- Check username/password in connection string
- Verify cluster is running

## 📝 Development Notes

### Project Structure
```
project/
├── src/                    # Frontend React code
├── backend/               # Express.js API server
├── .env                   # Frontend environment
├── backend/.env          # Backend environment
├── mongo-setup.js        # Database initialization
└── start-dev.bat         # Quick start script (Windows)
```

### Key Files Modified from Supabase
- `src/lib/api.ts` - New API client (was supabase.ts)
- `src/contexts/AuthContext.tsx` - Updated for MongoDB API
- All backend routes use MongoDB
- Environment variables changed

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Verify all prerequisites are installed
3. Ensure environment variables are correct
4. Check MongoDB connection and permissions
5. Review console logs for specific error messages

## 🎉 Success!

Once everything is running:
- Frontend: Modern React interface
- Backend: RESTful API with Express
- Database: MongoDB with optimized collections
- Features: Full medication management system

Happy coding! 💊✨
