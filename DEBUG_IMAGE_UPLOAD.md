# 🐛 Debug Image Upload Issues

This guide will help you troubleshoot image upload problems in the AddMedicationForm.

## 🔧 Quick Checklist

### 1. **Backend Server Status**
```bash
# Make sure the backend server is running
cd backend
node server.js
```

You should see:
```
🚀 Backend server running on http://localhost:3000
📸 Image upload endpoint: POST /images
```

### 2. **MongoDB Connection**
```bash
# Test MongoDB connection
cd ..
node test-mongo-images.cjs
```

You should see:
```
✅ MongoDB GridFS image storage test completed successfully!
```

### 3. **Network Connectivity**
Open your browser console and check if you see any network errors when uploading.

### 4. **Browser Console Debugging**

When you try to upload an image, you should see these console messages:

```
🖼️ Uploading image to MongoDB GridFS: {filename: "test.jpg", size: 12345, type: "image/jpeg", endpoint: "http://localhost:3000/images"}
📡 Response status: 200 OK
✅ Image uploaded successfully to MongoDB: {message: "Image uploaded successfully", fileId: "...", url: "..."}
```

## 🚨 Common Error Messages & Solutions

### Error: "Cannot connect to server"
**Cause**: Backend server is not running or not accessible
**Solution**: 
1. Start the backend server: `cd backend && node server.js`
2. Check if port 3000 is available
3. Verify no firewall blocking localhost:3000

### Error: "Failed to upload image (500)"
**Cause**: Server error, usually MongoDB connection issue
**Solution**:
1. Check MongoDB is running
2. Verify connection string in `.env` file
3. Check backend console for detailed error logs

### Error: "Only image files are allowed!"
**Cause**: File type validation failed
**Solution**:
1. Make sure you're uploading JPG, PNG, or other image formats
2. Check file is not corrupted

### Error: "File too large. Maximum size is 10MB."
**Cause**: Image file exceeds size limit
**Solution**:
1. Compress the image
2. Use a different image

## 🔍 Step-by-Step Debugging Process

### Step 1: Check Backend Server
```bash
# In terminal 1 - Start backend
cd backend
node server.js

# In terminal 2 - Test endpoint
curl -X GET http://localhost:3000/images
```

### Step 2: Test Image Upload Manually
```bash
# Create a test image upload (with curl)
curl -X POST http://localhost:3000/images \
  -F "image=@/path/to/test-image.jpg" \
  -F "category=medication"
```

### Step 3: Check Browser Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try uploading an image
4. Look for the POST request to `/images`
5. Check response status and data

### Step 4: Check Browser Console
Look for the detailed logging messages I added:
- 🖼️ Upload start message
- 📡 Response status
- ✅ Success message OR ❌ Error message

## 📋 Environment Verification

### Required Dependencies
Make sure these packages are installed in backend:
```json
{
  "multer": "^1.4.5-lts.1",
  "gridfs-stream": "^1.1.1", 
  "mongodb": "^6.17.0"
}
```

### Database Check
```bash
# Connect to MongoDB and check GridFS collections
node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');
client.connect().then(async () => {
  const db = client.db('pillbridge');
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  client.close();
});
"
```

### File Structure Check
Ensure these files exist:
- ✅ `backend/routes/images.js`
- ✅ `backend/app.js` (includes images route)
- ✅ `src/components/medications/AddMedicationForm.tsx`
- ✅ `src/lib/imageApi.ts`

## 🧪 Test Script

Run this Node.js script to test the complete image upload flow:

```javascript
// test-upload-flow.js
const fetch = require('node-fetch');
const FormData = require('form-data');

async function testImageUpload() {
  const formData = new FormData();
  formData.append('image', Buffer.from('fake-image-data'), 'test.jpg');
  formData.append('category', 'medication');
  
  try {
    const response = await fetch('http://localhost:3000/images', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload successful:', result);
    } else {
      const error = await response.text();
      console.log('❌ Upload failed:', response.status, error);
    }
  } catch (err) {
    console.log('🔥 Network error:', err.message);
  }
}

testImageUpload();
```

## 📞 Getting Help

If you're still having issues:

1. **Check the exact error message** in browser console
2. **Check backend server logs** for detailed error information
3. **Try uploading a small test image** (like a 100KB PNG)
4. **Verify MongoDB is running** with `mongosh` or MongoDB Compass

## 🔧 Emergency Fallback

If MongoDB GridFS isn't working, you can temporarily fall back to filesystem upload by changing the upload function:

```typescript
// Temporary fallback in AddMedicationForm.tsx
if (type === 'image') {
  // Fallback to filesystem upload
  formData.append('file', file);
  formData.append('type', 'image');
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  // ... rest of the code
}
```

This will help you identify if the issue is specifically with GridFS or with the general upload functionality.
