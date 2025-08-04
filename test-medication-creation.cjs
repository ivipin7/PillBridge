const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMedicationCreation() {
  try {
    console.log('🧪 Testing medication creation endpoint...');
    
    const testMedication = {
      patient_id: 'test-patient-id-123',
      name: 'Test Medication',
      dosage: '10mg',
      total_count: 30,
      current_count: 30,
      low_stock_threshold: 5,
      morning_dose: true,
      afternoon_dose: false,
      night_dose: true,
      morning_time: '08:00',
      afternoon_time: '14:00',
      night_time: '20:00',
      instructions: 'Take with food',
      image_url: null,
      audio_url: null
    };
    
    console.log('📤 Sending test medication data:', testMedication);
    
    const response = await fetch('http://localhost:3000/medications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMedication)
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Medication creation successful!');
      console.log('📄 Response:', result);
      console.log('🆔 Created medication ID:', result._id);
    } else {
      const errorText = await response.text();
      console.log('❌ Medication creation failed:', response.status);
      console.log('🔍 Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure the backend server is running on port 3000');
  }
}

testMedicationCreation();
