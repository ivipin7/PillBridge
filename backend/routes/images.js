const express = require('express');
const multer = require('multer');
const { GridFSBucket, ObjectId } = require('mongodb');
const { connectDb } = require('../db');
const router = express.Router();

// Configure multer for memory storage (files will be stored in MongoDB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log(`Validating file: ${file.originalname}, mimetype: ${file.mimetype}`);
    
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST /images - Upload image to MongoDB GridFS
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Image upload request received:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    if (!req.file) {
      console.error('No image file uploaded');
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const db = await connectDb();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    // Generate unique filename
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${req.file.originalname}`;
    
    // Create upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        uploadDate: new Date(),
        medicationId: req.body.medication_id || null,
        category: req.body.category || 'medication'
      }
    });

    // Handle upload stream events
    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({ error: 'Failed to upload image to database' });
    });

    uploadStream.on('finish', () => {
      console.log('Image uploaded successfully to GridFS:', {
        filename,
        fileId: uploadStream.id,
        size: req.file.size
      });

      const imageUrl = `${req.protocol}://${req.get('host')}/images/${uploadStream.id}`;
      
      res.json({
        message: 'Image uploaded successfully',
        fileId: uploadStream.id,
        filename: filename,
        url: imageUrl,
        size: req.file.size,
        contentType: req.file.mimetype
      });
    });

    // Write file buffer to upload stream
    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// GET /images/:id - Retrieve image from MongoDB GridFS
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    const db = await connectDb();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    // Find the file
    const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const file = files[0];
    
    // Set appropriate headers
    res.set({
      'Content-Type': file.metadata?.contentType || 'application/octet-stream',
      'Content-Length': file.length,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': file._id.toString()
    });

    // Create download stream and pipe to response
    const downloadStream = bucket.openDownloadStream(new ObjectId(id));
    
    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to retrieve image' });
      }
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('Image retrieval error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to retrieve image' });
    }
  }
});

// GET /images - List all images (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { medication_id, category, limit = 50 } = req.query;
    
    const db = await connectDb();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    // Build filter
    const filter = {};
    if (medication_id) {
      filter['metadata.medicationId'] = medication_id;
    }
    if (category) {
      filter['metadata.category'] = category;
    }

    // Find files
    const files = await bucket.find(filter)
      .limit(parseInt(limit))
      .sort({ uploadDate: -1 })
      .toArray();

    // Transform to useful format
    const imageList = files.map(file => ({
      id: file._id,
      filename: file.filename,
      originalName: file.metadata?.originalName,
      contentType: file.metadata?.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      url: `${req.protocol}://${req.get('host')}/images/${file._id}`,
      medicationId: file.metadata?.medicationId,
      category: file.metadata?.category
    }));

    res.json(imageList);

  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: error.message || 'Failed to list images' });
  }
});

// DELETE /images/:id - Delete image from MongoDB GridFS
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    const db = await connectDb();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    // Check if file exists
    const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete the file
    await bucket.delete(new ObjectId(id));
    
    console.log('Image deleted successfully:', id);
    res.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  console.error('Image upload middleware error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(400).json({ error: error.message || 'Upload failed' });
});

module.exports = router;
