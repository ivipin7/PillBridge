const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testVoiceFix() {
  console.log('🔍 Testing: Voice Medication Fix (Night medications only)');
  
  try {
    const patientId = '687d37e23c53de55354f288e'; // Real patient ID
    
    // 1. First, let's see what medications exist
    console.log('\n1. Fetching existing medications...');
    const medsResponse = await fetch(`http://localhost:3000/medications?patient_id=${patientId}`);
    const medications = await medsResponse.json();
    
    console.log('📊 Found medications:', medications.length);
    medications.forEach((med, index) => {
      console.log(`  ${index + 1}. ${med.name} (${med.dosage})`);
      console.log(`     Current count: ${med.current_count}`);
      console.log(`     Night dose: ${med.night_dose} (${typeof med.night_dose})`);
    });
    
    // 2. Try marking NIGHT medications as taken (should only affect Metformin and Simvastatin)
    console.log('\n2. Testing voice medication marking for NIGHT...');
    const markTakenResponse = await fetch('http://localhost:3000/medications/mark-taken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: patientId,
        timeOfDay: 'night'
      }),
    });
    
    const markTakenResult = await markTakenResponse.json();
    console.log('📤 Mark taken response status:', markTakenResponse.status);
    console.log('📄 Medications marked:', markTakenResult.medications_marked || 'None');
    
    // 3. Fetch medications again to see which ones changed
    console.log('\n3. Fetching medications after marking night doses as taken...');
    const medsAfterResponse = await fetch(`http://localhost:3000/medications?patient_id=${patientId}`);
    const medicationsAfter = await medsAfterResponse.json();
    
    console.log('📊 Medications after marking night doses as taken:');
    medicationsAfter.forEach((med, index) => {
      const beforeMed = medications.find(m => m._id === med._id);
      const countChanged = beforeMed && beforeMed.current_count !== med.current_count;
      console.log(`  ${index + 1}. ${med.name} (${med.dosage})`);
      console.log(`     Current count: ${med.current_count} (was ${beforeMed.current_count}) ${countChanged ? '⬇️ CHANGED' : '✅ NO CHANGE'}`);
      console.log(`     Night dose: ${med.night_dose}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVoiceFix();
