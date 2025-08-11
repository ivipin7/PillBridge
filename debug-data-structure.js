const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugDataStructure() {
  console.log('🔍 Debug: Understanding medication data structure');
  
  try {
    const patientId = '687d37e23c53de55354f288e'; // Real patient ID
    
    // Fetch one medication to understand its structure
    console.log('\n1. Fetching medications to understand data structure...');
    const medsResponse = await fetch(`http://localhost:3000/medications?patient_id=${patientId}`);
    const medications = await medsResponse.json();
    
    console.log('\n📊 Medication data structure:');
    console.log(JSON.stringify(medications[0], null, 2));
    
    // Test the filtering logic locally
    console.log('\n2. Testing filtering logic for night_dose...');
    const timeField = 'night_dose';
    
    medications.forEach(med => {
      const doseValue = med[timeField];
      const shouldInclude = doseValue && doseValue > 0;
      console.log(`${med.name}: ${timeField}=${doseValue} (${typeof doseValue}), include=${shouldInclude}`);
    });
    
    const nightMedications = medications.filter(med => {
      const doseValue = med[timeField];
      return doseValue && doseValue > 0;
    });
    
    console.log('\n✅ Correctly filtered night medications:', nightMedications.map(m => m.name));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugDataStructure();
