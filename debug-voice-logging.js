// Debug script to test voice medication logging
const API_BASE = 'http://localhost:3000';

// Test function to simulate voice medication logging
async function testMedicationTaken(patientId, timeOfDay, testName) {
    console.log(`\n=== Testing ${testName} ===`);
    console.log(`Patient ID: ${patientId}`);
    console.log(`Time of Day: ${timeOfDay}`);
    
    try {
        // First, let's check what medications exist for this patient
        const medsResponse = await fetch(`${API_BASE}/medications?patient_id=${patientId}`);
        const medications = await medsResponse.json();
        
        console.log('\nCurrent medications:');
        medications.forEach(med => {
            console.log(`- ${med.name}: morning=${med.morning_dose}, afternoon=${med.afternoon_dose}, night=${med.night_dose}, count=${med.current_count}`);
        });
        
        // Now test the mark-taken endpoint
        const response = await fetch(`${API_BASE}/medications/mark-taken`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                patient_id: patientId,
                timeOfDay: timeOfDay
            }),
        });
        
        const data = await response.json();
        
        console.log(`\nResponse Status: ${response.status}`);
        console.log('Response Data:', data);
        
        if (response.ok) {
            console.log('✅ SUCCESS: Medication marked as taken');
            
            // Check medications again to see the updated counts
            const updatedMedsResponse = await fetch(`${API_BASE}/medications?patient_id=${patientId}`);
            const updatedMedications = await updatedMedsResponse.json();
            
            console.log('\nUpdated medications:');
            updatedMedications.forEach(med => {
                const oldMed = medications.find(m => m._id === med._id);
                const countChange = oldMed ? oldMed.current_count - med.current_count : 0;
                console.log(`- ${med.name}: count=${med.current_count} (${countChange > 0 ? `-${countChange}` : 'no change'})`);
            });
        } else {
            console.log('❌ FAILED:', data.error);
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }
}

// Test different times of day
async function runTests() {
    console.log('🧪 Voice Medication Logging Debug Tests');
    console.log('======================================');
    
    // You'll need to replace this with an actual patient ID from your database
    const testPatientId = 'YOUR_PATIENT_ID_HERE'; // ⚠️ Replace this!
    
    if (testPatientId === 'YOUR_PATIENT_ID_HERE') {
        console.log('❌ Please set a valid patient ID in the script first!');
        console.log('You can find patient IDs by checking your MongoDB users collection.');
        return;
    }
    
    // Test all three time periods
    await testMedicationTaken(testPatientId, 'morning', 'MORNING');
    await testMedicationTaken(testPatientId, 'afternoon', 'AFTERNOON');
    await testMedicationTaken(testPatientId, 'night', 'NIGHT');
}

// Run the tests
runTests();
