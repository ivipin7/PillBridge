const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function testMongoDBImages() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'pillbridge';
  
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  
  console.log('Connected to database:', dbName);
  
  // Create GridFS bucket
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  
  try {
    // Test 1: List existing images
    console.log('\n--- Test 1: Listing existing images ---');
    const existingFiles = await bucket.find({}).toArray();
    console.log(`Found ${existingFiles.length} existing images:`);
    existingFiles.forEach(file => {
      console.log(`- ${file.filename} (${file.length} bytes, uploaded: ${file.uploadDate})`);
    });
    
    // Test 2: Create a sample image if none exist
    if (existingFiles.length === 0) {
      console.log('\n--- Test 2: Creating sample image ---');
      
      // Create a simple text file as a test image
      const testContent = Buffer.from('This is a test image file for PillBridge');
      const filename = `test-image-${Date.now()}.txt`;
      
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          originalName: filename,
          contentType: 'text/plain',
          uploadDate: new Date(),
          medicationId: null,
          category: 'test'
        }
      });
      
      await new Promise((resolve, reject) => {
        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
          console.log(`Test image uploaded successfully: ${filename}`);
          console.log(`File ID: ${uploadStream.id}`);
          resolve();
        });
        
        uploadStream.end(testContent);
      });
    }
    
    // Test 3: Verify GridFS collections
    console.log('\n--- Test 3: GridFS Collections ---');
    const collections = await db.listCollections().toArray();
    const gridfsCollections = collections.filter(col => 
      col.name.startsWith('images.') || col.name === 'images.files' || col.name === 'images.chunks'
    );
    
    console.log('GridFS collections found:');
    gridfsCollections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    if (gridfsCollections.length === 0) {
      console.log('No GridFS collections found - they will be created automatically when first image is uploaded');
    }
    
    // Test 4: Check database connection
    console.log('\n--- Test 4: Database Stats ---');
    const stats = await db.stats();
    console.log(`Database: ${stats.db}`);
    console.log(`Collections: ${stats.collections}`);
    console.log(`Objects: ${stats.objects}`);
    console.log(`Data Size: ${Math.round(stats.dataSize / 1024)} KB`);
    
    console.log('\n✅ MongoDB GridFS image storage test completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Upload images via POST /images with form-data containing "image" field');
    console.log('2. Retrieve images via GET /images/:id');
    console.log('3. List images via GET /images');
    console.log('4. Delete images via DELETE /images/:id');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testMongoDBImages().catch(console.error);
}

module.exports = { testMongoDBImages };
