const { MongoClient } = require('mongodb');

// Use default values since we don't have dotenv
const uri = 'mongodb://localhost:27017';
const dbName = 'pillbridge';

async function addSampleMedications() {
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    // First, let's check if there are any users to assign medications to
    const users = await db.collection('users').find({ role: 'patient' }).toArray();
    console.log('Found patients:', users.length);
    
    if (users.length === 0) {
      console.log('No patients found. Please register a patient account first.');
      return;
    }
    
    const patientId = users[0]._id.toString();
    console.log('Using patient ID:', patientId);
    
    // Sample medications with placeholder images
    const sampleMedications = [
      {
        patient_id: patientId,
        name: 'Aspirin',
        dosage: '325mg',
        instructions: 'Take one tablet daily with food',
        morning_dose: 1,
        afternoon_dose: 0,
        night_dose: 0,
        current_count: 30,
        low_stock_threshold: 5,
        image_url: 'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Aspirin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        patient_id: patientId,
        name: 'Lisinopril',
        dosage: '10mg',
        instructions: 'Take once daily in the morning',
        morning_dose: 1,
        afternoon_dose: 0,
        night_dose: 0,
        current_count: 25,
        low_stock_threshold: 5,
        image_url: 'https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=Lisinopril',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        patient_id: patientId,
        name: 'Metformin',
        dosage: '500mg',
        instructions: 'Take twice daily with meals',
        morning_dose: 1,
        afternoon_dose: 0,
        night_dose: 1,
        current_count: 60,
        low_stock_threshold: 10,
        image_url: 'https://via.placeholder.com/200x200/45B7D1/FFFFFF?text=Metformin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        patient_id: patientId,
        name: 'Omeprazole',
        dosage: '20mg',
        instructions: 'Take before breakfast',
        morning_dose: 1,
        afternoon_dose: 0,
        night_dose: 0,
        current_count: 20,
        low_stock_threshold: 5,
        image_url: 'https://via.placeholder.com/200x200/F7DC6F/000000?text=Omeprazole',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        patient_id: patientId,
        name: 'Simvastatin',
        dosage: '40mg',
        instructions: 'Take once daily at bedtime',
        morning_dose: 0,
        afternoon_dose: 0,
        night_dose: 1,
        current_count: 15,
        low_stock_threshold: 5,
        image_url: 'https://via.placeholder.com/200x200/BB8FCE/FFFFFF?text=Simvastatin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    
    // Clear existing medications for this patient
    await db.collection('medications').deleteMany({ patient_id: patientId });
    console.log('Cleared existing medications for patient');
    
    // Insert sample medications
    const result = await db.collection('medications').insertMany(sampleMedications);
    console.log(`Inserted ${result.insertedCount} sample medications`);
    
    // Verify insertion
    const count = await db.collection('medications').countDocuments({ patient_id: patientId });
    console.log(`Total medications for patient: ${count}`);
    
    console.log('Sample medications added successfully!');
    console.log('You can now test the Pill Game functionality.');
    
  } catch (error) {
    console.error('Error adding sample medications:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

addSampleMedications();
