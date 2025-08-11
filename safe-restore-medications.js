// Safe restoration script - copy and paste this into your browser console
// This will safely restore your medication dose settings without breaking other data

console.log("🛠️ SAFE MEDICATION RESTORATION");
console.log("===============================");

(async function safeRestore() {
    try {
        // Get user from localStorage 
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log("❌ Please login first");
            return;
        }
        
        const user = JSON.parse(userStr);
        console.log(`👤 User: ${user.full_name} (${user._id})`);
        
        // Get current medications
        const response = await fetch(`http://localhost:3000/medications?patient_id=${user._id}`);
        const medications = await response.json();
        
        console.log(`\n💊 Found ${medications.length} medications`);
        
        if (medications.length === 0) {
            console.log("❌ No medications found. Please add some medications first.");
            return;
        }
        
        // Show current state
        console.log("\n📋 CURRENT MEDICATION STATE:");
        medications.forEach((med, index) => {
            console.log(`${index + 1}. ${med.name}:`);
            console.log(`   - morning_dose: ${med.morning_dose}`);
            console.log(`   - afternoon_dose: ${med.afternoon_dose}`);
            console.log(`   - night_dose: ${med.night_dose}`);
            console.log(`   - current_count: ${med.current_count}`);
            console.log(`   - total_count: ${med.total_count}`);
        });
        
        // Fix each medication SAFELY (only updating dose fields)
        console.log("\n🔧 SAFELY RESTORING MEDICATIONS...");
        
        for (const med of medications) {
            console.log(`\n🔧 Processing ${med.name}...`);
            
            // Create update object with ONLY the dose fields we want to fix
            const updateData = {
                morning_dose: 1,      // Set to number 1 instead of boolean
                afternoon_dose: 1,    // Set to number 1 instead of boolean  
                night_dose: 1         // Set to number 1 instead of boolean
            };
            
            console.log(`   Updating with:`, updateData);
            
            try {
                const updateResponse = await fetch(`http://localhost:3000/medications/${med._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (updateResponse.ok) {
                    const updatedMed = await updateResponse.json();
                    console.log(`   ✅ Successfully updated ${med.name}`);
                    console.log(`   New values: morning=${updatedMed.morning_dose}, afternoon=${updatedMed.afternoon_dose}, night=${updatedMed.night_dose}`);
                } else {
                    const errorData = await updateResponse.json();
                    console.log(`   ❌ Failed to update ${med.name}:`, errorData);
                }
            } catch (error) {
                console.log(`   ❌ Error updating ${med.name}:`, error);
            }
        }
        
        console.log(`\n🎉 RESTORATION COMPLETE!`);
        console.log(`📝 Now all medications should have numeric dose values (1) for all time periods.`);
        console.log(`🧪 Test voice logging with:`);
        console.log(`   - "I took my morning pill"`);
        console.log(`   - "I took my afternoon medicine"`);
        console.log(`   - "I took my night medication"`);
        
        // Wait a moment then refresh
        setTimeout(() => {
            console.log("🔄 Refreshing page to reload data...");
            window.location.reload();
        }, 3000);
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
})();
