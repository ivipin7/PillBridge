// Quick fix - copy and paste this into your browser console while on the patient dashboard
// This will automatically fix your medication dose settings

console.log("🔧 QUICK FIX: Setting up morning and afternoon doses");

(async function quickFix() {
    try {
        // Get user from localStorage 
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            console.log("❌ Please login first");
            return;
        }
        
        const user = JSON.parse(userStr);
        console.log(`👤 Fixing medications for: ${user.full_name}`);
        
        // Get medications
        const response = await fetch(`http://localhost:3000/medications?patient_id=${user._id}`);
        const medications = await response.json();
        
        console.log(`💊 Found ${medications.length} medications`);
        
        // Fix each medication
        for (const med of medications) {
            console.log(`\n🔧 Checking ${med.name}:`);
            console.log(`   Current: morning=${med.morning_dose}, afternoon=${med.afternoon_dose}, night=${med.night_dose}`);
            
            const needsUpdate = !med.morning_dose || !med.afternoon_dose;
            
            if (needsUpdate) {
                console.log(`   🚀 Updating...`);
                
                const updateResponse = await fetch(`http://localhost:3000/medications/${med._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        morning_dose: true,
                        afternoon_dose: true,
                        night_dose: med.night_dose || true
                    })
                });
                
                if (updateResponse.ok) {
                    console.log(`   ✅ Fixed ${med.name}`);
                } else {
                    console.log(`   ❌ Failed to update ${med.name}`);
                }
            } else {
                console.log(`   ✅ Already properly configured`);
            }
        }
        
        console.log(`\n🎉 DONE! Now try voice logging:`);
        console.log(`   - "I took my morning pill"`);
        console.log(`   - "I took my afternoon medicine"`);
        console.log(`   - "I took my night medication"`);
        
        // Refresh the page to reload medications
        setTimeout(() => {
            console.log("🔄 Refreshing page in 2 seconds...");
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
})();
