const fetch = require('node-fetch');

async function testPDFGeneration() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing PDF Generation Process...\n');
  
  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/pdf-reports/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData);
    
    // Test 2: Simple test endpoint
    console.log('\n2. Testing simple test endpoint...');
    const testResponse = await fetch(`${baseUrl}/pdf-reports/test`);
    const testData = await testResponse.json();
    console.log('✅ Test endpoint:', testData);
    
    // Test 3: Test PDF generation with simple content
    console.log('\n3. Testing simple PDF generation...');
    const testPdfResponse = await fetch(`${baseUrl}/pdf-reports/test-pdf`);
    
    if (testPdfResponse.ok) {
      const contentType = testPdfResponse.headers.get('content-type');
      const contentLength = testPdfResponse.headers.get('content-length');
      console.log(`✅ Test PDF generated successfully!`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
      
      if (contentType && contentType.includes('application/pdf')) {
        console.log('   🎉 PDF generation is working correctly!');
      } else {
        console.log('   ⚠️  Unexpected content type:', contentType);
      }
    } else {
      console.log(`❌ Test PDF generation failed with status: ${testPdfResponse.status}`);
      try {
        const errorData = await testPdfResponse.json();
        console.log('   Error details:', errorData);
      } catch (e) {
        console.log('   Could not parse error response');
      }
    }
    
    // Test 4: Test patient report endpoint (will likely fail without valid patient ID)
    console.log('\n4. Testing patient report endpoint...');
    const samplePatientId = '507f1f77bcf86cd799439011'; // Sample MongoDB ObjectId
    const reportResponse = await fetch(`${baseUrl}/pdf-reports/patient/${samplePatientId}`);
    
    if (reportResponse.status === 404) {
      console.log('✅ Patient report endpoint working (404 expected for non-existent patient)');
    } else if (reportResponse.status === 200) {
      const contentType = reportResponse.headers.get('content-type');
      const contentLength = reportResponse.headers.get('content-length');
      console.log('✅ Patient report generated successfully!');
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
    } else if (reportResponse.status === 500) {
      console.log('❌ Patient report generation failed with server error');
      try {
        const errorData = await reportResponse.json();
        console.log('   Error details:', errorData);
      } catch (e) {
        console.log('   Could not parse error response');
      }
    } else {
      console.log(`⚠️  Unexpected status: ${reportResponse.status}`);
    }
    
    console.log('\n🎯 PDF Generation Test Summary:');
    console.log('   - If test PDF works but patient PDF fails, the issue is with data processing');
    console.log('   - If both fail, the issue is with Puppeteer setup');
    console.log('   - Check server logs for detailed error information');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('   1. Make sure the backend server is running');
    console.log('   2. Check if Puppeteer is properly installed');
    console.log('   3. Verify MongoDB connection');
    console.log('   4. Check server logs for errors');
  }
}

testPDFGeneration();
