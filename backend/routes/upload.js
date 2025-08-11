const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type || 'misc';
    const typeDir = path.join(uploadsDir, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    console.log(`Uploading ${type} file to: ${typeDir}`);
    cb(null, typeDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const type = req.body.type;
    console.log(`Validating file: ${file.originalname}, type: ${type}, mimetype: ${file.mimetype}`);
    
    if (type === 'image') {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    } else if (type === 'audio') {
      // Accept only audio files
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed!'), false);
      }
    } else {
      cb(new Error('Invalid file type specified!'), false);
    }
  }
});

// POST /upload - Handle file upload
router.post('/', upload.single('file'), (req, res) => {
  try {
    console.log('Upload request received:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    // Check if file type is specified
    if (!req.body.type) {
      return res.status(400).json({ error: 'File type is required. Please specify "image" or "audio"' });
    }

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded. Please select a file to upload.' });
    }

    const type = req.body.type;
    const filename = req.file.filename;
    const url = `${req.protocol}://${req.get('host')}/uploads/${type}/${filename}`;

    console.log('File uploaded successfully:', {
      type,
      filename,
      url,
      size: req.file.size
    });

    res.json({
      message: 'File uploaded successfully',
      url: url,
      filename: filename,
      type: type,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  console.error('Upload middleware error:', error);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ error: 'Unexpected file field.' });
      default:
        return res.status(400).json({ error: `Upload error: ${error.message}` });
    }
  }
  
  // Handle custom validation errors
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(400).json({ error: 'Upload failed. Please try again.' });
});

module.exports = router;

