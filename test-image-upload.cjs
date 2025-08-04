const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImageUpload() {
  try {
    console.log('🧪 Testing image upload to MongoDB GridFS...');
    
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    // Create form data
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-pill.png',
      contentType: 'image/png'
    });
    formData.append('category', 'medication');
    
    console.log('📤 Uploading test image...');
    
    const response = await fetch('http://localhost:3000/images', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Image upload successful!');
      console.log('📄 Response:', result);
      console.log('🔗 Image URL:', result.url);
      
      // Test retrieving the image
      console.log('🔍 Testing image retrieval...');
      const retrieveResponse = await fetch(result.url);
      
      if (retrieveResponse.ok) {
        console.log('✅ Image retrieval successful!');
        console.log('📊 Content-Type:', retrieveResponse.headers.get('content-type'));
        console.log('📏 Content-Length:', retrieveResponse.headers.get('content-length'));
      } else {
        console.log('❌ Image retrieval failed:', retrieveResponse.status);
      }
    } else {
      const error = await response.text();
      console.log('❌ Image upload failed:', response.status);
      console.log('🔍 Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure the backend server is running on port 3000');
  }
}

testImageUpload();
