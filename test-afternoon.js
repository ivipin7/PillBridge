const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAfternoonMedications() {
  console.log('🔍 Testing: Afternoon Medications (should be empty)');
  
  try {
    const patientId = '687d37e23c53de55354f288e';
    
    // 1. First, let's see current medication counts and afternoon doses
    console.log('\n1. Current medication state:');
    const medsResponse = await fetch(`http://localhost:3000/medications?patient_id=${patientId}`);
    const medications = await medsResponse.json();
    
    medications.forEach(med => {
      console.log(`  ${med.name}: count=${med.current_count}, afternoon_dose=${med.afternoon_dose}`);
    });
    
    // 2. Try marking AFTERNOON medications as taken (should find NONE)
    console.log('\n2. Attempting to mark afternoon medications as taken...');
    const markTakenResponse = await fetch('http://localhost:3000/medications/mark-taken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: patientId,
        timeOfDay: 'afternoon'
      }),
    });
    
    const markTakenResult = await markTakenResponse.json();
    console.log('📤 Response status:', markTakenResponse.status);
    console.log('📄 Response:', markTakenResult);
    
    // 3. Verify that counts haven't changed
    if (markTakenResponse.status === 404) {
      console.log('\n✅ SUCCESS: No afternoon medications found, as expected!');
    } else {
      console.log('\n❌ UNEXPECTED: Found afternoon medications or other error');
      
      // Check if counts changed
      console.log('\n3. Checking if counts changed unexpectedly...');
      const medsAfterResponse = await fetch(`http://localhost:3000/medications?patient_id=${patientId}`);
      const medicationsAfter = await medsAfterResponse.json();
      
      let anyChanges = false;
      medicationsAfter.forEach((med, index) => {
        const beforeMed = medications.find(m => m._id === med._id);
        const countChanged = beforeMed && beforeMed.current_count !== med.current_count;
        if (countChanged) {
          anyChanges = true;
          console.log(`  ${med.name}: count changed from ${beforeMed.current_count} to ${med.current_count} ❌`);
        }
      });
      
      if (!anyChanges) {
        console.log('✅ At least counts didn\'t change unexpectedly');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAfternoonMedications();
