// Simple test script to check medication data structure
// Run this in the browser console when logged in as a patient

console.log("🔍 Checking medication data structure...");

// Get current user from localStorage or session
const checkMedicationData = async () => {
  try {
    // Try to get user info from local storage or auth context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user._id) {
      console.log("❌ No user found. Please login first.");
      return;
    }
    
    console.log(`👤 Checking medications for user: ${user.full_name} (${user._id})`);
    
    // Fetch medications
    const response = await fetch(`http://localhost:3000/medications?patient_id=${user._id}`);
    const medications = await response.json();
    
    console.log(`📊 Found ${medications.length} medications:`);
    
    medications.forEach((med, index) => {
      console.log(`\n${index + 1}. ${med.name}:`);
      console.log(`   - Morning dose: ${med.morning_dose} (type: ${typeof med.morning_dose})`);
      console.log(`   - Afternoon dose: ${med.afternoon_dose} (type: ${typeof med.afternoon_dose})`);
      console.log(`   - Night dose: ${med.night_dose} (type: ${typeof med.night_dose})`);
      console.log(`   - Current count: ${med.current_count}`);
      console.log(`   - Total count: ${med.total_count}`);
    });
    
    // Test which medications would be affected by each time period
    const checkTimeOfDay = (timeOfDay) => {
      const timeField = `${timeOfDay}_dose`;
      const scheduledMeds = medications.filter(med => {
        const doseValue = med[timeField];
        return doseValue && (typeof doseValue === 'boolean' ? doseValue : doseValue > 0);
      });
      
      console.log(`\n${timeOfDay.toUpperCase()} medications (${scheduledMeds.length}):`);
      scheduledMeds.forEach(med => {
        console.log(`   - ${med.name}: ${med[timeField]} dose(s)`);
      });
      
      return scheduledMeds;
    };
    
    const morningMeds = checkTimeOfDay('morning');
    const afternoonMeds = checkTimeOfDay('afternoon');
    const nightMeds = checkTimeOfDay('night');
    
    console.log(`\n📋 SUMMARY:`);
    console.log(`   - Morning: ${morningMeds.length} medications scheduled`);
    console.log(`   - Afternoon: ${afternoonMeds.length} medications scheduled`);
    console.log(`   - Night: ${nightMeds.length} medications scheduled`);
    
    // Test API calls
    console.log(`\n🧪 Testing API calls...`);
    
    const testTimeOfDay = async (timeOfDay) => {
      try {
        const response = await fetch('http://localhost:3000/medications/mark-taken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patient_id: user._id,
            timeOfDay: timeOfDay
          }),
        });
        
        const data = await response.json();
        
        console.log(`${timeOfDay.toUpperCase()} API test:`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, data);
        
        return { status: response.status, data };
      } catch (error) {
        console.log(`${timeOfDay.toUpperCase()} API error:`, error.message);
        return { error: error.message };
      }
    };
    
    // Note: Uncomment these lines to actually test the API (WARNING: This will mark medications as taken!)
    // await testTimeOfDay('morning');
    // await testTimeOfDay('afternoon');
    // await testTimeOfDay('night');
    
    console.log(`\n✅ Data check complete! Check the console output above for details.`);
    
  } catch (error) {
    console.error("❌ Error checking medication data:", error);
  }
};

checkMedicationData();
