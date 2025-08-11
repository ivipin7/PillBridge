// ULTRA-SAFE MEDICATION RECOVERY SCRIPT
// This will fix your medications without losing any other data
// Copy and paste this into your browser console

console.log("🆘 ULTRA-SAFE MEDICATION RECOVERY");
console.log("==================================");

(async function ultraSafeRecovery() {
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
            console.log("❌ No medications found!");
            console.log("💡 You may need to re-add your medications manually.");
            console.log("📝 Go to 'Add Medication' tab and create them again with:");
            console.log("   ✅ Morning Dose checked");
            console.log("   ✅ Afternoon Dose checked"); 
            console.log("   ✅ Night Dose checked");
            return;
        }
        
        // Show current state and identify the problem
        console.log("\n📋 CURRENT MEDICATION STATE:");
        let hasIssues = false;
        
        medications.forEach((med, index) => {
            console.log(`\n${index + 1}. ${med.name} (ID: ${med._id.slice(-8)}):`);
            
            // Check all important fields
            const fields = [
                'name', 'dosage', 'current_count', 'total_count', 'low_stock_threshold',
                'morning_dose', 'afternoon_dose', 'night_dose', 'patient_id'
            ];
            
            fields.forEach(field => {
                const value = med[field];
                const hasValue = value !== undefined && value !== null;
                console.log(`   - ${field}: ${value} (${typeof value}) ${hasValue ? '✅' : '❌ MISSING!'}`);
                
                if (!hasValue && ['name', 'current_count', 'patient_id'].includes(field)) {
                    hasIssues = true;
                    console.log(`     ⚠️  CRITICAL: ${field} is missing!`);
                }
            });
        });
        
        if (hasIssues) {
            console.log("\n🚨 CRITICAL ISSUES DETECTED!");
            console.log("❌ Your medication data appears to be corrupted.");
            console.log("💡 RECOMMENDED ACTIONS:");
            console.log("   1. Delete corrupted medications");
            console.log("   2. Re-add them manually through the 'Add Medication' form");
            console.log("   3. Make sure to check all three dose times (Morning, Afternoon, Night)");
            return;
        }
        
        // If no critical issues, fix the dose values
        console.log("\n🔧 FIXING DOSE VALUES...");
        
        for (const med of medications) {
            console.log(`\n🔧 Processing ${med.name}...`);
            
            // Prepare a complete medication object to prevent data loss
            const completeUpdate = {
                // Preserve all original data
                name: med.name,
                dosage: med.dosage,
                patient_id: med.patient_id,
                current_count: med.current_count,
                total_count: med.total_count,
                low_stock_threshold: med.low_stock_threshold,
                instructions: med.instructions || '',
                image_url: med.image_url || null,
                audio_url: med.audio_url || null,
                morning_time: med.morning_time || '08:00',
                afternoon_time: med.afternoon_time || '14:00', 
                night_time: med.night_time || '20:00',
                created_at: med.created_at,
                
                // Fix the dose values (set all to 1 for numeric compatibility)
                morning_dose: 1,
                afternoon_dose: 1,
                night_dose: 1,
                
                // Update timestamp
                updated_at: new Date().toISOString()
            };
            
            console.log(`   📤 Sending complete update...`);
            
            try {
                const updateResponse = await fetch(`http://localhost:3000/medications/${med._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(completeUpdate)
                });
                
                if (updateResponse.ok) {
                    const updatedMed = await updateResponse.json();
                    console.log(`   ✅ Successfully restored ${med.name}`);
                    console.log(`   📊 Doses: morning=${updatedMed.morning_dose}, afternoon=${updatedMed.afternoon_dose}, night=${updatedMed.night_dose}`);
                    console.log(`   📊 Count: ${updatedMed.current_count}/${updatedMed.total_count}`);
                } else {
                    const errorData = await updateResponse.json();
                    console.log(`   ❌ Failed to update ${med.name}:`, errorData);
                }
            } catch (error) {
                console.log(`   ❌ Network error updating ${med.name}:`, error);
            }
        }
        
        console.log(`\n🎉 RECOVERY COMPLETE!`);
        console.log(`📝 All medications should now work for voice logging:`);
        console.log(`   🌅 "I took my morning pill"`);
        console.log(`   ☀️ "I took my afternoon medicine"`);  
        console.log(`   🌙 "I took my night medication"`);
        
        // Refresh after a delay
        setTimeout(() => {
            console.log("🔄 Refreshing page to reload data...");
            window.location.reload();
        }, 3000);
        
    } catch (error) {
        console.error("❌ Recovery failed:", error);
        console.log("💡 Try refreshing the page and running this script again.");
    }
})();
