const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugVoiceMedication() {
  console.log('🔍 Debug: Voice Medication Tracking');
  
  try {
    // 1. First, let's see what medications exist
    console.log('\n1. Fetching existing medications...');
    const medsResponse = await fetch('http://localhost:3000/medications?patient_id=test-patient-123');
    const medications = await medsResponse.json();
    
    console.log('📊 Found medications:', medications.length);
    medications.forEach((med, index) => {
      console.log(`  ${index + 1}. ${med.name} (${med.dosage})`);
      console.log(`     Current count: ${med.current_count}/${med.total_count}`);
      console.log(`     Morning dose: ${med.morning_dose}`);
      console.log(`     Afternoon dose: ${med.afternoon_dose}`);
      console.log(`     Night dose: ${med.night_dose}`);
    });
    
    // 2. Try marking morning medications as taken
    console.log('\n2. Testing voice medication marking...');
    const markTakenResponse = await fetch('http://localhost:3000/medications/mark-taken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: 'test-patient-123',
        timeOfDay: 'morning'
      }),
    });
    
    const markTakenResult = await markTakenResponse.json();
    console.log('📤 Mark taken response status:', markTakenResponse.status);
    console.log('📄 Mark taken response:', markTakenResult);
    
    // 3. Fetch medications again to see if counts changed
    console.log('\n3. Fetching medications after marking as taken...');
    const medsAfterResponse = await fetch('http://localhost:3000/medications?patient_id=test-patient-123');
    const medicationsAfter = await medsAfterResponse.json();
    
    console.log('📊 Medications after marking as taken:');
    medicationsAfter.forEach((med, index) => {
      const beforeMed = medications.find(m => m._id === med._id);
      const countChanged = beforeMed && beforeMed.current_count !== med.current_count;
      console.log(`  ${index + 1}. ${med.name} (${med.dosage})`);
      console.log(`     Current count: ${med.current_count}/${med.total_count} ${countChanged ? '⬇️ CHANGED' : '❌ NO CHANGE'}`);
      console.log(`     Morning dose: ${med.morning_dose}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugVoiceMedication();
