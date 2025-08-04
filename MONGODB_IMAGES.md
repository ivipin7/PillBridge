# MongoDB GridFS Image Storage Implementation

This document describes the implementation of MongoDB GridFS for storing and accessing images in the PillBridge application, specifically designed for the pill game feature.

## 🚀 Features

- **GridFS Storage**: Images are stored directly in MongoDB using GridFS, eliminating filesystem dependencies
- **Automatic Image Serving**: Images are served directly through API endpoints with proper caching headers
- **Metadata Support**: Each image includes metadata like medication ID, category, original name, and upload date
- **Frontend Integration**: Easy-to-use TypeScript API client for image operations
- **Error Handling**: Comprehensive error handling and validation
- **Scalable**: GridFS handles large files efficiently and supports horizontal scaling

## 📁 File Structure

```
backend/
├── routes/images.js          # GridFS image storage routes
└── package.json             # Updated with GridFS dependencies

src/
└── lib/imageApi.ts          # Frontend API client for image operations

test-mongo-images.cjs        # Test script for MongoDB GridFS functionality
```

## 🔧 Backend Implementation

### Routes (`/images`)

1. **POST /images** - Upload image to GridFS
   - Accepts multipart form data with `image` field
   - Supports optional `medication_id` and `category` metadata
   - Returns image URL and metadata

2. **GET /images/:id** - Retrieve image by ID
   - Serves image directly with appropriate headers
   - Includes caching headers for performance

3. **GET /images** - List images with filtering
   - Supports filtering by `medication_id`, `category`, and `limit`
   - Returns array of image metadata

4. **DELETE /images/:id** - Delete image by ID
   - Removes image from GridFS completely

### Dependencies

```json
{
  "multer": "^1.4.5-lts.1",
  "gridfs-stream": "^1.1.1",
  "mongodb": "^6.17.0"
}
```

## 🎮 Frontend Integration

### Using the Image API

```typescript
import { imageApi } from '../lib/imageApi';

// Upload an image
const uploadResponse = await imageApi.uploadImage(file, medicationId, 'medication');

// Get image URL for display
const imageUrl = imageApi.getImageUrl(imageId);

// List all medication images
const images = await imageApi.getAllMedicationImages();

// Delete an image
await imageApi.deleteImage(imageId);
```

### Updated Medication Form

The `AddMedicationForm` component now uses MongoDB GridFS for image uploads:

```typescript
// Images are uploaded to MongoDB instead of filesystem
if (imageFile) {
  imageUrl = await uploadFile(imageFile, 'image'); // Uses /images endpoint
}
```

## 🎯 Pill Game Integration

The pill game can now use images stored in MongoDB:

1. **Image Loading**: Medications with real uploaded images are prioritized
2. **Fallback Support**: Placeholder images are generated for medications without photos
3. **Performance**: GridFS images are cached and served efficiently

### Example Usage in Pill Game

```typescript
// Get all medication images for the game
const medicationImages = await imageApi.getAllMedicationImages();

// Filter medications that have real images vs placeholders
const medicationsWithRealImages = medications.filter(med => 
  med.image_url && !med.image_url.includes('placeholder')
);
```

## 🧪 Testing

Run the test script to verify MongoDB GridFS functionality:

```bash
node test-mongo-images.cjs
```

The test will:
- Connect to MongoDB
- List existing images
- Create a test image if none exist
- Verify GridFS collections
- Display database statistics

## 📊 Database Schema

### GridFS Collections

GridFS automatically creates two collections:

1. **images.files** - File metadata
   ```javascript
   {
     _id: ObjectId,
     filename: String,
     length: Number,
     chunkSize: Number,
     uploadDate: Date,
     metadata: {
       originalName: String,
       contentType: String,
       uploadDate: Date,
       medicationId: String,  // Optional
       category: String       // e.g., 'medication', 'test'
     }
   }
   ```

2. **images.chunks** - File data chunks
   ```javascript
   {
     _id: ObjectId,
     files_id: ObjectId,    // References images.files._id
     n: Number,             // Chunk sequence number
     data: BinData          // Actual file data
   }
   ```

## 🔄 Migration from Filesystem

If you have existing images in the filesystem, you can migrate them:

1. Create a migration script to read existing files
2. Upload them to GridFS using the `/images` endpoint
3. Update medication records with new GridFS URLs
4. Remove old filesystem files

## 🚀 API Endpoints

### Upload Image
```http
POST /images
Content-Type: multipart/form-data

image: (file)
medication_id: "64f1a2b3c4d5e6f7g8h9i0j1"  // Optional
category: "medication"                        // Optional
```

### Get Image
```http
GET /images/64f1a2b3c4d5e6f7g8h9i0j1
```

### List Images
```http
GET /images?medication_id=64f1a2b3c4d5e6f7g8h9i0j1&category=medication&limit=10
```

### Delete Image
```http
DELETE /images/64f1a2b3c4d5e6f7g8h9i0j1
```

## 🔧 Configuration

Ensure your MongoDB connection is properly configured in `backend/db.js`:

```javascript
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'pillbridge';
```

## 🎯 Benefits for Pill Game

1. **Centralized Storage**: All images are stored in the database with the rest of your data
2. **Easy Access**: Simple API to get all medication images for game generation
3. **Metadata**: Rich metadata allows filtering and categorization
4. **Scalability**: GridFS handles large files and scales with your database
5. **Consistency**: No file system dependencies, works in any deployment environment
6. **Backup**: Images are included in database backups automatically

## 🛠 Troubleshooting

### Common Issues

1. **"Module not found" errors**: Ensure all dependencies are installed
2. **GridFS collections not created**: They're created automatically on first upload
3. **Image not displaying**: Check the image ID format (must be valid ObjectId)
4. **Upload fails**: Verify file size limits and file type validation

### Debugging

Enable detailed logging by checking the console output in both backend routes and frontend API calls. All operations include comprehensive logging for troubleshooting.

## 🔜 Future Enhancements

- Image resizing and optimization
- Multiple image sizes (thumbnails)
- Image compression
- Batch upload support
- Advanced metadata filtering
- Image analytics and usage tracking

---

✅ **Ready to Use**: Your MongoDB GridFS image storage is now fully implemented and ready for the pill game!
