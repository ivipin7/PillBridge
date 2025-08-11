// Emergency diagnostic - copy and paste this into your browser console
// This will show us exactly what's in your medication data now

console.log("🚨 EMERGENCY DIAGNOSTIC");
console.log("======================");

(async function emergencyDiagnostic() {
    try {
        // Get user from localStorage 
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log("❌ Please login first");
            return;
        }
        
        const user = JSON.parse(userStr);
        console.log(`👤 User: ${user.full_name} (${user._id})`);
        
        // Get medications
        const response = await fetch(`http://localhost:3000/medications?patient_id=${user._id}`);
        const medications = await response.json();
        
        console.log(`\n💊 Found ${medications.length} medications:`);
        
        medications.forEach((med, index) => {
            console.log(`\n${index + 1}. ${med.name} (ID: ${med._id}):`);
            console.log(`   - morning_dose: ${med.morning_dose} (${typeof med.morning_dose})`);
            console.log(`   - afternoon_dose: ${med.afternoon_dose} (${typeof med.afternoon_dose})`);
            console.log(`   - night_dose: ${med.night_dose} (${typeof med.night_dose})`);
            console.log(`   - current_count: ${med.current_count} (${typeof med.current_count})`);
            console.log(`   - total_count: ${med.total_count} (${typeof med.total_count})`);
            console.log(`   - low_stock_threshold: ${med.low_stock_threshold} (${typeof med.low_stock_threshold})`);
            console.log(`   - name: ${med.name} (${typeof med.name})`);
            console.log(`   - dosage: ${med.dosage} (${typeof med.dosage})`);
            console.log(`   - patient_id: ${med.patient_id} (${typeof med.patient_id})`);
        });
        
        // Test the filtering logic for each time of day
        console.log(`\n🔍 TESTING FILTERING LOGIC:`);
        
        ['morning', 'afternoon', 'night'].forEach(timeOfDay => {
            const timeField = `${timeOfDay}_dose`;
            console.log(`\n${timeOfDay.toUpperCase()}:`);
            
            const validMeds = medications.filter(med => {
                const doseValue = med[timeField];
                const isValid = doseValue && (typeof doseValue === 'boolean' ? doseValue : doseValue > 0);
                console.log(`   - ${med.name}: ${timeField}=${doseValue} (${typeof doseValue}) → ${isValid ? 'VALID' : 'INVALID'}`);
                return isValid;
            });
            
            console.log(`   📊 Result: ${validMeds.length} medications would be processed for ${timeOfDay}`);
        });
        
        // Test API calls (without actually marking as taken)
        console.log(`\n🧪 TESTING API CALLS (DRY RUN):`);
        
        for (const timeOfDay of ['morning', 'afternoon', 'night']) {
            console.log(`\n--- Testing ${timeOfDay.toUpperCase()} API ---`);
            
            // Simulate what would happen
            const timeField = `${timeOfDay}_dose`;
            const validMeds = medications.filter(med => {
                const doseValue = med[timeField];
                return doseValue && (typeof doseValue === 'boolean' ? doseValue : doseValue > 0);
            });
            
            if (validMeds.length === 0) {
                console.log(`   ❌ API would return: "No medications scheduled for ${timeOfDay}"`);
            } else {
                console.log(`   ✅ API would process ${validMeds.length} medications:`);
                validMeds.forEach(med => {
                    const dosageAmount = med[timeField] || 1;
                    console.log(`      - ${med.name}: would decrease from ${med.current_count} to ${med.current_count - dosageAmount}`);
                });
            }
        }
        
        console.log(`\n💡 NEXT STEPS:`);
        if (medications.length === 0) {
            console.log("❌ No medications found! You need to add medications first.");
        } else {
            console.log("✅ Medications found. Check the filtering logic above to see what's wrong.");
            console.log("📝 If all dose values show as 'true' but still not working, the issue might be in the backend.");
            console.log("🔧 You might need to restore your original medication data.");
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
})();
