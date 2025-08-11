// Comprehensive debug test for medication marking issue
// Run this in Node.js environment (server-side) to test the backend logic

const { MongoClient } = require('mongodb');

// Replace with your actual MongoDB connection string
const MONGO_URI = 'mongodb://localhost:27017/pillbridge'; // Update this!

async function debugMedicationMarking() {
    let client;
    
    try {
        console.log('🔍 Starting comprehensive medication marking debug...\n');
        
        // Connect to MongoDB
        client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db();
        
        console.log('✅ Connected to MongoDB\n');
        
        // Get a sample patient
        const users = await db.collection('users').find({ role: 'patient' }).limit(1).toArray();
        if (users.length === 0) {
            console.log('❌ No patients found in database');
            return;
        }
        
        const patient = users[0];
        console.log(`👤 Testing with patient: ${patient.full_name} (${patient._id})`);
        
        // Get medications for this patient
        const medications = await db.collection('medications').find({ patient_id: patient._id.toString() }).toArray();
        console.log(`💊 Found ${medications.length} medications:\n`);
        
        medications.forEach((med, index) => {
            console.log(`${index + 1}. ${med.name}:`);
            console.log(`   - morning_dose: ${med.morning_dose} (${typeof med.morning_dose})`);
            console.log(`   - afternoon_dose: ${med.afternoon_dose} (${typeof med.afternoon_dose})`);
            console.log(`   - night_dose: ${med.night_dose} (${typeof med.night_dose})`);
            console.log(`   - current_count: ${med.current_count}`);
            console.log('');
        });
        
        // Test the filtering logic for each time of day
        const testTimeFiltering = (timeOfDay) => {
            console.log(`\n🕐 Testing ${timeOfDay.toUpperCase()} filtering logic:`);
            const timeField = `${timeOfDay}_dose`;
            
            console.log(`   Looking for field: ${timeField}`);
            
            const filteredMeds = medications.filter(med => {
                const doseValue = med[timeField];
                const isValid = doseValue && (typeof doseValue === 'boolean' ? doseValue : doseValue > 0);
                
                console.log(`   - ${med.name}: ${timeField}=${doseValue} (${typeof doseValue}) -> ${isValid ? 'INCLUDED' : 'EXCLUDED'}`);
                
                return isValid;
            });
            
            console.log(`   📊 Result: ${filteredMeds.length} medications would be marked for ${timeOfDay}`);
            filteredMeds.forEach(med => {
                console.log(`      ✓ ${med.name} (dose: ${med[timeField]})`);
            });
            
            return filteredMeds;
        };
        
        const morningMeds = testTimeFiltering('morning');
        const afternoonMeds = testTimeFiltering('afternoon');
        const nightMeds = testTimeFiltering('night');
        
        console.log('\n📋 SUMMARY:');
        console.log(`   - Morning: ${morningMeds.length} medications`);
        console.log(`   - Afternoon: ${afternoonMeds.length} medications`);
        console.log(`   - Night: ${nightMeds.length} medications`);
        
        // Test the actual backend logic simulation
        console.log('\n🧪 Simulating backend mark-taken logic...');
        
        const simulateMarkTaken = async (timeOfDay) => {
            console.log(`\n--- Simulating ${timeOfDay.toUpperCase()} ---`);
            
            const timeField = `${timeOfDay}_dose`;
            const allMedications = await db.collection('medications').find({ patient_id: patient._id.toString() }).toArray();
            
            const filteredMedications = allMedications.filter(med => {
                const doseValue = med[timeField];
                const result = doseValue && (typeof doseValue === 'boolean' ? doseValue : doseValue > 0);
                console.log(`   Filter check: ${med.name} -> ${result} (${timeField}=${doseValue})`);
                return result;
            });
            
            console.log(`   Filtered result: ${filteredMedications.length} medications`);
            
            if (filteredMedications.length === 0) {
                console.log(`   ❌ No medications scheduled for ${timeOfDay}`);
                return {
                    success: false,
                    error: `No medications scheduled for ${timeOfDay}`
                };
            }
            
            // Simulate the database updates
            console.log(`   ✅ Would mark ${filteredMedications.length} medications as taken`);
            filteredMedications.forEach(med => {
                const dosageAmount = med[timeField] || 1;
                console.log(`      - ${med.name}: would decrease count by ${dosageAmount} (from ${med.current_count} to ${med.current_count - dosageAmount})`);
            });
            
            return {
                success: true,
                medications_marked: filteredMedications.map(m => m.name)
            };
        };
        
        await simulateMarkTaken('morning');
        await simulateMarkTaken('afternoon');
        await simulateMarkTaken('night');
        
        console.log('\n🔍 DIAGNOSIS:');
        if (morningMeds.length === 0) {
            console.log('❌ MORNING ISSUE: No medications have morning_dose set properly');
            console.log('   Fix: Ensure medications have morning_dose = true or morning_dose = 1 (or higher number)');
        }
        
        if (afternoonMeds.length === 0) {
            console.log('❌ AFTERNOON ISSUE: No medications have afternoon_dose set properly');
            console.log('   Fix: Ensure medications have afternoon_dose = true or afternoon_dose = 1 (or higher number)');
        }
        
        if (nightMeds.length > 0) {
            console.log('✅ NIGHT works correctly: Medications have proper night_dose values');
        }
        
        console.log('\n💡 RECOMMENDED FIXES:');
        console.log('1. Check your medication data in MongoDB');
        console.log('2. Ensure morning_dose and afternoon_dose fields are set correctly');
        console.log('3. Use updateMany to fix existing medications:');
        console.log('   db.medications.updateMany(');
        console.log('     { patient_id: "YOUR_PATIENT_ID" },');
        console.log('     { $set: { morning_dose: 1, afternoon_dose: 1 } }');
        console.log('   )');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

debugMedicationMarking();
