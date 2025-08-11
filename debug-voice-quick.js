// Quick debug - paste this into browser console while on patient dashboard
// This will override the voice logging function with extra debugging

console.log("🔧 Applying voice logging debug override...");

// Override the handleMedicationTaken function to add more debugging
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (url.includes('/medications/mark-taken')) {
    console.log("🎯 INTERCEPTED mark-taken request:");
    console.log("   URL:", url);
    console.log("   Options:", options);
    console.log("   Body:", options.body);
    
    const body = JSON.parse(options.body);
    console.log(`   🕐 Time of day: ${body.timeOfDay}`);
    console.log(`   👤 Patient ID: ${body.patient_id}`);
  }
  
  return originalFetch.apply(this, arguments);
};

console.log("✅ Debug override applied! Now try voice logging and watch the console.");
console.log("📝 Expected flow:");
console.log("   1. Say 'I took my morning pill'");
console.log("   2. Should see: 🌅 Detected MORNING medication");
console.log("   3. Should see: 🎯 INTERCEPTED mark-taken request");
console.log("   4. Should see: 📱 Voice logging: Attempting to mark...");
console.log("   5. Should see: 🔥 API Response Status & Data");
