// Browser-based medication data checker and fixer
// Run this in the browser console when logged in as a patient

console.log("🔧 Medication Dose Checker & Fixer");
console.log("===================================");

const fixMedicationDoses = async () => {
    try {
        // Get current user
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log("❌ No user found in localStorage. Please login first.");
            return;
        }
        
        const user = JSON.parse(userStr);
        console.log(`👤 User: ${user.full_name} (${user._id})`);
        
        // Fetch current medications
        const response = await fetch(`http://localhost:3000/medications?patient_id=${user._id}`);
        if (!response.ok) {
            console.log(`❌ Failed to fetch medications: ${response.status}`);
            return;
        }
        
        const medications = await response.json();
        console.log(`💊 Found ${medications.length} medications:`);
        
        // Analyze current medication data
        let needsFixing = false;
        medications.forEach((med, index) => {
            console.log(`\n${index + 1}. ${med.name}:`);
            console.log(`   - morning_dose: ${med.morning_dose} (${typeof med.morning_dose})`);
            console.log(`   - afternoon_dose: ${med.afternoon_dose} (${typeof med.afternoon_dose})`);
            console.log(`   - night_dose: ${med.night_dose} (${typeof med.night_dose})`);
            
            // Check if doses need fixing
            const morningInvalid = !med.morning_dose || (typeof med.morning_dose !== 'boolean' && med.morning_dose <= 0);
            const afternoonInvalid = !med.afternoon_dose || (typeof med.afternoon_dose !== 'boolean' && med.afternoon_dose <= 0);
            const nightValid = med.night_dose && (typeof med.night_dose === 'boolean' ? med.night_dose : med.night_dose > 0);
            
            if (morningInvalid) {
                console.log(`   ⚠️  Morning dose needs fixing`);
                needsFixing = true;
            }
            if (afternoonInvalid) {
                console.log(`   ⚠️  Afternoon dose needs fixing`);
                needsFixing = true;
            }
            if (nightValid) {
                console.log(`   ✅ Night dose is valid`);
            }
        });
        
        if (needsFixing) {
            console.log(`\n🔧 FIXING MEDICATION DOSES...`);
            
            // Fix each medication
            for (const med of medications) {
                const updates = {};
                
                // Set morning_dose to 1 if it's not properly set
                if (!med.morning_dose || (typeof med.morning_dose !== 'boolean' && med.morning_dose <= 0)) {
                    updates.morning_dose = 1;
                    console.log(`   🌅 Setting ${med.name} morning_dose = 1`);
                }
                
                // Set afternoon_dose to 1 if it's not properly set  
                if (!med.afternoon_dose || (typeof med.afternoon_dose !== 'boolean' && med.afternoon_dose <= 0)) {
                    updates.afternoon_dose = 1;
                    console.log(`   ☀️  Setting ${med.name} afternoon_dose = 1`);
                }
                
                // Only update if there are changes
                if (Object.keys(updates).length > 0) {
                    try {
                        const updateResponse = await fetch(`http://localhost:3000/medications/${med._id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(updates)
                        });
                        
                        if (updateResponse.ok) {
                            console.log(`   ✅ Updated ${med.name}`);
                        } else {
                            console.log(`   ❌ Failed to update ${med.name}: ${updateResponse.status}`);
                        }
                    } catch (error) {
                        console.log(`   ❌ Error updating ${med.name}:`, error.message);
                    }
                }
            }
            
            console.log(`\n🎉 FIXING COMPLETE!`);
            console.log(`📝 Now try voice logging again:`);
            console.log(`   - "I took my morning pill"`);
            console.log(`   - "I took my afternoon medicine"`);
            console.log(`   - "I took my night medication"`);
            
        } else {
            console.log(`\n✅ All medications have proper dose settings`);
            console.log(`🔍 The issue might be elsewhere. Let's test the API calls...`);
            
            // Test API calls
            for (const timeOfDay of ['morning', 'afternoon', 'night']) {
                console.log(`\n🧪 Testing ${timeOfDay} API call...`);
                
                try {
                    const testResponse = await fetch('http://localhost:3000/medications/mark-taken', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            patient_id: user._id,
                            timeOfDay: timeOfDay
                        }),
                    });
                    
                    const testData = await testResponse.json();
                    console.log(`   Status: ${testResponse.status}`);
                    console.log(`   Response:`, testData);
                    
                    if (!testResponse.ok) {
                        console.log(`   ❌ ${timeOfDay.toUpperCase()} API call failed:`, testData.error);
                    } else {
                        console.log(`   ✅ ${timeOfDay.toUpperCase()} API call succeeded`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${timeOfDay.toUpperCase()} API error:`, error.message);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
};

// Run the fixer
fixMedicationDoses();
